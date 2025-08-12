"use client"
import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import Link from 'next/link'

// Import dashboard components
import ProviderStats from './_components/ProviderStats'
import BookingRequests from './_components/BookingRequests'
import CalendarView from './_components/CalendarView'
import QuickActions from './_components/QuickActions'
import RegistrationStatus from './_components/RegistrationStatus'
import InvoiceHistory from './_components/InvoiceHistory'
import RegistrationAlert from './_components/RegistrationAlert'
import CommissionTracker from '@/app/_components/CommissionTracker'

// Import chat components
import ChatWindow from '@/app/_components/ChatWindow'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MessageCircle } from 'lucide-react'

// Import UI components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function ProviderDashboard() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    stats: null,
    bookings: [],
    todayBookings: []
  })
  const [registrationStatus, setRegistrationStatus] = useState(null)
  const [isFullyRegistered, setIsFullyRegistered] = useState(true)

  // ✅ Chat dialog state
  const [openChatDialog, setOpenChatDialog] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)

  // Load dashboard data
  useEffect(() => {
    if (session?.user) {
      loadDashboardData()
      fetchRegistrationStatus()
    }
  }, [session])

  const fetchRegistrationStatus = async () => {
    try {
      const response = await fetch('/api/provider/registration-status')
      const data = await response.json()
      
      if (data.success) {
        setRegistrationStatus(data.status)
        // Check if provider is fully registered (approved status)
        setIsFullyRegistered(data.status?.approvalStatus === 'APPROVED')
      }
    } catch (error) {
      console.error('Error fetching registration status:', error)
    }
  }

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      console.log('🔄 Loading dashboard data...')
      
      // Multiple API calls to fetch different data
      const [statsResponse, bookingsResponse, todayBookingsResponse] = await Promise.all([
        fetch('/api/provider/stats'),
        fetch('/api/provider/bookings'),
        fetch('/api/provider/bookings/today')
      ])

      let stats = null
      let bookings = []

      // Handle stats response
      if (statsResponse.ok) {
        stats = await statsResponse.json()
        console.log('✅ Stats loaded from API:', stats)
      } else {
        console.log('⚠️ Stats API failed, using mock data. Status:', statsResponse.status)
        // Mock data for development
        stats = {
          totalBookings: 23,
          thisMonthBookings: 8,
          completedBookings: 21,
          averageRating: 4.8,
          totalReviews: 15,
          responseTime: 25, // minutes
          conversionRate: 85,
          repeatCustomers: 35,
          totalRevenue: 2850,
          thisMonthRevenue: 1200,
          growth: {
            bookings: 15,
            revenue: 22
          },
          topServices: [
            ['Kitchen Sink Repair', 12],
            ['Toilet Installation', 8],
            ['Water Heater Maintenance', 7],
            ['Drain Cleaning', 6],
            ['Plumbing Repairs', 5]
          ],
          repeatRate: 75,
          averageRating: 4.9,
          totalRevenue: 3500,
          thisMonthRevenue: 1500,
          growth: {
            bookings: 18,
            revenue: 30
          }
        }
      }

      // Handle bookings response
      if (bookingsResponse.ok) {
        bookings = await bookingsResponse.json()
        console.log('✅ Bookings loaded from API:', bookings.length, 'bookings')
        
        // If API returns empty array but no error, that's valid
        if (bookings.length === 0) {
          console.log('ℹ️ No bookings found for this provider')
        }
      } else {
        console.log('⚠️ Bookings API failed, using mock data. Status:', bookingsResponse.status)
        const errorData = await bookingsResponse.text()
        console.error('📡 Bookings API Error:', errorData)
        
        // Only use mock data if there's a real error, not just empty results
        if (bookingsResponse.status >= 500) {
          // Server error - use mock data
          bookings = [
            {
              id: 1,
              userName: 'Sarah Johnson',
              userEmail: 'sarah@example.com',
              userPhone: '+1-555-0123',
              date: '2024-01-20',
              time: '10:00 AM',
              status: 'PENDING',
              serviceDetails: 'Kitchen sink repair - leaking faucet and clogged drain'
            },
            {
              id: 2,
              userName: 'Mike Williams',
              userEmail: 'mike@example.com',
              userPhone: '+1-555-0456',
              date: '2024-01-21',
              time: '2:00 PM',
              status: 'CONFIRMED',
              serviceDetails: 'Bathroom plumbing - toilet installation'
            },
            {
              id: 3,
              userName: 'Emma Davis',
              userEmail: 'emma@example.com',
              userPhone: '+1-555-0789',
              date: '2024-01-22',
              time: '9:00 AM',
              status: 'IN_PROGRESS',
              serviceDetails: 'Water heater maintenance and inspection'
            }
          ]
        } else {
          // Client error (4xx) - likely authentication or authorization issue
          bookings = []
          if (bookingsResponse.status === 401) {
            toast.error('Please log in again to view your bookings')
          } else if (bookingsResponse.status === 403) {
            toast.error('You need provider access to view bookings')
          }
        }
      }
      
      // Handle today's bookings response
      let todayBookings = []
      if (todayBookingsResponse.ok) {
        todayBookings = await todayBookingsResponse.json()
        console.log('✅ Today\'s bookings loaded from API:', todayBookings.length, 'bookings')
        
        // Update stats with today's bookings count if needed
        if (stats && todayBookings.length > 0) {
          stats.todayBookings = todayBookings.length
        }
      } else {
        console.log('⚠️ Today\'s bookings API failed. Status:', todayBookingsResponse.status)
        
        // If we have general bookings, filter for today's date as fallback
        if (bookings.length > 0) {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)
          
          todayBookings = bookings.filter(booking => {
            const bookingDate = new Date(booking.date)
            return bookingDate >= today && bookingDate < tomorrow
          })
          
          console.log('ℹ️ Fallback: Filtered today\'s bookings from general bookings:', todayBookings.length)
          
          // Update stats with today's bookings count
          if (stats) {
            stats.todayBookings = todayBookings.length
          }
        }
      }

      setDashboardData({
        stats,
        bookings,
        todayBookings
      })

      console.log('✅ Dashboard data loaded successfully')

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
      
      // Set empty state on error
      setDashboardData({
        stats: null,
        bookings: [],
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle booking status updates
  const handleBookingStatusUpdate = async (bookingId, newStatus) => {
    try {
      console.log('🔄 Updating booking status:', { bookingId, newStatus })
      
      const response = await fetch('/api/provider/bookings/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          status: newStatus
        })
      })

      console.log('📡 Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.text()
        console.error('❌ API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        })
        
        // Provide more specific error messages
        if (response.status === 404) {
          throw new Error('Booking not found or you do not have permission to update it')
        } else if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.')
        } else if (response.status === 403) {
          throw new Error('You do not have permission to update this booking')
        } else {
          throw new Error(`Failed to update booking status: ${response.status} ${response.statusText}`)
        }
      }

      const result = await response.json()
      console.log('✅ Booking updated successfully:', result)

      // Update local state
      setDashboardData(prev => ({
        ...prev,
        bookings: prev.bookings.map(booking =>
          booking.id === bookingId
            ? { ...booking, status: newStatus }
            : booking
        )
      }))
      
      // Reload stats to reflect changes
      loadDashboardData()
      
    } catch (error) {
      console.error('❌ Error updating booking:', error)
      throw error
    }
  }

  // ✅ FIXED: Handle chat opening with proper dialog
  const handleOpenChat = (booking) => {
    console.log('🗨️ Opening chat for booking:', booking)
    setSelectedBooking(booking)
    setOpenChatDialog(booking.id)
  }

  // Handle date selection from calendar
  const handleDateSelect = (date, booking = null) => {
    if (booking) {
      toast.info(`Selected booking: ${booking.userName} at ${booking.time}`)
    } else {
      toast.info(`Selected date: ${date.toDateString()}`)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
      {/* Registration Alert - Only show if not fully registered */}
      {!isFullyRegistered && <RegistrationAlert registrationStatus={registrationStatus} />}
      
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Provider Dashboard</h1>
          <p className="text-gray-600 text-sm sm:text-base">Welcome back, {session?.user?.name}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadDashboardData}
            disabled={isLoading}
            className="flex items-center gap-2 w-full sm:w-auto text-xs sm:text-sm"
          >
            <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          
          <Button 
            size="sm" 
            asChild
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            <Link href="/provider/profile">Edit Profile</Link>
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <div className="overflow-x-auto pb-2">
          <TabsList className="grid w-full grid-cols-5 min-w-0">
            <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-3">Overview</TabsTrigger>
            <TabsTrigger value="bookings" className="text-xs sm:text-sm px-2 sm:px-3">
              Bookings ({dashboardData.bookings?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="invoices" className="text-xs sm:text-sm px-2 sm:px-3">Invoices</TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs sm:text-sm px-2 sm:px-3">Calendar</TabsTrigger>
            <TabsTrigger value="actions" className="text-xs sm:text-sm px-2 sm:px-3">Actions</TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          {/* Registration Status - Full width priority section */}
          <RegistrationStatus />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Main Stats - Takes 2 columns */}
            <div className="lg:col-span-2">
              <ProviderStats stats={dashboardData.stats} />
            </div>

            {/* Quick Actions Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <QuickActions
                stats={{
                  pendingBookings: dashboardData.bookings?.filter(b => b.status === 'PENDING').length || 0,
                  unreadMessages: 3, // Mock data
                  pendingReviews: 2 // Mock data
                }}
                todayBookings={dashboardData.todayBookings}
              />

              {/* Commission Tracker */}
              <CommissionTracker providerEmail={session?.user?.email} />
            </div>
          </div>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings">
          <BookingRequests
            bookings={dashboardData.bookings}
            onStatusUpdate={handleBookingStatusUpdate}
            onOpenChat={handleOpenChat}
          />
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <InvoiceHistory />
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar">
          <CalendarView
            bookings={dashboardData.bookings}
            onDateSelect={handleDateSelect}
          />
        </TabsContent>

        {/* Quick Actions Tab */}
        <TabsContent value="actions">
          <div className="grid grid-cols-1">
            <QuickActions
              stats={{
                pendingBookings: dashboardData.bookings?.filter(b => b.status === 'PENDING').length || 0,
                unreadMessages: 3, // Mock data
                pendingReviews: 2 // Mock data
              }}
              todayBookings={dashboardData.todayBookings}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* ✅ Chat Dialog - Same pattern as customer booking cards */}
      <Dialog open={openChatDialog !== null} onOpenChange={(open) => setOpenChatDialog(open ? openChatDialog : null)}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <MessageCircle className='w-5 h-5 text-primary'/>
              Chat - {selectedBooking?.userName}
            </DialogTitle>
            <DialogDescription>
              Communicate directly with your customer about this booking
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            {selectedBooking && (() => {
              // ✅ FIXED: Use same dm_ format as customer to ensure SAME CONVERSATION
              // This ensures customer and provider are in the same chat room
              const directMessageId = `dm_${selectedBooking.businessId}_${selectedBooking.userEmail?.replace(/[^a-zA-Z0-9]/g, '_')}`

              console.log('🗨️ Provider opening chat with CONSISTENT dm_ format:', directMessageId)
              console.log('🗨️ Customer email:', selectedBooking.userEmail)
              console.log('🗨️ Business ID:', selectedBooking.businessId)

              // ✅ Create business info from provider's perspective with fallbacks
              const businessInfo = {
                id: selectedBooking.businessId || selectedBooking.id,
                name: selectedBooking.businessName || selectedBooking.serviceName || 'Your Service',
                contactPerson: session?.user?.name || 'Provider',
                phone: selectedBooking.businessPhone || session?.user?.phone || '',
                address: selectedBooking.businessAddress || selectedBooking.location || '',
                images: selectedBooking.businessImages || [],
                // Add provider info for context
                providerName: session?.user?.name,
                providerEmail: session?.user?.email
              }

              // Virtual booking details for direct messaging consistency
              const directMessageBooking = {
                id: directMessageId,
                date: selectedBooking.date,
                time: selectedBooking.time,
                status: "inquiry", // Use inquiry status for consistency with dm_ format
                userEmail: selectedBooking.userEmail,
                userName: selectedBooking.userName
              }

              return (
                <ChatWindow
                  bookingId={directMessageId}
                  businessInfo={businessInfo}
                  bookingDetails={directMessageBooking}
                />
              )
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProviderDashboard 