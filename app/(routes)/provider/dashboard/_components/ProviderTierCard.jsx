'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Star, 
  TrendingUp, 
  Users, 
  DollarSign, 
  CheckCircle, 
  Clock,
  RefreshCw,
  Award
} from 'lucide-react'
import { toast } from 'sonner'

function ProviderTierCard() {
  const [tierInfo, setTierInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    loadTierInfo()
  }, [])

  const loadTierInfo = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/provider/update-tier')
      if (response.ok) {
        const data = await response.json()
        setTierInfo(data)
      } else {
        // If provider doesn't have tier properties, try to initialize them
        if (response.status === 404) {
          toast.info('Initializing your provider tier. Please wait...')
          await updateTier() // This will initialize the tier properties
        } else {
          throw new Error('Failed to load tier information')
        }
      }
    } catch (error) {
      console.error('Error loading tier info:', error)
      toast.error('Failed to load tier information')
    } finally {
      setIsLoading(false)
    }
  }

  const updateTier = async () => {
    try {
      setIsUpdating(true)
      const response = await fetch('/api/provider/update-tier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ forceUpdate: true })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.tierChanged) {
          toast.success(`Congratulations! Your tier has been upgraded to ${data.newTier}`)
        } else {
          toast.info('Your tier is up to date')
        }
        loadTierInfo() // Reload to get updated data
      } else {
        throw new Error('Failed to update tier')
      }
    } catch (error) {
      console.error('Error updating tier:', error)
      toast.error('Failed to update tier')
    } finally {
      setIsUpdating(false)
    }
  }

  const getTierColor = (tier) => {
    const colors = {
      NEW: 'bg-gray-100 text-gray-800',
      VERIFIED: 'bg-blue-100 text-blue-800',
      PREMIUM: 'bg-purple-100 text-purple-800',
      ENTERPRISE: 'bg-green-100 text-green-800'
    }
    return colors[tier] || colors.NEW
  }

  const getTierIcon = (tier) => {
    const icons = {
      NEW: <Users className="w-4 h-4" />,
      VERIFIED: <CheckCircle className="w-4 h-4" />,
      PREMIUM: <Award className="w-4 h-4" />,
      ENTERPRISE: <TrendingUp className="w-4 h-4" />
    }
    return icons[tier] || icons.NEW
  }

  const getProgressToNextTier = () => {
    if (!tierInfo) return { nextTier: null, progress: 0, requirements: [] }

    const { currentTier, performanceMetrics, tierRequirements } = tierInfo
    const metrics = performanceMetrics

    if (currentTier === 'ENTERPRISE') {
      return { nextTier: null, progress: 100, requirements: [] }
    }

    const tierOrder = ['NEW', 'VERIFIED', 'PREMIUM', 'ENTERPRISE']
    const currentIndex = tierOrder.indexOf(currentTier)
    const nextTier = tierOrder[currentIndex + 1]
    
    if (!nextTier || !tierRequirements[nextTier]) {
      return { nextTier: null, progress: 100, requirements: [] }
    }

    const requirements = tierRequirements[nextTier]
    const progressItems = []

    // Calculate progress for each requirement
    if (requirements.completedBookings) {
      const progress = Math.min((metrics.completedBookings / requirements.completedBookings) * 100, 100)
      progressItems.push({
        label: 'Completed Bookings',
        current: metrics.completedBookings,
        required: requirements.completedBookings,
        progress,
        met: metrics.completedBookings >= requirements.completedBookings
      })
    }

    if (requirements.averageRating) {
      const progress = Math.min((metrics.averageRating / requirements.averageRating) * 100, 100)
      progressItems.push({
        label: 'Average Rating',
        current: metrics.averageRating.toFixed(1),
        required: requirements.averageRating.toFixed(1),
        progress,
        met: metrics.averageRating >= requirements.averageRating
      })
    }

    if (requirements.totalRevenue) {
      const progress = Math.min((metrics.totalRevenue / requirements.totalRevenue) * 100, 100)
      progressItems.push({
        label: 'Total Revenue',
        current: `GHS ${metrics.totalRevenue.toFixed(2)}`,
        required: `GHS ${requirements.totalRevenue.toFixed(2)}`,
        progress,
        met: metrics.totalRevenue >= requirements.totalRevenue
      })
    }

    if (requirements.isVerified) {
      progressItems.push({
        label: 'Account Verification',
        current: metrics.isVerified ? 'Verified' : 'Not Verified',
        required: 'Verified',
        progress: metrics.isVerified ? 100 : 0,
        met: metrics.isVerified
      })
    }

    const overallProgress = progressItems.reduce((sum, item) => sum + item.progress, 0) / progressItems.length

    return { nextTier, progress: overallProgress, requirements: progressItems }
  }

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

  if (!tierInfo) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Unable to load tier information</p>
        </CardContent>
      </Card>
    )
  }

  const { currentTier, performanceMetrics, commissionRate } = tierInfo
  const progressInfo = getProgressToNextTier()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getTierIcon(currentTier)}
            Provider Tier Status
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={updateTier}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Update Tier
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Tier */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Current Tier</p>
            <Badge className={`${getTierColor(currentTier)} text-lg px-3 py-1`}>
              {currentTier}
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Commission Rate</p>
            <p className="text-2xl font-bold text-green-600">
              {(commissionRate * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mx-auto mb-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600">Completed</p>
            <p className="font-semibold">{performanceMetrics.completedBookings}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full mx-auto mb-2">
              <Star className="w-4 h-4 text-yellow-600" />
            </div>
            <p className="text-sm text-gray-600">Rating</p>
            <p className="font-semibold">{performanceMetrics.averageRating.toFixed(1)}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mx-auto mb-2">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-sm text-gray-600">Revenue</p>
            <p className="font-semibold">GHS {performanceMetrics.totalRevenue.toFixed(0)}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full mx-auto mb-2">
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600">Months</p>
            <p className="font-semibold">{performanceMetrics.accountAgeMonths}</p>
          </div>
        </div>

        {/* Progress to Next Tier */}
        {progressInfo.nextTier && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Progress to {progressInfo.nextTier}</p>
              <p className="text-sm text-gray-600">{progressInfo.progress.toFixed(0)}%</p>
            </div>
            <Progress value={progressInfo.progress} className="mb-4" />
            
            <div className="space-y-2">
              {progressInfo.requirements.map((req, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    {req.met ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-400" />
                    )}
                    {req.label}
                  </span>
                  <span className={req.met ? 'text-green-600' : 'text-gray-600'}>
                    {req.current} / {req.required}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentTier === 'ENTERPRISE' && (
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="font-semibold text-green-800">Congratulations!</p>
            <p className="text-sm text-green-600">You've reached the highest tier</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ProviderTierCard
