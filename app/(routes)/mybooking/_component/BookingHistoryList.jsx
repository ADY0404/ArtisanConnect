import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, User, MessageCircle, Phone, Mail } from 'lucide-react'
import Image from 'next/image'
import React, { useState } from 'react'
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
import { Badge } from '@/components/ui/badge'
import ApiService from '@/app/_services/ApiService'
import { toast } from 'sonner'
import ChatWindow from '@/app/_components/ChatWindow'
import { useSession } from 'next-auth/react'

function BookingHistoryList({bookingHistory, type}) {
  const [openChatDialog, setOpenChatDialog] = useState(null)
  const { data: session } = useSession()
  
  const cancelAppointment = (booking) => {
    ApiService.deleteBooking(booking.id).then(resp => {
      if(resp) {
        toast('Booking Delete Successfully!')
      }
    }, (e) => {
      toast('Error while canceling booking!')
    })
  }

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

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

  const canContactProvider = (booking) => {
    const allowedStatus = ['confirmed', 'in_progress', 'completed'];
    return allowedStatus.includes(booking.status?.toLowerCase());
  };

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
      {bookingHistory.map((booking, index) => (
        <div key={index} className='border rounded-lg p-4 flex flex-col justify-between hover:shadow-md transition-shadow'>
          <div>
            <div className='flex gap-4 mb-4'>
              {booking?.businessList?.images?.[0] && (
                <Image 
                  src={booking.businessList.images[0]}
                  alt={booking.businessList.name || 'Business'}
                  width={120}
                  height={120}
                  className='rounded-lg object-cover'
                />
              )}
              <div className='flex flex-col gap-2 flex-1'>
                <div className='flex items-start justify-between'>
                  <h2 className='font-bold text-lg'>{booking.businessList.name}</h2>
                  {booking.status && (
                    <Badge className={`text-xs ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </Badge>
                  )}
                </div>
                
                <div className='space-y-1 text-sm'>
                  <div className='flex gap-2 text-primary'> 
                    <User className='w-4 h-4'/> 
                    {booking.businessList.contactPerson}
                  </div>
                  <div className='flex gap-2 text-gray-600'> 
                    <MapPin className='w-4 h-4 text-primary'/> 
                    {booking.businessList.address}
                  </div>
                  <div className='flex gap-2 text-gray-600'>
                    <Calendar className='w-4 h-4 text-primary'/> 
                    <span className='font-medium'>{formatDate(booking.date)}</span>
                  </div>
                  <div className='flex gap-2 text-gray-600'>
                    <Clock className='w-4 h-4 text-primary'/> 
                    <span className='font-medium'>{booking.time}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t'>
            <Button 
              onClick={() => setOpenChatDialog(booking.id)}
              className="flex-1 flex items-center gap-2"
              disabled={!canContactProvider(booking)}
            >
              <MessageCircle className='w-4 h-4'/>
              Chat
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  disabled={!canContactProvider(booking)}
                >
                  <Phone className='w-4 h-4 mr-2'/>
                  Contact
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Contact {booking.businessList.name}</DialogTitle>
                  <DialogDescription>
                    You can contact the provider using the details below.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 my-4">
                  <div className="flex items-center gap-4 p-2 border rounded-lg">
                    <Mail className="w-5 h-5 text-primary"/>
                    <a href={`mailto:${booking.businessList.email}`} className="text-gray-700 hover:underline">
                      {booking.businessList.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-4 p-2 border rounded-lg">
                    <Phone className="w-5 h-5 text-primary"/>
                    <a href={`tel:${booking.businessList.phone}`} className="text-gray-700 hover:underline">
                      {booking.businessList.phone}
                    </a>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Cancel Button - Only for future bookings that are not completed */}
            {type === 'booked' && booking.status !== 'completed' && booking.status !== 'cancelled' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="flex-1 border-red-300 text-red-600 hover:bg-red-50">
                    Cancel
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel this booking? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => cancelAppointment(booking)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Yes, Cancel
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          
          {/* Chat Dialog, separate from the button group */}
          <Dialog open={openChatDialog === booking.id} onOpenChange={(open) => setOpenChatDialog(open ? booking.id : null)}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle className='flex items-center gap-2'>
                  <MessageCircle className='w-5 h-5 text-primary'/>
                  Chat - {booking.businessList.name}
                </DialogTitle>
                <DialogDescription>
                  Communicate directly with your service provider about this booking
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 min-h-0">
                {(() => {
                  // ✅ FIXED: Use direct message format like floating chat and messages page
                  const directMessageId = `dm_${booking.businessList?.id}_${session?.user?.email?.replace(/[^a-zA-Z0-9]/g, '_')}`

                  // Virtual booking details for direct messaging
                  const directMessageBooking = {
                    id: directMessageId,
                    date: booking.date,
                    time: booking.time,
                    status: "inquiry", // Use inquiry status for direct messages
                    userEmail: session?.user?.email,
                    userName: session?.user?.name
                  }

                  return (
                    <ChatWindow
                      bookingId={directMessageId}
                      businessInfo={booking.businessList}
                      bookingDetails={directMessageBooking}
                    />
                  )
                })()}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      ))}
    </div>
  )
}

export default BookingHistoryList