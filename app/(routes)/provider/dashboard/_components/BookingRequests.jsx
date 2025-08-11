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

  // Handle booking action
  const handleBookingAction = async (bookingId, action) => {
    try {
      console.log('🎯 Handling booking action:', { bookingId, action, bookingIdType: typeof bookingId })

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
        'confirm': 'Booking confirmed successfully!',
        'start': 'Service started successfully!',
        'complete': 'Service completed successfully!',
        'cancel': 'Booking cancelled successfully!'
      }

      toast.success(successMessages[action] || `Booking ${action.toLowerCase()} successfully!`)
    } catch (error) {
      console.error('❌ Booking action failed:', error)
      toast.error(error.message || `Failed to ${action.toLowerCase()} booking`)
    }
  }

  // Handle reschedule
  const handleReschedule = async () => {
    try {
      if (!rescheduleData.newDate || !rescheduleData.newTime) {
        toast.error('Please select both date and time')
        return
      }

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

      if (response.ok) {
        toast.success('Booking rescheduled successfully!')
        setRescheduleData({ bookingId: null, newDate: '', newTime: '', reason: '' })
        // Reload bookings
        window.location.reload()
      } else {
        throw new Error('Failed to reschedule')
      }
    } catch (error) {
      toast.error('Failed to reschedule booking')
    }
  }

  // Handle add customer note
  const handleAddNote = async () => {
    try {
      if (!customerNotes.note.trim()) {
        toast.error('Please enter a note')
        return
      }

      const response = await fetch('/api/provider/bookings/add-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: customerNotes.bookingId,
          note: customerNotes.note
        })
      })

      if (response.ok) {
        toast.success('Note added successfully!')
        setCustomerNotes({ bookingId: null, note: '' })
        // Reload bookings
        window.location.reload()
      } else {
        throw new Error('Failed to add note')
      }
    } catch (error) {
      toast.error('Failed to add note')
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
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Confirm Booking
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
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancel
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
            >
              Reschedule Booking
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
                placeholder="Add your note here..."
                value={customerNotes.note}
                onChange={(e) => setCustomerNotes({...customerNotes, note: e.target.value})}
                rows={4}
              />
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
            >
              Add Note
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Generation Dialog */}
      <Dialog open={!!invoiceData.bookingId} onOpenChange={(open) => !open && setInvoiceData({ bookingId: null, booking: null })}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Invoice</DialogTitle>
            <DialogDescription>
              Create an invoice for the completed service
            </DialogDescription>
          </DialogHeader>
          {invoiceData.booking && (
            <InvoiceGenerator
              booking={invoiceData.booking}
              onInvoiceGenerated={handleInvoiceGenerated}
              onClose={() => setInvoiceData({ bookingId: null, booking: null })}
            />
          )}
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
    </Card>
  )
}

export default BookingRequests