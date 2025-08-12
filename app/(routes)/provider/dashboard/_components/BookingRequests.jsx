import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  MessageCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PlayCircle,
  Eye,
  Receipt,
  CreditCard
} from 'lucide-react'
import InvoiceGenerator from '@/app/_components/InvoiceGenerator'
import PaymentMethodSelector from '@/app/_components/PaymentMethodSelector'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Image from 'next/image'
import { toast } from 'sonner'

function BookingRequests({ bookings = [], onStatusUpdate, onOpenChat }) {
  const [selectedTab, setSelectedTab] = useState('pending')
  const [rescheduleData, setRescheduleData] = useState({
    bookingId: null,
    newDate: '',
    newTime: '',
    reason: ''
  })
  const [customerNotes, setCustomerNotes] = useState({
    bookingId: null,
    note: ''
  })
  const [invoiceData, setInvoiceData] = useState({
    bookingId: null,
    booking: null
  })
  const [paymentMethodData, setPaymentMethodData] = useState({
    bookingId: null,
    booking: null
  })
  const [loadingActions, setLoadingActions] = useState({}) // Track loading state for each booking action
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    action: null,
    bookingId: null,
    title: '',
    message: ''
  })

  // Filter bookings by status
  const filterBookings = (status) => {
    switch (status) {
      case 'pending':
        return bookings.filter(b => b.status === 'PENDING')
      case 'confirmed':
        return bookings.filter(b => b.status === 'CONFIRMED')
      case 'in-progress':
        return bookings.filter(b => b.status === 'IN_PROGRESS')
      case 'completed':
        return bookings.filter(b => b.status === 'COMPLETED')
      default:
        return bookings
    }
  }

  // Get status color and icon
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'PENDING':
        return { 
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
          icon: <AlertCircle className="w-3 h-3" />,
          label: 'Pending Response'
        }
      case 'CONFIRMED':
        return { 
          color: 'bg-blue-100 text-blue-800 border-blue-200', 
          icon: <CheckCircle2 className="w-3 h-3" />,
          label: 'Confirmed'
        }
      case 'IN_PROGRESS':
        return { 
          color: 'bg-green-100 text-green-800 border-green-200', 
          icon: <PlayCircle className="w-3 h-3" />,
          label: 'In Progress'
        }
      case 'COMPLETED':
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-200', 
          icon: <CheckCircle2 className="w-3 h-3" />,
          label: 'Completed'
        }
      case 'CANCELLED':
        return { 
          color: 'bg-red-100 text-red-800 border-red-200', 
          icon: <XCircle className="w-3 h-3" />,
          label: 'Cancelled'
        }
      default:
        return { 
          color: 'bg-gray-100 text-gray-800', 
          icon: <AlertCircle className="w-3 h-3" />,
          label: status
        }
    }
  }

  // Format date and time
  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  const formatTime = (timeStr) => {
    return timeStr || 'Time not specified'
  }

  // Map action names to API status values
  const mapActionToStatus = (action) => {
    const actionMap = {
      'confirm': 'CONFIRMED',
      'start': 'IN_PROGRESS',
      'complete': 'COMPLETED',
      'cancel': 'CANCELLED'
    }
    return actionMap[action] || action
  }

  // Handle booking action with confirmation for destructive actions
  const handleBookingAction = async (bookingId, action, skipConfirmation = false) => {
    // Check if this action needs confirmation
    const destructiveActions = ['cancel', 'complete']
    if (destructiveActions.includes(action) && !skipConfirmation) {
      const confirmationMessages = {
        'cancel': {
          title: 'Cancel Booking',
          message: 'Are you sure you want to cancel this booking? This action cannot be undone and the customer will be notified.'
        },
        'complete': {
          title: 'Complete Service',
          message: 'Are you sure you want to mark this service as completed? Make sure all work has been finished.'
        }
      }

      setConfirmDialog({
        open: true,
        action,
        bookingId,
        ...confirmationMessages[action]
      })
      return
    }

    try {
      console.log('🎯 Handling booking action:', { bookingId, action, bookingIdType: typeof bookingId })

      // Set loading state for this specific action
      setLoadingActions(prev => ({ ...prev, [`${bookingId}-${action}`]: true }))

      // Validate inputs
      if (!bookingId) {
        throw new Error('Booking ID is required')
      }
      if (!action) {
        throw new Error('Action is required')
      }

      // Map action to correct status
      const status = mapActionToStatus(action)
      console.log('📝 Action mapping:', { action, status })

      await onStatusUpdate(bookingId, status)

      // Success messages based on action
      const successMessages = {
        'confirm': 'Booking confirmed successfully! Customer has been notified.',
        'start': 'Service started successfully! You can now track your progress.',
        'complete': 'Service completed successfully! You can now generate an invoice.',
        'cancel': 'Booking cancelled successfully! Customer has been notified.'
      }

      toast.success(successMessages[action] || `Booking ${action.toLowerCase()} successfully!`)
    } catch (error) {
      console.error('❌ Booking action failed:', error)

      // Enhanced error messages
      let errorMessage = `Failed to ${action.toLowerCase()} booking`
      if (error.message.includes('Authentication')) {
        errorMessage = 'Please sign in again to perform this action'
      } else if (error.message.includes('Provider access')) {
        errorMessage = 'You do not have permission to perform this action'
      } else if (error.message.includes('not found')) {
        errorMessage = 'Booking not found. It may have been deleted or modified.'
      } else if (error.message) {
        errorMessage = error.message
      }

      toast.error(errorMessage)
    } finally {
      // Clear loading state
      setLoadingActions(prev => {
        const newState = { ...prev }
        delete newState[`${bookingId}-${action}`]
        return newState
      })

      // Close confirmation dialog
      setConfirmDialog({ open: false, action: null, bookingId: null, title: '', message: '' })
    }
  }

  // Handle reschedule with enhanced error handling
  const handleReschedule = async () => {
    try {
      if (!rescheduleData.newDate || !rescheduleData.newTime) {
        toast.error('Please select both date and time')
        return
      }

      // Validate that new date is not in the past
      const selectedDateTime = new Date(`${rescheduleData.newDate}T${rescheduleData.newTime}`)
      const now = new Date()
      if (selectedDateTime <= now) {
        toast.error('Please select a future date and time')
        return
      }

      // Set loading state
      setLoadingActions(prev => ({ ...prev, [`${rescheduleData.bookingId}-reschedule`]: true }))

      const response = await fetch('/api/provider/bookings/reschedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: rescheduleData.bookingId,
          newDate: rescheduleData.newDate,
          newTime: rescheduleData.newTime,
          reason: rescheduleData.reason
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Booking rescheduled successfully! Customer has been notified.')
        setRescheduleData({ bookingId: null, newDate: '', newTime: '', reason: '' })
        // Reload bookings
        window.location.reload()
      } else {
        throw new Error(result.error || 'Failed to reschedule booking')
      }
    } catch (error) {
      console.error('❌ Reschedule error:', error)
      toast.error(error.message || 'Failed to reschedule booking. Please try again.')
    } finally {
      // Clear loading state
      setLoadingActions(prev => {
        const newState = { ...prev }
        delete newState[`${rescheduleData.bookingId}-reschedule`]
        return newState
      })
    }
  }

  // Handle add customer note with enhanced validation
  const handleAddNote = async () => {
    try {
      if (!customerNotes.note.trim()) {
        toast.error('Please enter a note')
        return
      }

      if (customerNotes.note.trim().length < 5) {
        toast.error('Note must be at least 5 characters long')
        return
      }

      if (customerNotes.note.trim().length > 500) {
        toast.error('Note must be less than 500 characters')
        return
      }

      // Set loading state
      setLoadingActions(prev => ({ ...prev, [`${customerNotes.bookingId}-note`]: true }))

      const response = await fetch('/api/provider/bookings/add-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: customerNotes.bookingId,
          note: customerNotes.note.trim()
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Note added successfully! Customer can view this note.')
        setCustomerNotes({ bookingId: null, note: '' })
        // Reload bookings
        window.location.reload()
      } else {
        throw new Error(result.error || 'Failed to add note')
      }
    } catch (error) {
      console.error('❌ Add note error:', error)
      toast.error(error.message || 'Failed to add note. Please try again.')
    } finally {
      // Clear loading state
      setLoadingActions(prev => {
        const newState = { ...prev }
        delete newState[`${customerNotes.bookingId}-note`]
        return newState
      })
    }
  }

  // Render booking card
  const BookingCard = ({ booking }) => {
    const statusDisplay = getStatusDisplay(booking.status)
    
    return (
      <Card className={`mb-4 overflow-hidden border-l-4 ${booking.status === 'PENDING' ? 'border-l-yellow-400' : booking.status === 'CONFIRMED' ? 'border-l-blue-400' : booking.status === 'IN_PROGRESS' ? 'border-l-green-400' : 'border-l-gray-300'}`}>
        <CardContent className="p-0">
          {/* Booking Header */}
          <div className="p-4 bg-gray-50 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <Badge className={statusDisplay.color}>
                <span className="flex items-center gap-1">
                  {statusDisplay.icon}
                  {statusDisplay.label}
                </span>
              </Badge>
              <span className="text-sm font-medium">
                {formatDate(booking.date)} at {booking.time}
              </span>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onOpenChat(booking)}
                className="flex items-center gap-1 text-xs w-full sm:w-auto"
              >
                <MessageCircle className="w-3 h-3" />
                Message
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1 text-xs w-full sm:w-auto"
                  >
                    <Eye className="w-3 h-3" />
                    View Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Booking Details</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Customer Information</h3>
                        <div className="space-y-2 text-sm">
                          <p className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            {booking.userName}
                          </p>
                          <p className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            {booking.userEmail}
                          </p>
                          {booking.userPhone && (
                            <p className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              {booking.userPhone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-2">Booking Information</h3>
                        <div className="space-y-2 text-sm">
                          <p className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {formatDate(booking.date)}
                          </p>
                          <p className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {booking.time}
                          </p>
                          {booking.location && (
                            <p className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              {booking.location}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {booking.notes && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">Notes</h3>
                        <p className="text-sm p-3 bg-gray-50 rounded-md">{booking.notes}</p>
                      </div>
                    )}
                    
                    {booking.status === 'PENDING' && (
                      <div className="flex flex-col sm:flex-row gap-2 pt-4">
                        <Button
                          className="w-full sm:w-auto"
                          onClick={() => handleBookingAction(booking.id, 'confirm')}
                          disabled={loadingActions[`${booking.id}-confirm`]}
                        >
                          {loadingActions[`${booking.id}-confirm`] ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                          )}
                          {loadingActions[`${booking.id}-confirm`] ? 'Confirming...' : 'Confirm Booking'}
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full sm:w-auto"
                          onClick={() => {
                            setRescheduleData({
                              bookingId: booking.id,
                              newDate: booking.date,
                              newTime: booking.time,
                              reason: ''
                            })
                          }}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Reschedule
                        </Button>

                        <Button
                          variant="destructive"
                          className="w-full sm:w-auto"
                          onClick={() => handleBookingAction(booking.id, 'cancel')}
                          disabled={loadingActions[`${booking.id}-cancel`]}
                        >
                          {loadingActions[`${booking.id}-cancel`] ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <XCircle className="w-4 h-4 mr-2" />
                          )}
                          {loadingActions[`${booking.id}-cancel`] ? 'Cancelling...' : 'Cancel'}
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive"
                              className="w-full sm:w-auto"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Decline
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Decline Booking</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to decline this booking? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
                              <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                className="w-full sm:w-auto"
                                onClick={() => handleBookingAction(booking.id, 'decline')}
                              >
                                Decline Booking
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Booking Content */}
          <div className="p-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="space-y-2">
                <h3 className="font-medium">{booking.userName}</h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-gray-600">
                  <p className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(booking.date)}
                  </p>
                  <p className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {booking.time}
                  </p>
                </div>
                {booking.notes && (
                  <p className="text-sm text-gray-600 italic">"{booking.notes}"</p>
                )}
              </div>
              
              {booking.status === 'PENDING' && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleBookingAction(booking.id, 'confirm')}
                    className="w-full sm:w-auto"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Confirm
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRescheduleData({
                        bookingId: booking.id,
                        newDate: booking.date,
                        newTime: booking.time,
                        reason: ''
                      })
                    }}
                    className="w-full sm:w-auto"
                  >
                    Reschedule
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCustomerNotes({
                        bookingId: booking.id,
                        note: ''
                      })
                    }}
                    className="w-full sm:w-auto"
                  >
                    Add Note
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleBookingAction(booking.id, 'cancel')}
                    className="w-full sm:w-auto"
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              )}
              
              {booking.status === 'CONFIRMED' && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleBookingAction(booking.id, 'start')}
                    className="w-full sm:w-auto"
                  >
                    <PlayCircle className="w-3 h-3 mr-1" />
                    Start Service
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRescheduleData({
                        bookingId: booking.id,
                        newDate: booking.date,
                        newTime: booking.time,
                        reason: ''
                      })
                    }}
                    className="w-full sm:w-auto"
                  >
                    Reschedule
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleBookingAction(booking.id, 'cancel')}
                    className="w-full sm:w-auto"
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              )}
              
              {booking.status === 'IN_PROGRESS' && (
                <Button
                  size="sm"
                  onClick={() => handleBookingAction(booking.id, 'complete')}
                  className="w-full sm:w-auto"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Complete Service
                </Button>
              )}

              {booking.status === 'COMPLETED' && (
                <div className="flex flex-col sm:flex-row gap-2">
                  {!booking.invoiceGenerated ? (
                    <Button
                      size="sm"
                      onClick={() => setInvoiceData({ bookingId: booking.id, booking })}
                      className="w-full sm:w-auto"
                    >
                      <Receipt className="w-3 h-3 mr-1" />
                      Generate Invoice
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPaymentMethodData({ bookingId: booking.id, booking })}
                        className="w-full sm:w-auto"
                      >
                        <CreditCard className="w-3 h-3 mr-1" />
                        Update Payment Method
                      </Button>
                      <Badge variant="secondary" className="text-xs">
                        Invoice: {booking.invoiceId}
                      </Badge>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Handle invoice generation
  const handleInvoiceGenerated = (invoice) => {
    toast.success('Invoice generated successfully!')
    setInvoiceData({ bookingId: null, booking: null })
    // Refresh bookings data
    if (onStatusUpdate) {
      onStatusUpdate(invoice.bookingId, 'COMPLETED')
    }
  }

  // Handle payment method update
  const handlePaymentMethodSelected = (updatedBooking) => {
    toast.success('Payment method updated successfully!')
    setPaymentMethodData({ bookingId: null, booking: null })
    // Refresh bookings data
    if (onStatusUpdate) {
      onStatusUpdate(updatedBooking._id, updatedBooking.status)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Booking Requests
        </CardTitle>
        <CardDescription>
          Manage your service bookings and appointments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <div className="overflow-x-auto">
            <TabsList className="mb-4 grid min-w-[400px] w-full grid-cols-4">
              <TabsTrigger value="pending">
                Pending ({filterBookings('pending').length})
              </TabsTrigger>
              <TabsTrigger value="confirmed">
                Confirmed ({filterBookings('confirmed').length})
              </TabsTrigger>
              <TabsTrigger value="in-progress">
                In Progress ({filterBookings('in-progress').length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({filterBookings('completed').length})
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="pending">
            {filterBookings('pending').length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No pending bookings</p>
              </div>
            ) : (
              <div>
                {filterBookings('pending').map(booking => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="confirmed">
            {filterBookings('confirmed').length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No confirmed bookings</p>
              </div>
            ) : (
              <div>
                {filterBookings('confirmed').map(booking => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="in-progress">
            {filterBookings('in-progress').length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No in-progress bookings</p>
              </div>
            ) : (
              <div>
                {filterBookings('in-progress').map(booking => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completed">
            {filterBookings('completed').length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No completed bookings</p>
              </div>
            ) : (
              <div>
                {filterBookings('completed').map(booking => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Reschedule Dialog */}
      <Dialog open={!!rescheduleData.bookingId} onOpenChange={(open) => !open && setRescheduleData({ bookingId: null, newDate: '', newTime: '', reason: '' })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Booking</DialogTitle>
            <DialogDescription>
              Propose a new date and time for this booking
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              <label htmlFor="new-date" className="text-sm font-medium">New Date</label>
              <Input
                id="new-date"
                type="date"
                value={rescheduleData.newDate}
                onChange={(e) => setRescheduleData({...rescheduleData, newDate: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <label htmlFor="new-time" className="text-sm font-medium">New Time</label>
              <Input
                id="new-time"
                type="time"
                value={rescheduleData.newTime}
                onChange={(e) => setRescheduleData({...rescheduleData, newTime: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <label htmlFor="reason" className="text-sm font-medium">Reason (Optional)</label>
              <Textarea
                id="reason"
                placeholder="Please provide a reason for rescheduling"
                value={rescheduleData.reason}
                onChange={(e) => setRescheduleData({...rescheduleData, reason: e.target.value})}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setRescheduleData({ bookingId: null, newDate: '', newTime: '', reason: '' })}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReschedule}
              className="w-full sm:w-auto"
              disabled={loadingActions[`${rescheduleData.bookingId}-reschedule`]}
            >
              {loadingActions[`${rescheduleData.bookingId}-reschedule`] ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Rescheduling...
                </>
              ) : (
                'Reschedule Booking'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={!!customerNotes.bookingId} onOpenChange={(open) => !open && setCustomerNotes({ bookingId: null, note: '' })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Note to Booking</DialogTitle>
            <DialogDescription>
              Add a note that will be visible to you and the customer
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              <label htmlFor="note" className="text-sm font-medium">Note</label>
              <Textarea
                id="note"
                placeholder="Add your note here... (minimum 5 characters)"
                value={customerNotes.note}
                onChange={(e) => setCustomerNotes({...customerNotes, note: e.target.value})}
                rows={4}
                maxLength={500}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Minimum 5 characters</span>
                <span>{customerNotes.note.length}/500</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setCustomerNotes({ bookingId: null, note: '' })}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddNote}
              className="w-full sm:w-auto"
              disabled={loadingActions[`${customerNotes.bookingId}-note`]}
            >
              {loadingActions[`${customerNotes.bookingId}-note`] ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding Note...
                </>
              ) : (
                'Add Note'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Generation Dialog */}
      <Dialog open={!!invoiceData.bookingId} onOpenChange={(open) => !open && setInvoiceData({ bookingId: null, booking: null })}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Invoice</DialogTitle>
            <DialogDescription>
              Create an invoice for the completed service
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
            {invoiceData.booking && (
              <InvoiceGenerator
                booking={invoiceData.booking}
                onInvoiceGenerated={handleInvoiceGenerated}
                onClose={() => setInvoiceData({ bookingId: null, booking: null })}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Method Selection Dialog */}
      <Dialog open={!!paymentMethodData.bookingId} onOpenChange={(open) => !open && setPaymentMethodData({ bookingId: null, booking: null })}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Payment Method</DialogTitle>
            <DialogDescription>
              Specify how the customer paid for this service
            </DialogDescription>
          </DialogHeader>
          {paymentMethodData.booking && (
            <PaymentMethodSelector
              booking={paymentMethodData.booking}
              onPaymentMethodSelected={handlePaymentMethodSelected}
              onClose={() => setPaymentMethodData({ bookingId: null, booking: null })}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, action: null, bookingId: null, title: '', message: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleBookingAction(confirmDialog.bookingId, confirmDialog.action, true)}
              className={confirmDialog.action === 'cancel' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {confirmDialog.action === 'cancel' ? 'Yes, Cancel Booking' : 'Yes, Complete Service'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

export default BookingRequests