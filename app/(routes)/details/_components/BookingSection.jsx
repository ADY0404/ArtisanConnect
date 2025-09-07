import React, { useEffect, useState } from 'react'
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
  } from "@/components/ui/sheet"

  import { Calendar } from "@/components/ui/calendar"
import { Button } from '@/components/ui/button';
import ApiService from '@/app/_services/ApiService';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import moment from 'moment';

function BookingSection({children,business}) {

    const [date,setDate]=useState(new Date());
    const [timeSlot,setTimeSlot]=useState([]);
    const [selectedTime,setSelectedTime]=useState();
    const [bookedSlot,setBookedSlot]=useState([]);
    const {data}=useSession();
    const [availability, setAvailability] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);

    useEffect(() => {
      const fetchAvailability = async () => {
        try {
          const resp = await ApiService.getAvailability(business.id);
          setAvailability(resp);
        } catch (e) {
          console.error('Error fetching availability:', e);
        }
      };
      fetchAvailability();
      getTime(); // Keep for fallback
    }, [business.id]);

    useEffect(()=>{
        date&&BusinessBookedSlot();
    },[date])

    /**
     * Get Selected Date Business Booked Slot
     */
    const BusinessBookedSlot = async () => {
      try {
        const formattedDate = moment(date).format('YYYY-MM-DD');
        const resp = await ApiService.getAvailableSlots(business.id, formattedDate);
        setAvailableSlots(resp.availableSlots.map(t => ({ time: t })));
      } catch (e) {
        console.error('Error fetching slots:', e);
        setAvailableSlots([]);
      }
    };

    const getTime = () => {
        const timeList = [];
        for (let i = 10; i <= 12; i++) {
            timeList.push({
                time: i + ':00 AM'
            })
            timeList.push({
                time: i + ':30 AM'
            })
        }
        for (let i = 1; i <= 6; i++) {
            timeList.push({
                time: i + ':00 PM'
            })
            timeList.push({
                time: i + ':30 PM'
            })
        }
  
        setTimeSlot(timeList)
      }

      const saveBooking=()=>{
            const bookingData = {
                BusinessList: business.id,
                Date: moment(date).format('YYYY-MM-DD'),
                Time: selectedTime,
                UserEmail: data.user.email,
                UserName: data.user.name,
                Note: 'Booking via website'
            };
            
            console.log('📋 BookingSection: Creating booking with data:', bookingData);
            
            ApiService.createBooking(bookingData)
                .then(resp=>{
                    console.log('📋 BookingSection: Booking response:', resp);
                    if(resp && resp.createBooking)
                    {
                        console.log('📋 BookingSection: Booking created successfully with ID:', resp.createBooking.id);
                        setDate();
                        setSelectedTime('');
                        toast('Service Booked successfully!')
                        // Refresh available slots
                        BusinessBookedSlot();
                    } else {
                        console.log('❌ BookingSection: Invalid response structure:', resp);
                        toast('Error: Invalid response from server')
                    }
                },(e)=>{
                    console.error('❌ BookingSection: Booking error:', e);
                    toast('Error while creating booking')
                })
      }

      const disableDay = (day) => {
        // Disable past dates
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day
        if (day < today) {
          return true;
        }

        if (!availability) return false;
        const weekday = day.toLocaleString('en-us', { weekday: 'long' }).toLowerCase();
        const dayHours = availability.workingHours[weekday];
        if (!dayHours || !dayHours.enabled) return true;

        const dayStr = moment(day).format('YYYY-MM-DD');
        const blockedForDay = availability.blockedSlots.filter(slot => slot.date === dayStr);
        const workingStart = parseTime(dayHours.start);
        const workingEnd = parseTime(dayHours.end);

        for (let block of blockedForDay) {
          const blockStart = parseTime(block.startTime);
          const blockEnd = parseTime(block.endTime);
          if (blockStart <= workingStart && blockEnd >= workingEnd) {
            return true;
          }
        }
        return false;
      };

      const parseTime = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };
    return (
    <div>
        
        <Sheet>
  <SheetTrigger asChild>
  {children}
  </SheetTrigger>
  <SheetContent className="overflow-auto">
    <SheetHeader>
      <SheetTitle>Book an Service</SheetTitle>
      <SheetDescription>
        Select Date and Time slot to book an service
        {/* Date Picker  */}

        <div className='flex flex-col gap-5 items-baseline'>
        <h2 className='mt-5 font-bold'>Select Date</h2>

            <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
                disabled={disableDay}
            />

        </div>
        {/* Time Slot Picker  */}
        <h2 className='my-5 font-bold'>Select Time Slot</h2>
        {availableSlots.length === 0 ? (
          <p className="text-red-500">No available slots on this day</p>
        ) : (
          <div className='grid grid-cols-3 gap-3'>
            {availableSlots.map((item, index) => (
              <Button key={index}
                variant='outline'
                className={`border rounded-full p-2 px-3 hover:bg-primary hover:text-white ${selectedTime === item.time ? 'bg-primary text-white' : ''}`}
                onClick={() => setSelectedTime(item.time)}
              >{item.time}</Button>
            ))}
          </div>
        )}
        
      </SheetDescription>
    </SheetHeader>
    <SheetFooter className="mt-5">
              <SheetClose asChild>
                <div className='flex gap-5'>
                <Button variant="destructive" 
                className="">Cancel</Button>

                <Button 
                disabled={!(selectedTime&&date)}
                onClick={()=>saveBooking()}
                >
                    Book</Button>
                </div>
             
              </SheetClose>
            </SheetFooter>
  </SheetContent>
</Sheet>

    </div>
  )
}

export default BookingSection