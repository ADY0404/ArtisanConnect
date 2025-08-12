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
  Crown, 
  Calendar, 
  User, 
  Mail, 
  Star,
  TrendingUp,
  TrendingDown,
  Search,
  RefreshCw,
  Award,
  DollarSign
} from 'lucide-react'
import { toast } from 'sonner'

function PremiumProviderManagement() {
  const [premiumProviders, setPremiumProviders] = useState([])
  const [standardProviders, setStandardProviders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [showPromoteDialog, setShowPromoteDialog] = useState(false)
  const [showDemoteDialog, setShowDemoteDialog] = useState(false)
  const [actionReason, setActionReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      setIsLoading(true)
      
      // Fetch premium providers
      const premiumResponse = await fetch('/api/admin/promote-premium')
      if (premiumResponse.ok) {
        const premiumData = await premiumResponse.json()
        setPremiumProviders(premiumData.providers || [])
      }

      // Fetch standard providers (approved but not premium)
      const standardResponse = await fetch('/api/admin/approved-businesses?tier=standard')
      if (standardResponse.ok) {
        const standardData = await standardResponse.json()
        setStandardProviders(standardData.businesses?.filter(b => !b.isPremiumProvider) || [])
      }
    } catch (error) {
      console.error('Error fetching providers:', error)
      toast.error('Failed to load provider data')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePromoteToPremium = async () => {
    if (!selectedProvider || !actionReason.trim()) {
      toast.error('Please provide a reason for promotion')
      return
    }

    try {
      setIsProcessing(true)
      const response = await fetch('/api/admin/promote-premium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: selectedProvider.id,
          reason: actionReason
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('Provider promoted to premium successfully')
        setShowPromoteDialog(false)
        setSelectedProvider(null)
        setActionReason('')
        fetchProviders() // Refresh the lists
      } else {
        throw new Error(result.error || 'Failed to promote provider')
      }
    } catch (error) {
      console.error('Error promoting provider:', error)
      toast.error(error.message || 'Failed to promote provider')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDemoteFromPremium = async () => {
    if (!selectedProvider || !actionReason.trim()) {
      toast.error('Please provide a reason for demotion')
      return
    }

    try {
      setIsProcessing(true)
      const response = await fetch(`/api/admin/promote-premium?businessId=${selectedProvider.id}&reason=${encodeURIComponent(actionReason)}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('Provider demoted from premium successfully')
        setShowDemoteDialog(false)
        setSelectedProvider(null)
        setActionReason('')
        fetchProviders() // Refresh the lists
      } else {
        throw new Error(result.error || 'Failed to demote provider')
      }
    } catch (error) {
      console.error('Error demoting provider:', error)
      toast.error(error.message || 'Failed to demote provider')
    } finally {
      setIsProcessing(false)
    }
  }

  const filteredPremiumProviders = premiumProviders.filter(provider =>
    provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.providerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredStandardProviders = standardProviders.filter(provider =>
    provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.providerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.category.toLowerCase().includes(searchTerm.toLowerCase())
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
                <Crown className="w-5 h-5 text-yellow-600" />
                Premium Provider Management
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage premium tier promotions and benefits
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProviders}
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search providers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-yellow-600">Premium Providers</p>
                  <p className="text-xl font-bold text-yellow-800">{premiumProviders.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600">Standard Providers</p>
                  <p className="text-xl font-bold text-blue-800">{standardProviders.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-green-600">Premium Rate</p>
                  <p className="text-xl font-bold text-green-800">15%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Providers Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-600" />
              Premium Providers ({filteredPremiumProviders.length})
            </h3>
            
            {filteredPremiumProviders.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Crown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'No premium providers match your search' : 'No premium providers yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPremiumProviders.map((provider) => (
                  <Card key={provider.id} className="border-yellow-200 bg-yellow-50/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold">{provider.name}</h4>
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Crown className="w-3 h-3 mr-1" />
                              Premium
                            </Badge>
                            <Badge variant="secondary">{provider.category}</Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              <span>{provider.providerEmail}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span>{provider.rating?.toFixed(1) || '0.0'} ({provider.totalReviews || 0} reviews)</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Promoted {new Date(provider.premiumPromotedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>By {provider.premiumPromotedBy}</span>
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedProvider(provider)
                            setShowDemoteDialog(true)
                          }}
                        >
                          <TrendingDown className="w-4 h-4 mr-2" />
                          Demote
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Standard Providers Section */}
            <h3 className="text-lg font-semibold flex items-center gap-2 mt-8">
              <User className="w-5 h-5 text-blue-600" />
              Standard Providers ({filteredStandardProviders.length})
            </h3>
            
            {filteredStandardProviders.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'No standard providers match your search' : 'No standard providers found'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredStandardProviders.slice(0, 10).map((provider) => (
                  <Card key={provider.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold">{provider.name}</h4>
                            <Badge variant="secondary">{provider.category}</Badge>
                            <Badge variant="outline">Standard (18%)</Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              <span>{provider.providerEmail}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span>{provider.rating?.toFixed(1) || '0.0'} ({provider.totalReviews || 0} reviews)</span>
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={() => {
                            setSelectedProvider(provider)
                            setShowPromoteDialog(true)
                          }}
                          className="bg-yellow-600 hover:bg-yellow-700"
                        >
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Promote to Premium
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredStandardProviders.length > 10 && (
                  <p className="text-center text-sm text-gray-500">
                    ... and {filteredStandardProviders.length - 10} more providers
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Promote Dialog */}
      <AlertDialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-600" />
              Promote to Premium
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to promote <strong>{selectedProvider?.name}</strong> to Premium tier. 
              This will reduce their commission rate to 15% and provide premium benefits.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason for Promotion *</label>
              <Textarea
                placeholder="Please provide a reason for promoting this provider to premium..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePromoteToPremium}
              disabled={isProcessing || !actionReason.trim()}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Promoting...
                </>
              ) : (
                'Promote to Premium'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Demote Dialog */}
      <AlertDialog open={showDemoteDialog} onOpenChange={setShowDemoteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              Demote from Premium
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to demote <strong>{selectedProvider?.name}</strong> from Premium tier. 
              This will increase their commission rate back to 18% and remove premium benefits.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason for Demotion *</label>
              <Textarea
                placeholder="Please provide a reason for demoting this provider from premium..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDemoteFromPremium}
              disabled={isProcessing || !actionReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Demoting...
                </>
              ) : (
                'Demote from Premium'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default PremiumProviderManagement
