"use client"
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  TrendingUp, 
  DollarSign, 
  Users, 
  Receipt,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react'

function EnhancedReportingDashboard({ providerEmail, isAdmin = false }) {
  const [reportData, setReportData] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  useEffect(() => {
    loadReportData()
  }, [selectedPeriod, providerEmail])

  const loadReportData = async () => {
    try {
      setIsLoading(true)
      const endpoint = isAdmin 
        ? `/api/admin/reports?period=${selectedPeriod}`
        : `/api/provider/reports?period=${selectedPeriod}`
      
      const response = await fetch(endpoint)
      
      if (response.ok) {
        const data = await response.json()
        setReportData(data.reports)
      } else {
        // Mock data for development
        setReportData(generateMockReportData())
      }
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error loading report data:', error)
      setReportData(generateMockReportData())
    } finally {
      setIsLoading(false)
    }
  }

  const generateMockReportData = () => ({
    summary: {
      totalRevenue: 15420.50,
      totalCommission: 2776.89,
      totalTransactions: 89,
      averageTransactionValue: 173.26,
      commissionRate: 18.0,
      growthRate: 12.5
    },
    monthlyTrends: [
      { month: 'Jan', revenue: 2100, commission: 378, transactions: 12 },
      { month: 'Feb', revenue: 2800, commission: 504, transactions: 16 },
      { month: 'Mar', revenue: 3200, commission: 576, transactions: 18 },
      { month: 'Apr', revenue: 2900, commission: 522, transactions: 15 },
      { month: 'May', revenue: 3500, commission: 630, transactions: 20 },
      { month: 'Jun', revenue: 920, commission: 166, transactions: 8 }
    ],
    paymentMethodBreakdown: [
      { name: 'Paystack', value: 65, amount: 10023.33, color: '#3B82F6' },
      { name: 'Cash', value: 35, amount: 5397.17, color: '#10B981' }
    ],
    serviceTypeBreakdown: [
      { name: 'Standard', value: 70, amount: 10794.35, color: '#6B7280' },
      { name: 'Emergency', value: 20, amount: 3084.10, color: '#EF4444' },
      { name: 'Recurring', value: 10, amount: 1542.05, color: '#8B5CF6' }
    ],
    topPerformingServices: [
      { service: 'Plumbing Repair', revenue: 4200, transactions: 24, avgValue: 175 },
      { service: 'Electrical Work', revenue: 3800, transactions: 19, avgValue: 200 },
      { service: 'Cleaning Service', revenue: 2900, transactions: 32, avgValue: 91 },
      { service: 'Painting', revenue: 2400, transactions: 12, avgValue: 200 },
      { service: 'Carpentry', revenue: 2120, transactions: 8, avgValue: 265 }
    ],
    commissionTrends: [
      { date: '2024-01-01', earned: 378, owed: 0 },
      { date: '2024-02-01', earned: 504, owed: 45 },
      { date: '2024-03-01', earned: 576, owed: 120 },
      { date: '2024-04-01', earned: 522, owed: 89 },
      { date: '2024-05-01', earned: 630, owed: 156 },
      { date: '2024-06-01', earned: 166, owed: 285 }
    ]
  })

  const formatCurrency = (amount) => `GHS ${amount.toFixed(2)}`

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {isAdmin ? 'Platform Analytics' : 'Performance Reports'}
          </h2>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadReportData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Period Selection */}
      <div className="flex gap-2">
        {['7d', '30d', '90d', '1y'].map(period => (
          <Button
            key={period}
            variant={selectedPeriod === period ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod(period)}
          >
            {period === '7d' ? '7 Days' : 
             period === '30d' ? '30 Days' : 
             period === '90d' ? '90 Days' : '1 Year'}
          </Button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(reportData.summary.totalRevenue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">
                +{reportData.summary.growthRate}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Commission</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(reportData.summary.totalCommission)}
                </p>
              </div>
              <Receipt className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex items-center mt-2">
              <span className="text-sm text-muted-foreground">
                {reportData.summary.commissionRate}% rate
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">
                  {reportData.summary.totalTransactions}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <div className="flex items-center mt-2">
              <span className="text-sm text-muted-foreground">
                Avg: {formatCurrency(reportData.summary.averageTransactionValue)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Growth Rate</p>
                <p className="text-2xl font-bold">
                  +{reportData.summary.growthRate}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
            <div className="flex items-center mt-2">
              <span className="text-sm text-muted-foreground">
                vs last period
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
          <TabsTrigger value="commission">Commission Analysis</TabsTrigger>
          <TabsTrigger value="breakdown">Payment Breakdown</TabsTrigger>
          <TabsTrigger value="services">Service Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={reportData.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commission">
          <Card>
            <CardHeader>
              <CardTitle>Commission Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.commissionTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Line 
                    type="monotone" 
                    dataKey="earned" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Commission Earned"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="owed" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    name="Commission Owed"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={reportData.paymentMethodBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {reportData.paymentMethodBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Types</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={reportData.serviceTypeBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {reportData.serviceTypeBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.topPerformingServices.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{service.service}</p>
                      <p className="text-sm text-muted-foreground">
                        {service.transactions} transactions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(service.revenue)}</p>
                      <p className="text-sm text-muted-foreground">
                        Avg: {formatCurrency(service.avgValue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default EnhancedReportingDashboard
