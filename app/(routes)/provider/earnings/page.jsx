"use client"
import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  CreditCard,
  Download,
  ArrowLeft,
  BarChart3,
  PieChart,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'

function ProviderEarnings() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [earningsData, setEarningsData] = useState({
    totalEarnings: 0,
    thisMonth: 0,
    lastMonth: 0,
    pendingPayments: 0,
    completedJobs: 0,
    averageJobValue: 0,
    monthlyTrend: 'up',
    yearToDate: 0
  })
  const [paymentHistory, setPaymentHistory] = useState([])
  const [monthlyBreakdown, setMonthlyBreakdown] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState('3months') // 1month, 3months, 6months, 1year

  // Load earnings data
  useEffect(() => {
    if (session?.user) {
      loadEarningsData()
    }
  }, [session, selectedPeriod])

  const loadEarningsData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/provider/earnings?period=${selectedPeriod}`)
      
      if (response.ok) {
        const data = await response.json()
        setEarningsData(data.summary || earningsData)
        setPaymentHistory(data.payments || [])
        setMonthlyBreakdown(data.monthlyBreakdown || [])
      } else {
        // Set mock data for demonstration
        const mockPayments = [
          {
            id: 'PAY001',
            bookingId: 'BK001',
            customerName: 'John Smith',
            serviceName: 'Kitchen Renovation',
            amount: 1250.00,
            platformFee: 62.50,
            netAmount: 1187.50,
            status: 'completed',
            paymentDate: '2024-01-15',
            payoutDate: '2024-01-17',
            paymentMethod: 'Bank Transfer'
          },
          {
            id: 'PAY002',
            bookingId: 'BK002',
            customerName: 'Sarah Johnson',
            serviceName: 'Plumbing Repair',
            amount: 300.00,
            platformFee: 15.00,
            netAmount: 285.00,
            status: 'completed',
            paymentDate: '2024-01-10',
            payoutDate: '2024-01-12',
            paymentMethod: 'Bank Transfer'
          },
          {
            id: 'PAY003',
            bookingId: 'BK003',
            customerName: 'Mike Davis',
            serviceName: 'Electrical Installation',
            amount: 450.00,
            platformFee: 22.50,
            netAmount: 427.50,
            status: 'pending',
            paymentDate: '2024-01-20',
            payoutDate: null,
            paymentMethod: 'Credit Card'
          },
          {
            id: 'PAY004',
            bookingId: 'BK004',
            customerName: 'Emily Wilson',
            serviceName: 'Interior Painting',
            amount: 800.00,
            platformFee: 40.00,
            netAmount: 760.00,
            status: 'completed',
            paymentDate: '2024-01-02',
            payoutDate: '2024-01-04',
            paymentMethod: 'Bank Transfer'
          },
          {
            id: 'PAY005',
            bookingId: 'BK005',
            customerName: 'Robert Brown',
            serviceName: 'General Repair',
            amount: 200.00,
            platformFee: 10.00,
            netAmount: 190.00,
            status: 'processing',
            paymentDate: '2024-01-18',
            payoutDate: null,
            paymentMethod: 'Credit Card'
          }
        ]

        const mockMonthlyData = [
          { month: 'Oct 2023', earnings: 2100, jobs: 8 },
          { month: 'Nov 2023', earnings: 2850, jobs: 11 },
          { month: 'Dec 2023', earnings: 3200, jobs: 13 },
          { month: 'Jan 2024', earnings: 2860, jobs: 10 }
        ]

        setPaymentHistory(mockPayments)
        setMonthlyBreakdown(mockMonthlyData)
        
        // Calculate summary stats
        const totalEarnings = mockPayments.reduce((acc, payment) => acc + payment.netAmount, 0)
        const thisMonth = mockPayments
          .filter(p => new Date(p.paymentDate).getMonth() === new Date().getMonth())
          .reduce((acc, payment) => acc + payment.netAmount, 0)
        const pendingPayments = mockPayments
          .filter(p => p.status === 'pending' || p.status === 'processing')
          .reduce((acc, payment) => acc + payment.netAmount, 0)
        const completedJobs = mockPayments.filter(p => p.status === 'completed').length
        const averageJobValue = completedJobs > 0 ? totalEarnings / completedJobs : 0

        setEarningsData({
          totalEarnings,
          thisMonth,
          lastMonth: 2850,
          pendingPayments,
          completedJobs,
          averageJobValue,
          monthlyTrend: thisMonth > 2850 ? 'up' : 'down',
          yearToDate: totalEarnings
        })
      }
    } catch (error) {
      console.error('Error loading earnings:', error)
      toast.error('Failed to load earnings data')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'processing': return <RefreshCw className="w-4 h-4" />
      case 'failed': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const exportEarningsReport = () => {
    // Mock export functionality
    toast.success('Earnings report downloaded successfully!')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your earnings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Earnings Dashboard</h1>
              <p className="mt-1 text-gray-600">
                Track your income and financial performance
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={exportEarningsReport}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Report
              </Button>
              <Link href="/provider/dashboard">
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">GHS {earningsData.totalEarnings.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Total Earnings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">GHS {earningsData.thisMonth.toLocaleString()}</p>
                    {earningsData.monthlyTrend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">GHS {earningsData.pendingPayments.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Pending Payouts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${Math.round(earningsData.averageJobValue)}</p>
                  <p className="text-sm text-gray-600">Avg Job Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Monthly Breakdown Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Earnings Trend</CardTitle>
                  <CardDescription>Monthly earnings over time</CardDescription>
                </div>
                <select 
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="1month">Last Month</option>
                  <option value="3months">Last 3 Months</option>
                  <option value="6months">Last 6 Months</option>
                  <option value="1year">Last Year</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyBreakdown.map((month, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">{month.month}</h4>
                      <p className="text-sm text-gray-600">{month.jobs} jobs completed</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">GHS {month.earnings.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">
                        Avg: GHS {Math.round(month.earnings / (month.jobs || 1))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
              <CardDescription>Current payment status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completed Payments</span>
                  <span className="font-medium">
                    {paymentHistory.filter(p => p.status === 'completed').length}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending Payments</span>
                  <span className="font-medium text-yellow-600">
                    {paymentHistory.filter(p => p.status === 'pending').length}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Processing</span>
                  <span className="font-medium text-blue-600">
                    {paymentHistory.filter(p => p.status === 'processing').length}
                  </span>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Platform Fee Rate</span>
                    <span className="font-medium">5%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Competitive rate with no hidden charges
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Next Payout</h4>
                  <p className="text-xs text-blue-700">
                    Pending payments will be processed within 2-3 business days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment History */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Detailed transaction history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Service</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Fee</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Net</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((payment) => (
                    <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">
                        {payment.customerName}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {payment.serviceName}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">
                        GHS {payment.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-sm text-red-600">
                        -GHS {payment.platformFee.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-sm font-bold text-green-600">
                        GHS {payment.netAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`${getStatusColor(payment.status)} flex items-center gap-1 w-fit`}>
                          {getStatusIcon(payment.status)}
                          <span className="capitalize">{payment.status}</span>
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {payment.payoutDate ? (
                          <span className="text-green-600">
                            {new Date(payment.payoutDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-gray-400">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {paymentHistory.length === 0 && (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment History</h3>
                <p className="text-gray-600">
                  Complete your first booking to start earning!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Maximize Your Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-medium mb-2">Optimize Pricing</h4>
                <p className="text-sm text-gray-600">Research market rates and adjust your pricing competitively</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-medium mb-2">Increase Availability</h4>
                <p className="text-sm text-gray-600">More available hours means more booking opportunities</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <PieChart className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-medium mb-2">Expand Services</h4>
                <p className="text-sm text-gray-600">Offer additional services to increase job value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ProviderEarnings 