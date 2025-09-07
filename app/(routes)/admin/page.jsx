"use client"
import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Building2, 
  TrendingUp, 
  TrendingDown,
  Activity,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Settings,
  UserCheck,
  MessageSquare
} from 'lucide-react'
import AdminStats from './_components/AdminStats'
import UserManagement from './_components/UserManagement'
import PlatformHealth from './_components/PlatformHealth'
import { toast } from 'sonner'
import RevenueAnalytics from './_components/RevenueAnalytics'
import GrowthMetrics from './_components/GrowthMetrics'
import ReviewModeration from './_components/ReviewModeration'
import ProviderApplications from './_components/ProviderApplications'
import PlatformSettings from './_components/PlatformSettings'
import BusinessApprovalSystem from './_components/BusinessApprovalSystem'
import ApprovedBusinessManagement from './_components/ApprovedBusinessManagement'
import CategoryManagement from './_components/CategoryManagement'

function AdminDashboard() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('30d')

  // Redirect if not admin
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      toast.error('Access denied. Admin privileges required.')
      redirect('/auth/signin')
      return
    }
  }, [session, status])

  // Fetch admin statistics
  useEffect(() => {
    fetchStats()
  }, [timeframe])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/stats?timeframe=${timeframe}&detailed=true`)
      const data = await response.json()
      
      if (data.success) {
        setStats(data)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error)
      toast.error('Failed to load admin statistics')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session?.user || session.user.role !== 'ADMIN') {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-3 sm:gap-4">
            <div className="w-full sm:w-auto">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">
                Welcome back, {session.user.name}.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
              {/* Timeframe Selector */}
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm flex-grow sm:flex-grow-0"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              
              <Button onClick={fetchStats} variant="outline" size="sm" className='flex-shrink-0 text-xs sm:text-sm'>
                <Activity className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Quick Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
            <StatsCard
              title="Total Users"
              value={stats.overview.totalUsers}
              icon={Users}
              trend={stats.growth?.userGrowthRate}
              description="Platform users"
            />
            <StatsCard
              title="Total Bookings"
              value={stats.overview.totalBookings}
              icon={Calendar}
              trend={stats.growth?.bookingGrowthRate}
              description="All-time bookings"
            />
            <StatsCard
              title="Total Revenue"
              value={`GHS ${stats.overview.totalRevenue?.toLocaleString() || 0}`}
              icon={DollarSign}
              trend={stats.growth?.revenueGrowthRate}
              description="Platform revenue"
            />
            <StatsCard
              title="Active Businesses"
              value={stats.overview.totalBusinesses}
              icon={Building2}
              trend={8.1}
              description="Service providers"
            />
          </div>
        )}

        {/* Platform Health Alert */}
        {stats?.health && (
          <div className="mb-4 sm:mb-6">
            <Card className={`border-l-4 ${
              stats.health.status === 'healthy' 
                ? 'border-l-green-500 bg-green-50' 
                : 'border-l-red-500 bg-red-50'
            }`}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center">
                  {stats.health.status === 'healthy' ? (
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2 sm:mr-3" />
                  ) : (
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mr-2 sm:mr-3" />
                  )}
                  <div>
                    <h3 className={`font-medium text-sm sm:text-base ${
                      stats.health.status === 'healthy' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      Platform Status: {stats.health.status.toUpperCase()}
                    </h3>
                    <p className={`text-xs sm:text-sm ${
                      stats.health.status === 'healthy' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stats.health.status === 'healthy' 
                        ? 'All systems operational' 
                        : `Issues detected: ${stats.health.issues?.join(', ')}`
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto pb-2">
            <TabsList className="flex w-full min-w-[700px] sm:min-w-0 sm:grid sm:grid-cols-4 md:grid-cols-8">
              <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">Overview</TabsTrigger>
              <TabsTrigger value="users" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">Users</TabsTrigger>
              <TabsTrigger value="businesses" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">Approvals</TabsTrigger>
              <TabsTrigger value="categories" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">Categories</TabsTrigger>
              <TabsTrigger value="commission" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">Commission</TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">Analytics</TabsTrigger>
              <TabsTrigger value="moderation" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">Moderation</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">Settings</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview">
            <AdminStats stats={stats} timeframe={timeframe} />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="businesses">
            <div className="space-y-6">
              <BusinessApprovalSystem />
              <ApprovedBusinessManagement />
            </div>
          </TabsContent>
          
          <TabsContent value="categories">
            <CategoryManagement />
          </TabsContent>

          <TabsContent value="commission">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Commission Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage commission rates and provider payments
                  </p>
                </div>
                <Button
                  onClick={() => window.open('/admin/commission-management', '_blank')}
                  className="flex items-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Open Full Dashboard
                </Button>
              </div>

              {/* Quick Commission Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Commission</p>
                        <p className="text-xl font-bold">GHS {stats?.overview?.totalCommission?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Active Providers</p>
                        <p className="text-xl font-bold">{stats?.overview?.activeBusinesses || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Commission Rate</p>
                        <p className="text-xl font-bold">{stats?.overview?.averageCommissionRate ? `${stats.overview.averageCommissionRate.toFixed(1)}%` : '0.0%'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <RevenueAnalytics stats={stats} timeframe={timeframe} />
              <GrowthMetrics stats={stats} timeframe={timeframe} />
            </div>
          </TabsContent>

          <TabsContent value="moderation">
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              <ReviewModeration />
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <PlatformSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Stats Card Component
function StatsCard({ title, value, icon: Icon, trend, description }) {
  const isPositive = trend && trend > 0
  const isNegative = trend && trend < 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium">{title}</CardTitle>
        <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-lg sm:text-xl lg:text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground flex items-center">
          {trend ? (
            <span className={`flex items-center mr-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <TrendingUp className="h-2 w-2 sm:h-3 sm:w-3 mr-1" /> : <TrendingDown className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />}
              {Math.abs(trend)}%
            </span>
          ) : (
            <span className="h-4"></span> // Placeholder
          )}
          <span className="text-xs">{description}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export default AdminDashboard
