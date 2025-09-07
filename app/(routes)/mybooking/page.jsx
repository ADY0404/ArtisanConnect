"use client"
import React, { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BookingHistoryList from './_component/BookingHistoryList'
import ApiService from '@/app/_services/ApiService'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import moment from 'moment'
import { toast } from 'sonner'

function MyBooking() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [bookingHistory, setBookingHistory] = useState([]);
    const [debugInfo, setDebugInfo] = useState(null);
    const [showDebug, setShowDebug] = useState(false);

    useEffect(() => {
        if (status === 'loading') return; // Do nothing while loading
        if (status === 'unauthenticated') {
            router.replace('/auth/signin');
            return;
        }

        if (session?.user?.role?.toUpperCase() === 'PROVIDER') {
            router.replace('/provider/dashboard');
            return;
        }

        if (session) {
            GetUserBookingHistory();
        }
    }, [session, status, router]);

    /**
     * Used to Get User Booking History
     */
    const GetUserBookingHistory = () => {
        if (session?.user?.email) {
            console.log('📋 Frontend: Fetching bookings for user:', session.user.email)
            ApiService.getUserBookings(session.user.email).then(resp => {
                console.log('📋 Frontend: Received response:', resp);
                if (resp && resp.bookings) {
                    console.log('📋 Frontend: Setting booking history with', resp.bookings.length, 'bookings');
                    setBookingHistory(resp.bookings);
                } else {
                    console.log('❌ Frontend: No bookings in response');
                    setBookingHistory([]);
                }
            }).catch(error => {
                console.error('❌ Frontend: Error fetching bookings:', error);
                setBookingHistory([]);
            });
        } else {
            console.log('❌ Frontend: No user email available');
        }
    };

    const debugBookings = async () => {
        try {
            const response = await fetch(`/api/debug-bookings?userEmail=${session?.user?.email}`)
            const data = await response.json()
            setDebugInfo(data.debug)
            setShowDebug(true)
            console.log('🔍 Debug info:', data.debug)
        } catch (error) {
            console.error('❌ Debug error:', error)
        }
    }

    const createTestBooking = async () => {
        try {
            const response = await fetch('/api/debug-bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create_test_booking',
                    userEmail: session?.user?.email
                })
            })
            const data = await response.json()
            if (data.success) {
                toast('Test booking created!')
                GetUserBookingHistory() // Refresh the list
            } else {
                toast('Error creating test booking')
            }
        } catch (error) {
            console.error('❌ Test booking error:', error)
            toast('Error creating test booking')
        }
    }

    const fixExistingBookings = async () => {
        try {
            const response = await fetch('/api/debug-bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'fix_existing_bookings'
                })
            })
            const data = await response.json()
            if (data.success) {
                toast(`Fixed ${data.fixedCount} bookings!`)
                GetUserBookingHistory() // Refresh the list
            } else {
                toast('Error fixing bookings')
            }
        } catch (error) {
            console.error('❌ Fix bookings error:', error)
            toast('Error fixing bookings')
        }
    }

    const seedSampleData = async () => {
        try {
            const response = await fetch('/api/debug-bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'seed_sample_data'
                })
            })
            const data = await response.json()
            if (data.success) {
                toast(`Created ${data.businessesCreated} businesses and ${data.categoriesCreated} categories!`)
            } else {
                toast('Error creating sample data')
            }
        } catch (error) {
            console.error('❌ Seed data error:', error)
            toast('Error creating sample data')
        }
    }

    const filterData = (type) => {
        const result = bookingHistory.filter(item =>
            type == 'booked' ?
            new Date(item.date) >= new Date()
            : new Date(item.date) <= new Date());

        return result;
    }

    if (status === 'loading' || (session?.user?.role?.toUpperCase() === 'PROVIDER')) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
            </div>
        );
    }

    return (
        <div className='my-10 mx-5 md:mx-36'>
            <h2 className='font-bold text-[20px] my-2'>My Bookings</h2>
            
            {/* Debug Section - only show if no bookings */}
            {bookingHistory.length === 0 && (
                <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6'>
                    <h3 className='font-semibold text-yellow-800 mb-2'>🔍 No Bookings Found - Debug Options</h3>
                    <p className='text-yellow-700 text-sm mb-3'>
                        If you've made a booking but it's not showing here, you can use these debug tools:
                    </p>
                    <div className='flex gap-2 flex-wrap'>
                        <button 
                            onClick={debugBookings}
                            className='bg-yellow-200 hover:bg-yellow-300 text-yellow-800 px-3 py-1 rounded text-sm'
                        >
                            Check Database
                        </button>
                        <button 
                            onClick={createTestBooking}
                            className='bg-blue-200 hover:bg-blue-300 text-blue-800 px-3 py-1 rounded text-sm'
                        >
                            Create Test Booking
                        </button>
                        <button 
                            onClick={fixExistingBookings}
                            className='bg-green-200 hover:bg-green-300 text-green-800 px-3 py-1 rounded text-sm'
                        >
                            Fix Existing Bookings
                        </button>
                        <button 
                            onClick={seedSampleData}
                            className='bg-purple-200 hover:bg-purple-300 text-purple-800 px-3 py-1 rounded text-sm'
                        >
                            Seed Sample Data
                        </button>
                        <button 
                            onClick={() => GetUserBookingHistory()}
                            className='bg-green-200 hover:bg-green-300 text-green-800 px-3 py-1 rounded text-sm'
                        >
                            Refresh
                        </button>
                    </div>
                    
                    {showDebug && debugInfo && (
                        <div className='mt-4 p-3 bg-gray-100 rounded text-xs'>
                            <h4 className='font-semibold mb-2'>Debug Information:</h4>
                            <pre className='whitespace-pre-wrap text-gray-700'>
                                {JSON.stringify(debugInfo, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}
            
            <Tabs defaultValue="booked" className="w-full">
                <TabsList className="w-full justify-start">
                    <TabsTrigger value="booked">Booked</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
                <TabsContent value="booked">
                    <BookingHistoryList 
                        bookingHistory={filterData('booked')}
                        type='booked'
                    />
                </TabsContent>
                <TabsContent value="completed">
                    <BookingHistoryList 
                        bookingHistory={filterData('completed')}
                        type='completed'
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default MyBooking