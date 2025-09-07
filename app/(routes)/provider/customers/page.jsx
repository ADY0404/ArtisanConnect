"use client"
import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Users, 
  Search, 
  Filter, 
  Calendar, 
  ArrowLeft,
  Star,
  TrendingUp,
  Heart,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  DollarSign,
  Target,
  Award,
  AlertCircle,
  CheckCircle,
  Plus,
  Eye,
  BarChart3
} from 'lucide-react'

function CustomerRelationshipManagement() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false)

  // Customer data state
  const [customers, setCustomers] = useState([])
  const [customerStats, setCustomerStats] = useState({
    totalCustomers: 0,
    repeatCustomers: 0,
    averageRating: 0,
    retentionRate: 0,
    lifetimeValue: 0
  })
  const [customerInsights, setCustomerInsights] = useState([])
  const [followUps, setFollowUps] = useState([])

  // Follow-up form state
  const [newFollowUp, setNewFollowUp] = useState({
    customerId: '',
    type: 'satisfaction', // satisfaction, maintenance, upsell
    scheduledDate: '',
    notes: '',
    priority: 'medium'
  })

  useEffect(() => {
    if (session?.user) {
      loadCustomerData()
    }
  }, [session])

  const loadCustomerData = async () => {
    try {
      setIsLoading(true)
      
      // Load customer data
      const customersResponse = await fetch('/api/provider/customers')
      if (customersResponse.ok) {
        const data = await customersResponse.json()
        setCustomers(data.customers || [])
        setCustomerStats(data.stats || customerStats)
        setCustomerInsights(data.insights || [])
      } else {
        // Mock data for development
        setCustomers([
          {
            id: 'cust1',
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            phone: '+1-555-0123',
            address: '123 Main St, Downtown',
            joinDate: '2023-08-15',
            lastService: '2024-01-10',
            totalBookings: 8,
            totalSpent: 1250.00,
            averageRating: 4.9,
            status: 'active',
            preferences: {
              preferredTime: 'morning',
              communicationMethod: 'email',
              serviceFrequency: 'monthly',
              specialRequests: ['Pet-friendly products', 'Eco-friendly options']
            },
            serviceHistory: [
              {
                date: '2024-01-10',
                service: 'Kitchen Deep Clean',
                rating: 5,
                feedback: 'Excellent service, very thorough!'
              },
              {
                date: '2023-12-15',
                service: 'Bathroom Renovation',
                rating: 5,
                feedback: 'Professional work, highly recommended'
              },
              {
                date: '2023-11-20',
                service: 'Plumbing Repair',
                rating: 4,
                feedback: 'Good service, prompt response'
              }
            ],
            nextRecommendedService: 'Kitchen Maintenance',
            riskLevel: 'low',
            lifetimeValue: 1250.00,
            satisfactionTrend: 'improving'
          },
          {
            id: 'cust2',
            name: 'Mike Williams',
            email: 'mike@example.com',
            phone: '+1-555-0456',
            address: '456 Oak Ave, Suburbs',
            joinDate: '2023-10-02',
            lastService: '2023-12-20',
            totalBookings: 3,
            totalSpent: 450.00,
            averageRating: 4.3,
            status: 'at_risk',
            preferences: {
              preferredTime: 'afternoon',
              communicationMethod: 'phone',
              serviceFrequency: 'quarterly',
              specialRequests: ['Weekend availability']
            },
            serviceHistory: [
              {
                date: '2023-12-20',
                service: 'Electrical Repair',
                rating: 4,
                feedback: 'Good work, but took longer than expected'
              },
              {
                date: '2023-11-15',
                service: 'Light Installation',
                rating: 5,
                feedback: 'Perfect installation!'
              },
              {
                date: '2023-10-05',
                service: 'Outlet Repair',
                rating: 4,
                feedback: 'Fixed the issue quickly'
              }
            ],
            nextRecommendedService: 'Electrical Maintenance',
            riskLevel: 'medium',
            lifetimeValue: 450.00,
            satisfactionTrend: 'stable'
          },
          {
            id: 'cust3',
            name: 'Emma Davis',
            email: 'emma@example.com',
            phone: '+1-555-0789',
            address: '789 Pine St, Uptown',
            joinDate: '2023-06-10',
            lastService: '2024-01-05',
            totalBookings: 12,
            totalSpent: 2100.00,
            averageRating: 4.8,
            status: 'vip',
            preferences: {
              preferredTime: 'evening',
              communicationMethod: 'text',
              serviceFrequency: 'bi-weekly',
              specialRequests: ['Premium materials only', 'Detailed progress updates']
            },
            serviceHistory: [
              {
                date: '2024-01-05',
                service: 'Home Deep Clean',
                rating: 5,
                feedback: 'Outstanding service as always!'
              },
              {
                date: '2023-12-22',
                service: 'Holiday Decoration Setup',
                rating: 5,
                feedback: 'Beautiful work, exceeded expectations'
              }
            ],
            nextRecommendedService: 'Spring Cleaning Package',
            riskLevel: 'low',
            lifetimeValue: 2100.00,
            satisfactionTrend: 'excellent'
          }
        ])

        setCustomerStats({
          totalCustomers: 3,
          repeatCustomers: 2,
          averageRating: 4.7,
          retentionRate: 85,
          lifetimeValue: 1266.67
        })

        setCustomerInsights([
          {
            type: 'trend',
            title: 'Peak Service Times',
            description: 'Most customers prefer morning appointments (60%)',
            actionable: 'Consider adjusting availability to meet demand'
          },
          {
            type: 'opportunity',
            title: 'Upsell Potential',
            description: '2 customers are ready for premium service packages',
            actionable: 'Reach out with premium package offers'
          },
          {
            type: 'risk',
            title: 'At-Risk Customer',
            description: '1 customer hasn\'t booked in 30+ days',
            actionable: 'Schedule follow-up call to maintain relationship'
          }
        ])
      }

      // Load follow-ups
      setFollowUps([
        {
          id: 'follow1',
          customerId: 'cust2',
          customerName: 'Mike Williams',
          type: 'satisfaction',
          scheduledDate: '2024-01-25',
          notes: 'Check satisfaction with last electrical repair',
          priority: 'high',
          status: 'pending'
        },
        {
          id: 'follow2',
          customerId: 'cust3',
          customerName: 'Emma Davis',
          type: 'upsell',
          scheduledDate: '2024-01-30',
          notes: 'Propose spring cleaning package',
          priority: 'medium',
          status: 'scheduled'
        }
      ])

    } catch (error) {
      console.error('Error loading customer data:', error)
      toast.error('Failed to load customer data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleScheduleFollowUp = async () => {
    try {
      const response = await fetch('/api/provider/follow-ups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFollowUp)
      })

      if (response.ok) {
        toast.success('Follow-up scheduled successfully!')
        setShowFollowUpDialog(false)
        setNewFollowUp({
          customerId: '',
          type: 'satisfaction',
          scheduledDate: '',
          notes: '',
          priority: 'medium'
        })
        loadCustomerData()
      } else {
        toast.error('Failed to schedule follow-up')
      }
    } catch (error) {
      console.error('Error scheduling follow-up:', error)
      toast.error('Failed to schedule follow-up')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'vip': return 'bg-purple-100 text-purple-800'
      case 'at_risk': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskLevelColor = (risk) => {
    switch (risk) {
      case 'low': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'high': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === 'all' || customer.status === filterStatus
    return matchesSearch && matchesFilter
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customer data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Customer Relationship Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Track customer history, preferences, and build lasting relationships</p>
        </div>
        <Link href="/provider/dashboard">
          <Button variant="outline" className="w-full sm:w-auto text-xs sm:text-sm">
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <div className="overflow-x-auto pb-2">
          <TabsList className="flex w-full min-w-[600px] sm:min-w-0 sm:grid sm:grid-cols-4">
            <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0 flex items-center gap-1 sm:gap-2">
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="customers" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0 flex items-center gap-1 sm:gap-2">
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              Customer Database
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0 flex items-center gap-1 sm:gap-2">
              <Target className="w-3 h-3 sm:w-4 sm:h-4" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="followups" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0 flex items-center gap-1 sm:gap-2">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
              Follow-ups
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold">{customerStats.totalCustomers}</div>
                <p className="text-xs text-muted-foreground">
                  Active customer base
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Repeat Customers</CardTitle>
                <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold">{customerStats.repeatCustomers}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((customerStats.repeatCustomers / customerStats.totalCustomers) * 100)}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Average Rating</CardTitle>
                <Star className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold flex items-center">
                  {customerStats.averageRating}
                  <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 fill-current ml-1" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Customer satisfaction
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Retention Rate</CardTitle>
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold">{customerStats.retentionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Customer retention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Avg Lifetime Value</CardTitle>
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold">${customerStats.lifetimeValue.toFixed(0)}</div>
                <p className="text-xs text-muted-foreground">
                  Per customer
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Customer Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Status Distribution</CardTitle>
                <CardDescription>Current status of your customer base</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {[
                    { status: 'VIP', count: 1, color: 'bg-purple-500' },
                    { status: 'Active', count: 1, color: 'bg-green-500' },
                    { status: 'At Risk', count: 1, color: 'bg-yellow-500' },
                    { status: 'Inactive', count: 0, color: 'bg-gray-500' }
                  ].map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${item.color}`}></div>
                        <span className="text-xs sm:text-sm font-medium">{item.status}</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="text-xs sm:text-sm text-gray-600">{item.count}</span>
                        <div className="w-16 sm:w-20 bg-gray-200 rounded-full h-1.5 sm:h-2">
                          <div 
                            className={`h-1.5 sm:h-2 rounded-full ${item.color}`} 
                            style={{ width: `${(item.count / customerStats.totalCustomers) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Customer Activity</CardTitle>
                <CardDescription>Latest customer interactions and bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {customers.slice(0, 3).map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm sm:text-base">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-xs sm:text-sm">{customer.name}</p>
                          <p className="text-xs text-gray-600">Last service: {new Date(customer.lastService).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(customer.status)} text-xs`}>
                        {customer.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customer Database Tab */}
        <TabsContent value="customers" className="space-y-4 sm:space-y-6">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search customers by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                className="px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="vip">VIP</option>
                <option value="at_risk">At Risk</option>
                <option value="inactive">Inactive</option>
              </select>
              <Dialog open={showFollowUpDialog} onOpenChange={setShowFollowUpDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm">
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Schedule Follow-up
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Schedule Customer Follow-up</DialogTitle>
                    <DialogDescription>
                      Schedule a follow-up with a customer to maintain relationships
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Customer</label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={newFollowUp.customerId}
                        onChange={(e) => setNewFollowUp(prev => ({ ...prev, customerId: e.target.value }))}
                      >
                        <option value="">Select a customer</option>
                        {customers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name} - {customer.email}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Follow-up Type</label>
                        <select
                          className="w-full p-2 border border-gray-300 rounded-md"
                          value={newFollowUp.type}
                          onChange={(e) => setNewFollowUp(prev => ({ ...prev, type: e.target.value }))}
                        >
                          <option value="satisfaction">Satisfaction Check</option>
                          <option value="maintenance">Maintenance Reminder</option>
                          <option value="upsell">Upsell Opportunity</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Priority</label>
                        <select
                          className="w-full p-2 border border-gray-300 rounded-md"
                          value={newFollowUp.priority}
                          onChange={(e) => setNewFollowUp(prev => ({ ...prev, priority: e.target.value }))}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Scheduled Date</label>
                      <Input
                        type="date"
                        value={newFollowUp.scheduledDate}
                        onChange={(e) => setNewFollowUp(prev => ({ ...prev, scheduledDate: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Notes</label>
                      <Textarea
                        placeholder="Add notes about this follow-up..."
                        value={newFollowUp.notes}
                        onChange={(e) => setNewFollowUp(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setShowFollowUpDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleScheduleFollowUp} className="bg-blue-600 hover:bg-blue-700">
                        Schedule Follow-up
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Customer Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm sm:text-base">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-base sm:text-lg">{customer.name}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">{customer.email}</CardDescription>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(customer.status)} text-xs`}>
                      {customer.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  {/* Customer Stats */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div>
                      <span className="text-gray-600">Total Bookings</span>
                      <div className="font-medium">{customer.totalBookings}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Spent</span>
                      <div className="font-medium">${customer.totalSpent.toFixed(0)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Avg Rating</span>
                      <div className="font-medium flex items-center">
                        {customer.averageRating}
                        <Star className="w-3 h-3 text-yellow-500 fill-current ml-1" />
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Last Service</span>
                      <div className="font-medium">{new Date(customer.lastService).toLocaleDateString()}</div>
                    </div>
                  </div>

                  {/* Risk Level */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-gray-600">Risk Level</span>
                    <span className={`text-xs sm:text-sm font-medium ${getRiskLevelColor(customer.riskLevel)}`}>
                      {customer.riskLevel.toUpperCase()}
                    </span>
                  </div>

                  {/* Preferences Preview */}
                  <div className="space-y-2">
                    <span className="text-xs sm:text-sm font-medium">Preferences</span>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">
                        {customer.preferences.preferredTime}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {customer.preferences.serviceFrequency}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {customer.preferences.communicationMethod}
                      </Badge>
                    </div>
                  </div>

                  {/* Next Recommended Service */}
                  {customer.nextRecommendedService && (
                    <div className="bg-blue-50 p-2 sm:p-3 rounded-lg">
                      <div className="text-xs sm:text-sm font-medium text-blue-800">Recommended Next Service</div>
                      <div className="text-xs sm:text-sm text-blue-600">{customer.nextRecommendedService}</div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedCustomer(customer)} className="text-xs">
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Customer Insights Tab */}
        <TabsContent value="insights" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {customerInsights.map((insight, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    {insight.type === 'trend' && <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />}
                    {insight.type === 'opportunity' && <Target className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />}
                    {insight.type === 'risk' && <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />}
                    <CardTitle className="text-base sm:text-lg">{insight.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs sm:text-sm text-gray-600">{insight.description}</p>
                  <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                    <div className="text-xs sm:text-sm font-medium text-gray-800">Recommended Action:</div>
                    <div className="text-xs sm:text-sm text-gray-600">{insight.actionable}</div>
                  </div>
                  <Button size="sm" className="w-full text-xs sm:text-sm">
                    Take Action
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Customer Feedback Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Feedback Analysis</CardTitle>
              <CardDescription>Analysis of customer reviews and feedback patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">92%</div>
                  <div className="text-sm text-gray-600">Positive Feedback</div>
                  <div className="text-xs text-gray-500 mt-1">Based on recent reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">4.7</div>
                  <div className="text-sm text-gray-600">Average Rating</div>
                  <div className="text-xs text-gray-500 mt-1">Across all services</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">85%</div>
                  <div className="text-sm text-gray-600">Would Recommend</div>
                  <div className="text-xs text-gray-500 mt-1">Customer survey results</div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <h4 className="font-medium">Common Feedback Themes</h4>
                <div className="space-y-2">
                  {[
                    { theme: 'Professional Service', count: 15, sentiment: 'positive' },
                    { theme: 'Timely Completion', count: 12, sentiment: 'positive' },
                    { theme: 'Fair Pricing', count: 8, sentiment: 'positive' },
                    { theme: 'Communication', count: 3, sentiment: 'improvement' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{item.theme}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{item.count} mentions</span>
                        <Badge variant={item.sentiment === 'positive' ? 'default' : 'secondary'}>
                          {item.sentiment}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Follow-ups Tab */}
        <TabsContent value="followups" className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <h2 className="text-lg sm:text-xl font-semibold">Scheduled Follow-ups</h2>
            <Button onClick={() => setShowFollowUpDialog(true)} className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm w-full sm:w-auto">
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Schedule Follow-up
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {followUps.map((followUp) => (
              <Card key={followUp.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base sm:text-lg">{followUp.customerName}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">{followUp.type.replace('_', ' ').toUpperCase()}</CardDescription>
                    </div>
                    <Badge className={`${getPriorityColor(followUp.priority)} text-xs`}>
                      {followUp.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    {new Date(followUp.scheduledDate).toLocaleDateString()}
                  </div>
                  
                  <p className="text-xs sm:text-sm text-gray-700">{followUp.notes}</p>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant={followUp.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                      {followUp.status}
                    </Badge>
                    <div className="flex gap-1 sm:gap-2">
                      <Button variant="outline" size="sm" className="p-1 sm:p-2">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="p-1 sm:p-2">
                        <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                  {selectedCustomer.name.charAt(0)}
                </div>
                {selectedCustomer.name}
              </DialogTitle>
              <DialogDescription>Complete customer profile and history</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{selectedCustomer.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{selectedCustomer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{selectedCustomer.address}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-gray-600">Customer since:</span>
                    <span className="ml-2 font-medium">{new Date(selectedCustomer.joinDate).toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Lifetime Value:</span>
                    <span className="ml-2 font-medium">${selectedCustomer.lifetimeValue.toFixed(2)}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Satisfaction Trend:</span>
                    <span className="ml-2 font-medium capitalize">{selectedCustomer.satisfactionTrend}</span>
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div>
                <h4 className="font-medium mb-3">Customer Preferences</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Preferred Time:</span>
                    <div className="font-medium capitalize">{selectedCustomer.preferences.preferredTime}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Communication:</span>
                    <div className="font-medium capitalize">{selectedCustomer.preferences.communicationMethod}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Service Frequency:</span>
                    <div className="font-medium capitalize">{selectedCustomer.preferences.serviceFrequency}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Special Requests:</span>
                    <div className="font-medium">{selectedCustomer.preferences.specialRequests.length} items</div>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-gray-600">Special Requests:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedCustomer.preferences.specialRequests.map((request, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {request}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Service History */}
              <div>
                <h4 className="font-medium mb-3">Service History</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {selectedCustomer.serviceHistory.map((service, index) => (
                    <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{service.service}</div>
                        <div className="text-xs text-gray-600">{new Date(service.date).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-700 mt-1">{service.feedback}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">{service.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default CustomerRelationshipManagement 