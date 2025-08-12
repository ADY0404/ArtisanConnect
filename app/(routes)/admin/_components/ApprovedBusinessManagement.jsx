'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  Building2, 
  Calendar, 
  User, 
  Mail, 
  Phone,
  MapPin,
  Star,
  Ban,
  Eye,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'

function ApprovedBusinessManagement() {
  const [businesses, setBusinesses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [showRevokeDialog, setShowRevokeDialog] = useState(false)
  const [revokeReason, setRevokeReason] = useState('')
  const [notifyProvider, setNotifyProvider] = useState(true)
  const [isRevoking, setIsRevoking] = useState(false)

  useEffect(() => {
    fetchApprovedBusinesses()
  }, [])

  const fetchApprovedBusinesses = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/approved-businesses')
      if (response.ok) {
        const data = await response.json()
        setBusinesses(data.businesses || [])
      } else {
        throw new Error('Failed to fetch approved businesses')
      }
    } catch (error) {
      console.error('Error fetching approved businesses:', error)
      toast.error('Failed to load approved businesses')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevokeApproval = async () => {
    if (!selectedBusiness || !revokeReason.trim()) {
      toast.error('Please provide a reason for revocation')
      return
    }

    try {
      setIsRevoking(true)
      const response = await fetch('/api/admin/revoke-business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: selectedBusiness.id,
          reason: revokeReason,
          notifyProvider: notifyProvider
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('Business approval revoked successfully')
        setShowRevokeDialog(false)
        setSelectedBusiness(null)
        setRevokeReason('')
        fetchApprovedBusinesses() // Refresh the list
      } else {
        throw new Error(result.error || 'Failed to revoke approval')
      }
    } catch (error) {
      console.error('Error revoking approval:', error)
      toast.error(error.message || 'Failed to revoke business approval')
    } finally {
      setIsRevoking(false)
    }
  }

  const filteredBusinesses = businesses.filter(business =>
    business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    business.providerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    business.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Approved Business Management
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage and monitor approved businesses on the platform
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchApprovedBusinesses}
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search businesses, providers, or categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-green-600">Total Approved</p>
                  <p className="text-xl font-bold text-green-800">{businesses.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600">Avg Rating</p>
                  <p className="text-xl font-bold text-blue-800">
                    {businesses.length > 0 
                      ? (businesses.reduce((sum, b) => sum + (b.rating || 0), 0) / businesses.length).toFixed(1)
                      : '0.0'
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-600">Active Providers</p>
                  <p className="text-xl font-bold text-purple-800">
                    {businesses.filter(b => b.isActive).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Business List */}
          <div className="space-y-4">
            {filteredBusinesses.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'No businesses match your search' : 'No approved businesses found'}
                </p>
              </div>
            ) : (
              filteredBusinesses.map((business) => (
                <Card key={business.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{business.name}</h3>
                          <Badge variant="secondary">{business.category?.name || 'Unknown'}</Badge>
                          <Badge 
                            variant={business.isActive ? "default" : "secondary"}
                            className={business.isActive ? "bg-green-100 text-green-800" : ""}
                          >
                            {business.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{business.contactPerson || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>{business.providerEmail}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>{business.phone || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{business.address}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>{business.rating?.toFixed(1) || '0.0'} ({business.totalReviews || 0} reviews)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Approved {new Date(business.approvedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedBusiness(business)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedBusiness(business)
                            setShowRevokeDialog(true)
                          }}
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          Revoke
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Revoke Approval Dialog */}
      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Revoke Business Approval
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to revoke approval for <strong>{selectedBusiness?.name}</strong>. 
              This action will deactivate the business and remove it from public listings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason for Revocation *</label>
              <Textarea
                placeholder="Please provide a detailed reason for revoking this business approval..."
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="notifyProvider"
                checked={notifyProvider}
                onChange={(e) => setNotifyProvider(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="notifyProvider" className="text-sm">
                Send notification email to provider
              </label>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeApproval}
              disabled={isRevoking || !revokeReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRevoking ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Revoking...
                </>
              ) : (
                'Revoke Approval'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ApprovedBusinessManagement
