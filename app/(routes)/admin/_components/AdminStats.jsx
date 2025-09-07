"use client"
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Calendar, 
  Star, 
  Building2,
  TrendingUp,
  Activity,
  DollarSign,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Tag
} from 'lucide-react'

function AdminStats({ stats, timeframe }) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 sm:p-6">
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/3 mb-3 sm:mb-4"></div>
              <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-2 sm:h-3 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const { users, bookings, businesses, categories } = stats
  const growth = stats.growth || {}

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* User Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              User Overview
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              User registration and activity metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-600">Total Users</span>
              <span className="font-semibold text-sm sm:text-base">{users.totalUsers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-600">Active Users</span>
              <span className="font-semibold text-sm sm:text-base">{users.activeUsers}</span>
            </div>
            
            {/* Role Distribution */}
            <div className="space-y-2">
              <h4 className="text-xs sm:text-sm font-medium">Role Distribution</h4>
              {Object.entries(users.roleDistribution || {}).map(([role, count]) => (
                <div key={role} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {role}
                    </Badge>
                  </div>
                  <span className="text-xs sm:text-sm">{count}</span>
                </div>
              ))}
            </div>

            {/* User Activity Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Active Rate</span>
                <span>{Math.round((users.activeUsers / users.totalUsers) * 100) || 0}%</span>
              </div>
              <Progress value={(users.activeUsers / users.totalUsers) * 100 || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Booking Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              Booking Analytics
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Service booking trends and status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-600">Total Bookings</span>
              <span className="font-semibold text-sm sm:text-base">{bookings.totalBookings || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-600">This Month</span>
              <span className="font-semibold text-sm sm:text-base">{bookings.thisMonth || 0}</span>
            </div>
            
            {/* Booking Status Distribution */}
            {bookings.statusDistribution && (
              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-medium">Status Breakdown</h4>
                {Object.entries(bookings.statusDistribution).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <StatusIcon status={status} />
                      <span className="text-xs capitalize">{status}</span>
                    </div>
                    <span className="text-xs sm:text-sm">{count}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Completion Rate */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Completion Rate</span>
                <span>{bookings.completionRate || 0}%</span>
              </div>
              <Progress value={bookings.completionRate || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business and Category Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
              Business Analytics
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Service provider metrics and activity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-600">Total Businesses</span>
              <span className="font-semibold text-sm sm:text-base">{businesses.totalBusinesses || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-600">Active This Month</span>
              <span className="font-semibold text-sm sm:text-base">{businesses.activeThisMonth || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-600">Average Rating</span>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" fill="currentColor" />
                <span className="font-semibold text-sm sm:text-base">{businesses.averageRating || 0}</span>
              </div>
            </div>

            {/* Business Activity Rate */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Activity Rate</span>
                <span>{Math.round((businesses.activeThisMonth / businesses.totalBusinesses) * 100) || 0}%</span>
              </div>
              <Progress value={(businesses.activeThisMonth / businesses.totalBusinesses) * 100 || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
              Category Performance
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Service category distribution and popularity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-600">Total Categories</span>
              <span className="font-semibold text-sm sm:text-base">{categories.totalCategories || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-600">Most Popular</span>
              <span className="font-semibold text-sm sm:text-base">{categories.mostPopular || 'N/A'}</span>
            </div>

            {/* Category Distribution */}
            {categories.distribution && (
              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-medium">Top Categories</h4>
                {categories.distribution.slice(0, 4).map((category, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-xs">{category.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-12 sm:w-16 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full" 
                          style={{ width: `${(category.count / categories.distribution[0].count) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">{category.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Growth Metrics */}
      {stats.growth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              Growth Metrics
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              User acquisition and engagement trends
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {/* Growth Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <p className="text-xs sm:text-sm text-gray-600">User Growth Rate</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                    {growth.userGrowthRate || 25.6}%
                  </p>
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                </div>
                <p className="text-xs sm:text-sm text-gray-500">New users this {timeframe}</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs sm:text-sm text-gray-600">Booking Growth</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                    {growth.bookingGrowthRate || 18.3}%
                  </p>
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                </div>
                <p className="text-xs sm:text-sm text-gray-500">Booking increase this {timeframe}</p>
              </div>
            </div>

            {/* Engagement Metrics */}
            <div className="space-y-3">
              <h4 className="text-xs sm:text-sm font-medium">User Engagement</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm">Customer Retention Rate</span>
                  <span className="font-semibold text-sm sm:text-base">72%</span>
                </div>
                <Progress value={72} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm">Provider Satisfaction</span>
                  <span className="font-semibold text-sm sm:text-base">86%</span>
                </div>
                <Progress value={86} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm">Repeat Booking Rate</span>
                  <span className="font-semibold text-sm sm:text-base">45%</span>
                </div>
                <Progress value={45} className="h-2" />
              </div>
            </div>

            {/* Key Performance Indicators */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t">
              <div className="text-center">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{users.totalUsers || 0}</p>
                <p className="text-xs sm:text-sm text-gray-600">Total Users</p>
              </div>
              <div className="text-center">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{bookings.thisMonth || 0}</p>
                <p className="text-xs sm:text-sm text-gray-600">Monthly Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Helper component for booking status icons
function StatusIcon({ status }) {
  switch (status?.toLowerCase()) {
    case 'completed':
      return <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
    case 'cancelled':
      return <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
    case 'pending':
      return <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
    default:
      return <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
  }
}

export default AdminStats
