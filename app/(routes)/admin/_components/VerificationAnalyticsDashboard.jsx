"use client"
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import { 
  Shield, 
  TrendingUp, 
  Database, 
  CheckCircle2, 
  AlertCircle,
  Users,
  Building2,
  CreditCard,
  BarChart3,
  RefreshCw,
  Download
} from 'lucide-react'
import { toast } from 'sonner'

function VerificationAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/verification-analytics')
      const data = await response.json()
      
      if (data.success) {
        setAnalytics(data.analytics)
        setLastRefresh(new Date())
        toast.success('Analytics data refreshed successfully')
      } else {
        toast.error('Failed to fetch analytics data')
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Failed to load analytics dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = () => {
    if (!analytics) return
    
    const dataStr = JSON.stringify(analytics, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `verification-analytics-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Analytics data exported successfully')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-gray-600">Loading verification analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <p className="text-gray-600 mb-4">Failed to load analytics data</p>
        <Button onClick={fetchAnalytics}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-600" />
            Verification Analytics Dashboard
          </h2>
          <p className="text-gray-600 mt-1">
            Comprehensive insights into TIN and Ghana Card verification system
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportData} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={fetchAnalytics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Last Refresh Info */}
      {lastRefresh && (
        <div className="text-sm text-gray-500">
          Last updated: {lastRefresh.toLocaleString()}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              TIN Registry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {analytics.totals.totalTinRecords}
            </div>
            <div className="text-sm text-gray-600">
              {analytics.totals.activeTinRecords} active ({analytics.totals.tinActiveRate}%)
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-green-600" />
              Ghana Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.totals.totalGhanaCardRecords}
            </div>
            <div className="text-sm text-gray-600">
              {analytics.totals.activeGhanaCardRecords} active ({analytics.totals.cardActiveRate}%)
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {analytics.usageStats.tinLookups.successRate}%
            </div>
            <div className="text-sm text-gray-600">
              TIN verification success
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-orange-600" />
              Cross-Reference
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {analytics.crossReferenceStats.crossReferenceRate}%
            </div>
            <div className="text-sm text-gray-600">
              TIN-Card linkage rate
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              TIN Lookup Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Lookups:</span>
              <span className="font-medium">{analytics.usageStats.tinLookups.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Successful:</span>
              <span className="font-medium text-green-600">{analytics.usageStats.tinLookups.successful}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Failed:</span>
              <span className="font-medium text-red-600">{analytics.usageStats.tinLookups.failed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg Response:</span>
              <span className="font-medium">{analytics.usageStats.tinLookups.averageResponseTime}ms</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              Ghana Card Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Verifications:</span>
              <span className="font-medium">{analytics.usageStats.ghanaCardVerifications.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Successful:</span>
              <span className="font-medium text-green-600">{analytics.usageStats.ghanaCardVerifications.successful}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Failed:</span>
              <span className="font-medium text-red-600">{analytics.usageStats.ghanaCardVerifications.failed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg Response:</span>
              <span className="font-medium">{analytics.usageStats.ghanaCardVerifications.averageResponseTime}ms</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              OCR Processing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Processed:</span>
              <span className="font-medium">{analytics.usageStats.ocrProcessing.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Successful:</span>
              <span className="font-medium text-green-600">{analytics.usageStats.ocrProcessing.successful}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Failed:</span>
              <span className="font-medium text-red-600">{analytics.usageStats.ocrProcessing.failed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg Processing:</span>
              <span className="font-medium">{(analytics.usageStats.ocrProcessing.averageProcessingTime / 1000).toFixed(1)}s</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Business Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }) => `${category} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Regional Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Regional Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.regionDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Verification Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={analytics.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="tinLookups" stackId="1" stroke="#8884d8" fill="#8884d8" name="TIN Lookups" />
              <Area type="monotone" dataKey="ghanaCardVerifications" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Ghana Card Verifications" />
              <Area type="monotone" dataKey="ocrProcessing" stackId="1" stroke="#ffc658" fill="#ffc658" name="OCR Processing" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Business Type & Card Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Business Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.businessTypeDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{item.type.replace(/_/g, ' ')}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{item.count}</span>
                    <Badge variant="secondary">{item.percentage}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ghana Card Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.cardStatusDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{item.status}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{item.count}</span>
                    <Badge variant="secondary">{item.percentage}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Quality & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Data Quality Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">TIN Data Completeness:</span>
              <Badge className="bg-green-100 text-green-800">{analytics.dataQuality.tinDataCompleteness}%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Card Data Completeness:</span>
              <Badge className="bg-green-100 text-green-800">{analytics.dataQuality.cardDataCompleteness}%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Overall Quality:</span>
              <Badge className="bg-blue-100 text-blue-800">{analytics.dataQuality.overallQuality}</Badge>
            </div>
            <div className="text-xs text-gray-500 pt-2 border-t">
              Last checked: {new Date(analytics.dataQuality.lastQualityCheck).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Database Health:</span>
              <Badge className="bg-green-100 text-green-800">{analytics.performanceMetrics.databaseHealth}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Query Time:</span>
              <span className="font-medium">{analytics.performanceMetrics.averageQueryTime}ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">System Uptime:</span>
              <Badge className="bg-green-100 text-green-800">{analytics.performanceMetrics.systemUptime}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Error Rate:</span>
              <Badge className="bg-yellow-100 text-yellow-800">{analytics.performanceMetrics.errorRate}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Academic Notice */}
      <Card className="border-2 border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900 mb-2">Academic Simulation Dashboard</h4>
              <p className="text-sm text-yellow-800">
                This verification analytics dashboard demonstrates comprehensive system monitoring and reporting capabilities. 
                In a production environment, this would integrate with real Ghana Revenue Authority and National Identification Authority systems.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default VerificationAnalyticsDashboard





