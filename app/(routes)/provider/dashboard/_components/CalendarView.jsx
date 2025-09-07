import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  MapPin,
  Plus,
  Settings,
  X,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import useMediaQuery from '@/app/_hooks/useMediaQuery'

function CalendarView({ bookings = [], onDateSelect }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('month') // 'month', 'week', 'day'
  const [availability, setAvailability] = useState(null)
  const [blockedSlots, setBlockedSlots] = useState([])
  const [showAvailabilitySettings, setShowAvailabilitySettings] = useState(false)
  const [blockTimeData, setBlockTimeData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    reason: ''
  })
  const isMobile = useMediaQuery('(max-width: 768px)')

  // Load availability data
  useEffect(() => {
    loadAvailability()
  }, [])

  const loadAvailability = async () => {
    try {
      const response = await fetch('/api/provider/availability')
      if (response.ok) {
        const data = await response.json()
        setAvailability(data)
        setBlockedSlots(data.blockedSlots || [])
      }
    } catch (error) {
      console.error('Failed to load availability:', error)
    }
  }

  // Calendar navigation
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + (direction * 7))
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Handle availability update
  const handleAvailabilityUpdate = async (updatedAvailability) => {
    try {
      const response = await fetch('/api/provider/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedAvailability)
      })

      if (response.ok) {
        setAvailability(updatedAvailability)
        toast.success('Availability updated successfully!')
      } else {
        throw new Error('Failed to update availability')
      }
    } catch (error) {
      toast.error('Failed to update availability')
    }
  }

  // Handle block time
  const handleBlockTime = async () => {
    try {
      if (!blockTimeData.date || !blockTimeData.startTime || !blockTimeData.endTime) {
        toast.error('Please fill in all required fields')
        return
      }

      const response = await fetch('/api/provider/availability', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'block_time',
          data: blockTimeData
        })
      })

      if (response.ok) {
        const result = await response.json()
        setBlockedSlots(prev => [...prev, result.blockedSlot])
        setBlockTimeData({ date: '', startTime: '', endTime: '', reason: '' })
        toast.success('Time slot blocked successfully!')
      } else {
        throw new Error('Failed to block time slot')
      }
    } catch (error) {
      toast.error('Failed to block time slot')
    }
  }

  // Handle unblock time
  const handleUnblockTime = async (slotId) => {
    try {
      const response = await fetch('/api/provider/availability', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'unblock_time',
          data: { slotId }
        })
      })

      if (response.ok) {
        setBlockedSlots(prev => prev.filter(slot => slot.id !== slotId))
        toast.success('Time slot unblocked successfully!')
      } else {
        throw new Error('Failed to unblock time slot')
      }
    } catch (error) {
      toast.error('Failed to unblock time slot')
    }
  }

  // Get bookings for a specific date
  const getBookingsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0]
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.date).toISOString().split('T')[0]
      return bookingDate === dateStr
    })
  }

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Generate calendar days for month view
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const currentDateCopy = new Date(startDate)
    
    for (let i = 0; i < 42; i++) { // 6 weeks × 7 days
      days.push(new Date(currentDateCopy))
      currentDateCopy.setDate(currentDateCopy.getDate() + 1)
    }
    
    return days
  }

  // Generate week days for week view
  const generateWeekDays = () => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
    
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      days.push(day)
    }
    
    return days
  }

  // Get status color for booking
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'IN_PROGRESS':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Render month view
  const renderMonthView = () => {
    const days = generateCalendarDays()
    const today = new Date()
    const currentMonth = currentDate.getMonth()

    return (
      <div className="grid grid-cols-7 gap-1 overflow-x-auto">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-gray-500 bg-gray-50">
            {isMobile ? day.charAt(0) : day}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map((day, index) => {
          const dayBookings = getBookingsForDate(day)
          const isToday = day.toDateString() === today.toDateString()
          const isCurrentMonth = day.getMonth() === currentMonth
          
          return (
            <div
              key={index}
              className={`
                min-h-[60px] sm:min-h-[100px] p-1 border border-gray-200 cursor-pointer hover:bg-gray-50
                ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                ${isToday ? 'bg-blue-50 border-blue-300' : ''}
              `}
              onClick={() => onDateSelect && onDateSelect(day)}
            >
              <div className="flex flex-col h-full">
                <div className={`
                  text-center text-xs sm:text-sm font-medium
                  ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                  ${isToday ? 'text-blue-700 font-bold' : ''}
                `}>
                  {day.getDate()}
                </div>
                
                <div className="flex-grow overflow-y-auto mt-1">
                  {dayBookings.length > 0 && (
                    <div className="space-y-1">
                      {dayBookings.slice(0, isMobile ? 1 : 3).map(booking => (
                        <div
                          key={booking.id}
                          className={`
                            p-1 rounded text-xs truncate
                            ${getStatusColor(booking.status)}
                          `}
                          onClick={(e) => {
                            e.stopPropagation()
                            onDateSelect && onDateSelect(day, booking)
                          }}
                        >
                          {isMobile ? (
                            <div className="w-2 h-2 rounded-full bg-current mx-auto" />
                          ) : (
                            <>
                              <div className="font-medium truncate">{booking.time}</div>
                              <div className="truncate">{booking.userName}</div>
                            </>
                          )}
                        </div>
                      ))}
                      {dayBookings.length > (isMobile ? 1 : 3) && (
                        <div className="text-xs text-center text-gray-500">
                          +{dayBookings.length - (isMobile ? 1 : 3)} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Render week view
  const renderWeekView = () => {
    const days = generateWeekDays()
    const today = new Date()

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-2 sm:gap-4">
          {days.map((day, index) => {
            const dayBookings = getBookingsForDate(day)
            const isToday = day.toDateString() === today.toDateString()
            
            return (
              <div key={index} className="space-y-2">
                <div className={`
                  text-center p-1 sm:p-2 rounded-lg
                  ${isToday ? 'bg-blue-100 text-blue-800' : 'bg-gray-50'}
                `}>
                  <div className="text-xs font-medium">
                    {day.toLocaleDateString('en-US', { weekday: isMobile ? 'narrow' : 'short' })}
                  </div>
                  <div className="text-sm sm:text-lg font-bold">
                    {day.getDate()}
                  </div>
                </div>
                
                <div className="space-y-1 min-h-[100px] sm:min-h-[200px] overflow-y-auto">
                  {dayBookings.map(booking => (
                    <div
                      key={booking.id}
                      className={`
                        p-1 sm:p-2 rounded-lg text-xs cursor-pointer hover:shadow-sm
                        ${getStatusColor(booking.status)}
                      `}
                      onClick={() => onDateSelect && onDateSelect(day, booking)}
                    >
                      <div className="font-medium">{booking.time}</div>
                      {!isMobile && (
                        <>
                          <div className="truncate">{booking.userName}</div>
                          <div className="text-xs opacity-75">{booking.status}</div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Render day view
  const renderDayView = () => {
    const dayBookings = getBookingsForDate(currentDate)
    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <div className="space-y-4">
        <div className="text-center p-2 sm:p-4 bg-gray-50 rounded-lg">
          <h3 className="text-base sm:text-lg font-semibold">{formatDate(currentDate)}</h3>
          <p className="text-xs sm:text-sm text-gray-600">{dayBookings.length} booking(s) scheduled</p>
        </div>

        <div className="grid grid-cols-1 gap-1 sm:gap-2 max-h-96 overflow-y-auto">
          {hours.map(hour => {
            const hourBookings = dayBookings.filter(booking => {
              const bookingHour = parseInt(booking.time?.split(':')[0] || '0')
              return bookingHour === hour
            })

            return (
              <div key={hour} className="flex items-center gap-2 sm:gap-4 p-1 sm:p-2 border-b border-gray-100">
                <div className="w-10 sm:w-16 text-xs sm:text-sm text-gray-500 font-medium">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="flex-1">
                  {hourBookings.length > 0 ? (
                    <div className="space-y-1">
                      {hourBookings.map(booking => (
                        <div
                          key={booking.id}
                          className={`
                            p-1 sm:p-2 rounded text-xs sm:text-sm cursor-pointer hover:shadow-sm
                            ${getStatusColor(booking.status)}
                          `}
                        >
                          <div className="font-medium">{booking.userName}</div>
                          <div className="text-xs">{booking.time} - {booking.status}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs sm:text-sm text-gray-300">Available</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Render agenda view for mobile
  const renderAgendaView = () => {
    const monthBookings = bookings.filter(
      (b) => new Date(b.date).getMonth() === currentDate.getMonth() && new Date(b.date).getFullYear() === currentDate.getFullYear()
    ).sort((a, b) => new Date(a.date) - new Date(b.date));

    return (
      <div className="space-y-3">
        {monthBookings.length > 0 ? monthBookings.map(booking => (
          <div 
            key={booking.id} 
            className={`p-3 rounded-lg ${getStatusColor(booking.status)}`}
            onClick={() => onDateSelect && onDateSelect(new Date(booking.date), booking)}
          >
            <div className="font-bold">{booking.userName}</div>
            <div className="text-sm flex justify-between">
              <span>{new Date(booking.date).toLocaleDateString()} - {booking.time}</span>
              <Badge variant="outline" className="text-xs">{booking.status}</Badge>
            </div>
          </div>
        )) : (
          <div className="text-center text-gray-500 py-4">No bookings for this month.</div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Schedule Calendar
            </CardTitle>
            <CardDescription>
              View your bookings and manage your schedule
            </CardDescription>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* View Mode Selector */}
            <div className="flex items-center gap-1 border rounded-md p-1 bg-gray-50 w-full sm:w-auto">
              <button
                onClick={() => setViewMode('month')}
                className={`text-xs px-2 py-1 rounded ${viewMode === 'month' ? 'bg-white shadow' : 'text-gray-600'}`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`text-xs px-2 py-1 rounded ${viewMode === 'week' ? 'bg-white shadow' : 'text-gray-600'}`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`text-xs px-2 py-1 rounded ${viewMode === 'day' ? 'bg-white shadow' : 'text-gray-600'}`}
              >
                Day
              </button>
            </div>
            
            {/* Availability Settings */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <Settings className="w-4 h-4 mr-1" />
                  Availability
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md sm:max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Manage Availability</DialogTitle>
                  <DialogDescription>
                    Set your working hours and block unavailable time slots
                  </DialogDescription>
                </DialogHeader>
                {availability ? (
                  <div className="space-y-6">
                    {/* Working Hours */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Working Hours</h3>
                      <div className="space-y-4">
                        {Object.keys(availability.workingHours).map(day => (
                          <div key={day} className="grid grid-cols-2 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                            <label className="capitalize font-medium text-sm col-span-2 sm:col-span-1">{day}</label>
                            <Input 
                              type="time" 
                              value={availability.workingHours[day].start} 
                              onChange={(e) => {
                                const newAvailability = { ...availability }
                                newAvailability.workingHours[day].start = e.target.value
                                setAvailability(newAvailability)
                              }}
                              className="col-span-1"
                            />
                            <Input 
                              type="time" 
                              value={availability.workingHours[day].end} 
                              onChange={(e) => {
                                const newAvailability = { ...availability }
                                newAvailability.workingHours[day].end = e.target.value
                                setAvailability(newAvailability)
                              }}
                              className="col-span-1"
                            />
                            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                              <Switch
                                checked={availability.workingHours[day].available}
                                onCheckedChange={(checked) => {
                                  const newAvailability = { ...availability }
                                  newAvailability.workingHours[day].available = checked
                                  setAvailability(newAvailability)
                                }}
                              />
                              <span className="text-sm">{availability.workingHours[day].available ? 'Open' : 'Closed'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button onClick={() => handleAvailabilityUpdate(availability)}>Save Changes</Button>
                  </div>
                ) : (
                  <div>Loading availability...</div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Calendar Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <Button
              variant="outline"
              size="sm"
              onClick={() => viewMode === 'month' ? navigateMonth(-1) : navigateWeek(-1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => viewMode === 'month' ? navigateMonth(1) : navigateWeek(1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <h2 className="text-lg sm:text-xl font-semibold text-center">
            {currentDate.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
              ...(viewMode === 'day' && { day: 'numeric' })
            })}
          </h2>
          
          <div className="hidden sm:flex items-center justify-center gap-2">
            {/* Status Legend */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-200 rounded"></div>
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-200 rounded"></div>
                <span>Confirmed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-200 rounded"></div>
                <span>Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Status Legend */}
        <div className="flex sm:hidden items-center justify-center gap-3 text-xs mb-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-200 rounded"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-200 rounded"></div>
            <span>Confirmed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-200 rounded"></div>
            <span>Active</span>
          </div>
        </div>

        {/* Calendar Content */}
        <div className="calendar-content">
          {isMobile && viewMode === 'month' ? renderAgendaView() : (
            <>
              {viewMode === 'month' && renderMonthView()}
              {viewMode === 'week' && renderWeekView()}
              {viewMode === 'day' && renderDayView()}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default CalendarView 