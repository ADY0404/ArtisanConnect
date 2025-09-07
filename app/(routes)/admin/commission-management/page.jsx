"use client"
import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  DollarSign, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Download,
  Mail,
  Phone,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import EnhancedReportingDashboard from '@/app/_components/EnhancedReportingDashboard'
import CommissionRateManager from '../_components/CommissionRateManager'
import ProviderTierMigration from '../_components/ProviderTierMigration'

function AdminCommissionManagement() {
  const { data: session } = useSession()
  const [commissionData, setCommissionData] = useState(null)
  const [providers, setProviders] = useState([])
  const [commissionRates, setCommissionRates] = useState(null)
  const [selectedTab, setSelectedTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      loadCommissionData()
      loadProviders()
      loadCommissionRates()
    }
  }, [session])

  const loadCommissionData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/commission-summary')
      
      if (response.ok) {
        const data = await response.json()
        setCommissionData(data.summary)
      } else {
        // Mock data for development
        setCommissionData({
          totalCommissionEarned: 12450.75,
          totalCommissionOwed: 3285.50,
          totalProviders: 45,
          overdueProviders: 8,
          averageCommissionRate: 18.2,
          monthlyGrowth: 15.3,
          recentTransactions: [
            {
              id: '1',
              providerName: 'John Doe',
              providerEmail: 'john@example.com',
              amount: 285.50,
              status: 'OVERDUE',
              daysOverdue: 5,
              lastReminder: '2024-01-10'
            },
            {
              id: '2',
              providerName: 'Jane Smith',
              providerEmail: 'jane@example.com',
              amount: 156.75,
              status: 'PENDING',
              daysOverdue: 0,
              lastReminder: '2024-01-12'
            }
          ]
        })
      }
    } catch (error) {
      console.error('Error loading commission data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadProviders = async () => {
    try {
      const response = await fetch('/api/admin/providers-with-commission')
      
      if (response.ok) {
        const data = await response.json()
        setProviders(data.providers)
      } else {
        // Mock data for development
        setProviders([
          {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+233123456789',
            tier: 'VERIFIED',
            totalOwed: 285.50,
            totalEarned: 2450.00,
            transactionCount: 3,
            status: 'OVERDUE',
            lastPayment: '2024-01-05',
            joinDate: '2023-06-15'
          },
          {
            id: '2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '+233987654321',
            tier: 'PREMIUM',
            totalOwed: 156.75,
            totalEarned: 3200.00,
            transactionCount: 2,
            status: 'PENDING',
            lastPayment: '2024-01-08',
            joinDate: '2023-04-20'
          },
          {
            id: '3',
            name: 'Mike Johnson',
            email: 'mike@example.com',
            phone: '+233555666777',
            tier: 'NEW',
            totalOwed: 0,
            totalEarned: 1800.00,
            transactionCount: 0,
            status: 'CURRENT',
            lastPayment: '2024-01-12',
            joinDate: '2024-01-01'
          }
        ])
      }
    } catch (error) {
      console.error('Error loading providers:', error)
    }
  }

  const loadCommissionRates = async () => {
    try {
      const response = await fetch('/api/admin/commission-rates')
      
      if (response.ok) {
        const data = await response.json()
        setCommissionRates(data.rates)
      } else {
        // Fallback to default rates if API fails
        setCommissionRates({
          NEW: 20.0,
          VERIFIED: 18.0,
          STANDARD: 12.0,
          PREMIUM: 15.0,
          ENTERPRISE: 5.0
        })
      }
    } catch (error) {
      console.error('Error loading commission rates:', error)
      // Fallback to default rates
      setCommissionRates({
        NEW: 20.0,
        VERIFIED: 18.0,
        STANDARD: 12.0,
        PREMIUM: 15.0,
        ENTERPRISE: 5.0
      })
    }
  }

  const handleSendReminder = async (providerId) => {
    try {
      const response = await fetch('/api/admin/send-commission-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ providerId })
      })

      if (response.ok) {
        toast.success('Reminder sent successfully')
      } else {
        toast.error('Failed to send reminder')
      }
    } catch (error) {
      console.error('Error sending reminder:', error)
      toast.error('Failed to send reminder')
    }
  }

  const handleMarkAsPaid = async (providerId) => {
    try {
      const response = await fetch('/api/admin/mark-commission-paid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ providerId })
      })

      if (response.ok) {
        toast.success('Commission marked as paid')
        loadProviders() // Refresh data
      } else {
        toast.error('Failed to mark as paid')
      }
    } catch (error) {
      console.error('Error marking as paid:', error)
      toast.error('Failed to mark as paid')
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OVERDUE':
        return <Badge variant="destructive">Overdue</Badge>
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>
      case 'CURRENT':
        return <Badge variant="default">Current</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTierBadge = (tier) => {
    const colors = {
      NEW: 'bg-gray-100 text-gray-800',
      VERIFIED: 'bg-blue-100 text-blue-800',
      PREMIUM: 'bg-purple-100 text-purple-800',
      ENTERPRISE: 'bg-gold-100 text-gold-800'
    }
    
    return (
      <Badge className={colors[tier] || 'bg-gray-100 text-gray-800'}>
        {tier}
      </Badge>
    )
  }

  const filteredProviders = providers.filter(provider =>
    provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              You need admin privileges to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Commission Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage platform commission payments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadCommissionData()
              loadProviders()
              toast.success('Data refreshed successfully')
            }}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Send Bulk Reminders
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-2xl font-bold text-green-600">
                  GHS {commissionData?.totalCommissionEarned?.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Owed</p>
                <p className="text-2xl font-bold text-red-600">
                  GHS {commissionData?.totalCommissionOwed?.toFixed(2)}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Providers</p>
                <p className="text-2xl font-bold">
                  {commissionData?.totalProviders}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-orange-600">
                  {commissionData?.overdueProviders}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rates">Commission Rates</TabsTrigger>
          <TabsTrigger value="migration">Provider Migration</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Current Commission Rates Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Current Commission Rates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">New Providers</span>
                    <Badge variant="secondary">
                      {commissionRates?.NEW ? `${commissionRates.NEW}%` : '20.0%'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Verified</span>
                    <Badge variant="secondary">
                      {commissionRates?.VERIFIED ? `${commissionRates.VERIFIED}%` : '18.0%'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Standard</span>
                    <Badge variant="secondary">
                      {commissionRates?.STANDARD ? `${commissionRates.STANDARD}%` : '12.0%'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Premium</span>
                    <Badge variant="secondary">
                      {commissionRates?.PREMIUM ? `${commissionRates.PREMIUM}%` : '15.0%'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Enterprise</span>
                    <Badge variant="secondary">
                      {commissionRates?.ENTERPRISE ? `${commissionRates.ENTERPRISE}%` : '5.0%'}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => setSelectedTab('rates')}
                  >
                    Manage Rates
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Edit className="w-4 h-4 mr-2" />
                    Update Commission Rates
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Payment Reminders
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Export Commission Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Eye className="w-4 h-4 mr-2" />
                    View Rate History
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Commission Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Commission Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg. Commission Rate</span>
                    <span className="font-medium">16.25%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Monthly Growth</span>
                    <span className="font-medium text-green-600">+15.3%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Providers</span>
                    <span className="font-medium">{commissionData?.totalProviders || 45}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Overdue Payments</span>
                    <span className="font-medium text-orange-600">{commissionData?.overdueProviders || 8}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Commission Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {commissionData?.recentTransactions?.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{transaction.providerName}</p>
                        <p className="text-sm text-muted-foreground">{transaction.providerEmail}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">GHS {transaction.amount.toFixed(2)}</p>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full justify-start">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Overdue Reminders
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Export Commission Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Eye className="h-4 w-4 mr-2" />
                    View Payment History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rates">
          <CommissionRateManager onRatesUpdated={loadCommissionRates} />
        </TabsContent>

        <TabsContent value="migration">
          <ProviderTierMigration />
        </TabsContent>

        <TabsContent value="providers">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Provider Commission Status</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search providers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Total Owed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Payment</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProviders.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{provider.name}</p>
                          <p className="text-sm text-muted-foreground">{provider.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getTierBadge(provider.tier)}</TableCell>
                      <TableCell>
                        <span className={provider.totalOwed > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                          GHS {provider.totalOwed.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(provider.status)}</TableCell>
                      <TableCell>{provider.lastPayment}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {provider.totalOwed > 0 && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSendReminder(provider.id)}
                              >
                                <Mail className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAsPaid(provider.id)}
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Commission Transactions</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {commissionData?.recentTransactions && commissionData.recentTransactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissionData.recentTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{transaction.providerEmail}</p>
                            <p className="text-sm text-muted-foreground">
                              {transaction.providerName || 'Unknown Provider'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            GHS {transaction.amount?.toFixed(2) || '0.00'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.paymentMethod === 'PAYSTACK' ? 'default' : 'secondary'}>
                            {transaction.paymentMethod || 'CASH'}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell>
                          {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3" />
                            </Button>
                            {transaction.status === 'PENDING' && (
                              <Button size="sm" variant="outline">
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Transactions Found</h3>
                  <p className="text-muted-foreground">
                    No commission transactions have been recorded yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <EnhancedReportingDashboard isAdmin={true} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminCommissionManagement
