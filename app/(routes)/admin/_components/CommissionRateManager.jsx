'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { 
  Settings, 
  Edit, 
  Save, 
  X, 
  History, 
  DollarSign,
  Users,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

function CommissionRateManager({ onRatesUpdated }) {
  const [commissionRates, setCommissionRates] = useState({
    NEW: 20.0,
    VERIFIED: 18.0,
    PREMIUM: 15.0,
    ENTERPRISE: 12.0
  })
  const [editingRates, setEditingRates] = useState({})
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [rateHistory, setRateHistory] = useState([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  useEffect(() => {
    loadCommissionRates()
  }, [])

  const loadCommissionRates = async () => {
    try {
      const response = await fetch('/api/admin/commission-rates')
      if (response.ok) {
        const data = await response.json()
        setCommissionRates(data.rates)
      } else {
        // Use default rates if API fails
        console.log('Using default commission rates')
      }
    } catch (error) {
      console.error('Error loading commission rates:', error)
      toast.error('Failed to load commission rates')
    }
  }

  const loadRateHistory = async () => {
    setIsLoadingHistory(true)
    try {
      const response = await fetch('/api/admin/commission-rates/history')
      if (response.ok) {
        const data = await response.json()
        setRateHistory(data.history)
      } else {
        // Mock data for development
        setRateHistory([
          {
            id: '1',
            tier: 'NEW',
            oldRate: 22.0,
            newRate: 20.0,
            changedBy: 'admin@artisanconnect.com',
            changedAt: '2024-01-15T10:30:00Z',
            reason: 'Market adjustment to attract new providers'
          },
          {
            id: '2',
            tier: 'VERIFIED',
            oldRate: 20.0,
            newRate: 18.0,
            changedBy: 'admin@artisanconnect.com',
            changedAt: '2024-01-10T14:15:00Z',
            reason: 'Reward for verified status'
          }
        ])
      }
    } catch (error) {
      console.error('Error loading rate history:', error)
      toast.error('Failed to load rate history')
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const handleEditStart = () => {
    setEditingRates({ ...commissionRates })
    setIsEditing(true)
  }

  const handleEditCancel = () => {
    setEditingRates({})
    setIsEditing(false)
  }

  const handleRateChange = (tier, value) => {
    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue < 0 || numValue > 50) {
      return
    }
    setEditingRates(prev => ({
      ...prev,
      [tier]: numValue
    }))
  }

  const handleSaveRates = async () => {
    // Validation
    const hasChanges = Object.keys(editingRates).some(
      tier => editingRates[tier] !== commissionRates[tier]
    )

    if (!hasChanges) {
      toast.info('No changes to save')
      setIsEditing(false)
      return
    }

    // Validate rates
    const invalidRates = Object.entries(editingRates).filter(
      ([tier, rate]) => rate < 5 || rate > 50
    )

    if (invalidRates.length > 0) {
      toast.error('Commission rates must be between 5% and 50%')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/commission-rates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rates: editingRates,
          reason: 'Admin rate adjustment'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCommissionRates(editingRates)
        setIsEditing(false)
        setEditingRates({})
        toast.success('Commission rates updated successfully!')
        
        // Call the callback to refresh rates in parent component
        if (onRatesUpdated) {
          onRatesUpdated()
        }
        
        // Reload history to show the change
        if (showHistory) {
          loadRateHistory()
        }
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update rates')
      }
    } catch (error) {
      console.error('Error saving commission rates:', error)
      toast.error(error.message || 'Failed to save commission rates')
    } finally {
      setIsSaving(false)
    }
  }

  const tierInfo = {
    NEW: {
      label: 'New Provider',
      description: 'Newly registered providers without verification',
      color: 'bg-gray-100 text-gray-800',
      icon: <Users className="w-4 h-4" />
    },
    VERIFIED: {
      label: 'Verified Provider',
      description: 'Providers with completed verification process',
      color: 'bg-blue-100 text-blue-800',
      icon: <CheckCircle className="w-4 h-4" />
    },
    STANDARD: {
      label: 'Standard Provider',
      description: 'Regular providers with standard commission rates',
      color: 'bg-indigo-100 text-indigo-800',
      icon: <Users className="w-4 h-4" />
    },
    PREMIUM: {
      label: 'Premium Provider',
      description: 'High-performing providers with excellent ratings',
      color: 'bg-purple-100 text-purple-800',
      icon: <DollarSign className="w-4 h-4" />
    },
    ENTERPRISE: {
      label: 'Enterprise Provider',
      description: 'Large-scale service providers with multiple teams',
      color: 'bg-green-100 text-green-800',
      icon: <Settings className="w-4 h-4" />
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Commission Rates Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Commission Rate Management
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Configure commission rates for different provider tiers
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowHistory(true)
                  loadRateHistory()
                }}
              >
                <History className="w-4 h-4 mr-2" />
                View History
              </Button>
              {!isEditing ? (
                <Button onClick={handleEditStart}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Rates
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleEditCancel}
                    disabled={isSaving}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveRates}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(tierInfo).map(([tier, info]) => {
              const currentRate = isEditing ? editingRates[tier] : commissionRates[tier]
              
              return (
                <div key={tier} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${info.color}`}>
                      {info.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold">{info.label}</h3>
                      <p className="text-sm text-gray-600">{info.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={currentRate}
                          onChange={(e) => handleRateChange(tier, e.target.value)}
                          min="5"
                          max="50"
                          step="0.1"
                          className="w-20 text-center"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                    ) : (
                      <Badge variant="secondary" className="text-lg px-3 py-1">
                        {currentRate}%
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {isEditing && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Important Notes:</h4>
                  <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                    <li>• Commission rates must be between 5% and 50%</li>
                    <li>• Changes will apply to all new transactions immediately</li>
                    <li>• Existing pending commissions will use the old rates</li>
                    <li>• All changes are logged for audit purposes</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rate History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Commission Rate Change History</DialogTitle>
            <DialogDescription>
              Track all commission rate changes made by administrators
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-96 overflow-y-auto">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : rateHistory.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Old Rate</TableHead>
                    <TableHead>New Rate</TableHead>
                    <TableHead>Changed By</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rateHistory.map((change) => (
                    <TableRow key={change.id}>
                      <TableCell className="text-sm">
                        {formatDate(change.changedAt)}
                      </TableCell>
                      <TableCell>
                        <Badge className={tierInfo[change.tier]?.color}>
                          {tierInfo[change.tier]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-red-600 font-medium">
                        {change.oldRate}%
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {change.newRate}%
                      </TableCell>
                      <TableCell className="text-sm">
                        {change.changedBy}
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate">
                        {change.reason}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No rate changes found
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistory(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CommissionRateManager
