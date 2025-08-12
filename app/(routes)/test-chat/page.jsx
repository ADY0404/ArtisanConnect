import React from 'react'
import ChatWindow from '@/app/_components/ChatWindow'

function TestChatPage() {
  const mockBooking = {
    id: "test-booking-1",
    businessName: "Test Service Provider",
    customerName: "Test Customer",
    serviceDate: "2024-01-20"
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Chat System Test</h1>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <ChatWindow 
            bookingId={mockBooking.id}
            businessName={mockBooking.businessName}
            customerName={mockBooking.customerName}
          />
        </div>
      </div>
    </div>
  )
}

export default TestChatPage 