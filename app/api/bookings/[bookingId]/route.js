import { NextResponse } from 'next/server'
import { Booking } from '@/models/Booking'

export async function DELETE(request, { params }) {
  try {
    const { bookingId } = params
    
    if (!bookingId) {
      return NextResponse.json({
        success: false,
        error: 'Booking ID required'
      }, { status: 400 })
    }
    
    const result = await Booking.deleteById(bookingId)
    
    if (!result) {
      return NextResponse.json({
        success: false,
        error: 'Booking not found'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Booking deleted successfully'
    })
  } catch (error) {
    console.error('❌ Error deleting booking:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete booking'
    }, { status: 500 })
  }
} 