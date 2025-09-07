import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  DollarSign, 
  Star, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Target,
  Award,
  Activity
} from 'lucide-react'

function ProviderStats({ stats }) {
  const [commissionRate, setCommissionRate] = useState(0.15) // Default to 15%
  
  // Fetch current provider commission rate
  useEffect(() => {
    const loadRate = async () => {
      try {
        const resp = await fetch('/api/provider/commission-summary')
        if (resp.ok) {
          const data = await resp.json()
          console.log('🔍 ProviderStats API response:', data)
          if (data?.summary?.commissionRate) {
            setCommissionRate(data.summary.commissionRate)
            console.log('✅ ProviderStats set rate to:', data.summary.commissionRate)
          }
        }
      } catch (e) {
        console.error('❌ ProviderStats error loading rate:', e)
      }
    }
    loadRate()
  }, [])

  const {
    totalBookings = 0,
    thisMonthBookings = 0,
    completedBookings = 0,
    averageRating = 0,
    totalReviews = 0,
    responseTime = 0,
    conversionRate = 0,
    repeatCustomers = 0,
    totalRevenue = 0,
    thisMonthRevenue = 0,
    growth = {}
  } = stats || {}

  // Calculate completion rate
  const completionRate = totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0

  // Format currency
  const formatCurrency = (amount) => {
    return `GHS ${(amount || 0).toLocaleString()}`
  }

  // Format response time
  const formatResponseTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Quick Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {/* Total Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">{totalBookings}</div>
            <div className="flex items-center text-xs text-muted-foreground flex-wrap">
              <span className="mr-1">This month:</span>
              <span className="font-medium">{thisMonthBookings}</span>
              {growth.bookings && (
                <div className={`flex items-center ml-2 ${growth.bookings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {growth.bookings >= 0 ? <TrendingUp className="h-2 w-2 sm:h-3 sm:w-3" /> : <TrendingDown className="h-2 w-2 sm:h-3 sm:w-3" />}
                  <span className="ml-1 text-xs">{Math.abs(growth.bookings)}%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Average Rating */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold flex items-center">
              {averageRating.toFixed(1)}
              <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 fill-current ml-1" />
            </div>
            <p className="text-xs text-muted-foreground">
              Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        {/* Response Time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">{formatResponseTime(responseTime)}</div>
            <p className="text-xs text-muted-foreground">
              Average response to messages
            </p>
          </CardContent>
        </Card>

        {/* Completion Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Completion Rate</CardTitle>
            <Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">{completionRate}%</div>
            <div className="mt-2">
              <Progress value={completionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
              Performance Metrics
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Key performance indicators for your business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {/* Conversion Rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm font-medium">Booking Conversion Rate</span>
                <span className="text-xs sm:text-sm font-bold">{conversionRate}%</span>
              </div>
              <Progress value={conversionRate} className="h-2" />
              <p className="text-xs text-gray-500">
                Percentage of inquiries that become bookings
              </p>
            </div>

            {/* Repeat Customers */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm font-medium">Repeat Customers</span>
                <span className="text-xs sm:text-sm font-bold">{repeatCustomers}%</span>
              </div>
              <Progress value={repeatCustomers} className="h-2" />
              <p className="text-xs text-gray-500">
                Customers who book multiple services
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              <span className="text-xs sm:text-sm font-medium">Rating Quality</span>
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const percentage = totalReviews > 0 ? Math.random() * 30 + 10 : 0 // Mock data
                  return (
                    <div key={rating} className="flex flex-col items-center flex-1 min-w-[30px] sm:min-w-[40px]">
                      <div className="text-xs font-medium">{rating}★</div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                        <div 
                          className="bg-yellow-500 h-1.5 sm:h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500">{Math.round(percentage)}%</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
              Revenue Overview
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Your earnings and financial performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-gray-600">Total Revenue</span>
                <span className="text-sm sm:text-base lg:text-lg font-bold">{formatCurrency(totalRevenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-gray-600">This Month</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base lg:text-lg font-bold">{formatCurrency(thisMonthRevenue)}</span>
                  {growth.revenue && (
                    <Badge variant={growth.revenue >= 0 ? "default" : "destructive"} className="text-xs">
                      {growth.revenue >= 0 ? '+' : ''}{growth.revenue}%
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Revenue Breakdown */}
              <div className="pt-2 sm:pt-3 border-t">
                <h4 className="text-xs sm:text-sm font-medium mb-2">This Month Breakdown</h4>
                <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gross Revenue</span>
                    <span className="font-medium">{formatCurrency(thisMonthRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform Fee ({(commissionRate * 100).toFixed(1)}%)</span>
                    <span className="font-medium text-red-600">-{formatCurrency(thisMonthRevenue * commissionRate)}</span>
                  </div>
                  <div className="flex justify-between pt-1 sm:pt-2 border-t font-bold">
                    <span>Net Earnings</span>
                    <span className="text-green-600">{formatCurrency(thisMonthRevenue * (1 - commissionRate))}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievement Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            Achievements & Milestones
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Your professional accomplishments and badges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {/* Achievement badges based on stats */}
            {totalBookings >= 10 && (
              <Badge variant="secondary" className="flex items-center gap-1 px-2 sm:px-3 py-1 text-xs">
                <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                10+ Bookings
              </Badge>
            )}
            {averageRating >= 4.5 && (
              <Badge variant="secondary" className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-yellow-100 text-yellow-800 text-xs">
                <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                Top Rated
              </Badge>
            )}
            {completionRate >= 95 && (
              <Badge variant="secondary" className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-green-100 text-green-800 text-xs">
                <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                Reliable Provider
              </Badge>
            )}
            {responseTime <= 30 && (
              <Badge variant="secondary" className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 text-xs">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                Quick Responder
              </Badge>
            )}
            {repeatCustomers >= 20 && (
              <Badge variant="secondary" className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-purple-100 text-purple-800 text-xs">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                Customer Favorite
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProviderStats 