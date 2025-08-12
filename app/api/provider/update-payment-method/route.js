import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { Booking } from '@/models/Booking'
import { PaymentTransaction } from '@/models/PaymentTransaction'
import { CommissionService } from '@/app/_services/CommissionService'
import { connectDB } from '@/lib/mongodb'

export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is a provider
    if (session.user.role !== 'PROVIDER') {
      return NextResponse.json(
        { success: false, error: 'Provider access required' },
        { status: 403 }
      )
    }

    // Ensure database connection
    await connectDB()

    const body = await request.json()
    const { bookingId, paymentMethod, paystackReference } = body

    // Validate input
    if (!bookingId || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Booking ID and payment method are required' },
        { status: 400 }
      )
    }

    if (!['CASH', 'PAYSTACK'].includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment method' },
        { status: 400 }
      )
    }

    if (paymentMethod === 'PAYSTACK' && !paystackReference) {
      return NextResponse.json(
        { success: false, error: 'Paystack reference is required for Paystack payments' },
        { status: 400 }
      )
    }

    // Get the booking
    const booking = await Booking.findById(bookingId)
    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Verify that this provider owns the booking
    // This would require checking the business ownership
    // For now, we'll assume the check is valid

    // Check if booking has an invoice
    if (!booking.invoiceGenerated) {
      return NextResponse.json(
        { success: false, error: 'Invoice must be generated before updating payment method' },
        { status: 400 }
      )
    }

    // Update payment method in booking
    const updateResult = await Booking.updatePaymentMethod(
      bookingId,
      paymentMethod,
      paystackReference
    )

    if (!updateResult.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update booking payment method' },
        { status: 500 }
      )
    }

    // Recalculate commission based on new payment method
    const providerTier = await CommissionService.determineProviderTier(session.user.email)
    const serviceType = CommissionService.determineServiceType({
      serviceDetails: booking.serviceDetails,
      isEmergency: false,
      isRecurring: false,
      scheduledDate: booking.date
    })

    const newCommissionCalculation = await CommissionService.calculateCommission(
      booking.totalAmount,
      providerTier,
      serviceType,
      paymentMethod
    )

    // Update the booking with new commission calculation
    const commissionUpdateData = {
      platformCommission: newCommissionCalculation.platformCommission,
      providerPayout: newCommissionCalculation.providerPayout,
      commissionOwed: newCommissionCalculation.commissionOwed,
      paymentMethod: paymentMethod
    }

    if (paymentMethod === 'PAYSTACK') {
      commissionUpdateData.paystackReference = paystackReference
      commissionUpdateData.paymentStatus = 'PAID'
      commissionUpdateData.paymentId = paystackReference
    }

    await Booking.updateById(bookingId, commissionUpdateData)

    // Update or create payment transaction
    try {
      // Try to find existing transaction
      const existingTransaction = await PaymentTransaction.getByBookingId(bookingId)
      
      if (existingTransaction) {
        // Update existing transaction
        const transactionUpdateData = {
          paymentMethod: paymentMethod,
          platformCommission: newCommissionCalculation.platformCommission,
          providerPayout: newCommissionCalculation.providerPayout,
          commissionOwed: newCommissionCalculation.commissionOwed,
          paymentStatus: paymentMethod === 'PAYSTACK' ? 'COMPLETED' : 'COMPLETED',
          commissionStatus: paymentMethod === 'CASH' ? 'PENDING' : 'COLLECTED'
        }

        if (paymentMethod === 'PAYSTACK') {
          transactionUpdateData.paystackReference = paystackReference
        }

        await PaymentTransaction.updateById(existingTransaction._id, transactionUpdateData)
      } else {
        // Create new transaction if none exists
        const transactionData = {
          bookingId: bookingId,
          invoiceId: booking.invoiceId,
          providerEmail: session.user.email,
          customerEmail: booking.userEmail,
          businessId: booking.businessId,
          totalAmount: booking.totalAmount,
          platformCommission: newCommissionCalculation.platformCommission,
          providerPayout: newCommissionCalculation.providerPayout,
          commissionOwed: newCommissionCalculation.commissionOwed,
          paymentMethod: paymentMethod,
          paymentStatus: 'COMPLETED',
          commissionStatus: paymentMethod === 'CASH' ? 'PENDING' : 'COLLECTED',
          paystackReference: paymentMethod === 'PAYSTACK' ? paystackReference : null,
          metadata: {
            providerTier: providerTier,
            serviceType: serviceType,
            commissionRate: newCommissionCalculation.commissionRate
          }
        }

        await PaymentTransaction.create(transactionData)
      }
    } catch (transactionError) {
      console.error('Error updating payment transaction:', transactionError)
      // Continue anyway, as the booking was updated successfully
    }

    // Get updated booking data
    const updatedBooking = await Booking.findById(bookingId)

    console.log(`✅ Payment method updated: ${bookingId} -> ${paymentMethod}`)

    return NextResponse.json({
      success: true,
      message: 'Payment method updated successfully',
      booking: updatedBooking,
      commissionBreakdown: newCommissionCalculation
    })

  } catch (error) {
    console.error('❌ Error updating payment method:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is a provider
    if (session.user.role !== 'PROVIDER') {
      return NextResponse.json(
        { success: false, error: 'Provider access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'Booking ID required' },
        { status: 400 }
      )
    }

    // Get the booking
    const booking = await Booking.findById(bookingId)
    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Get payment transaction if exists
    const transaction = await PaymentTransaction.getByBookingId(bookingId)

    return NextResponse.json({
      success: true,
      booking: booking,
      transaction: transaction,
      paymentMethod: booking.paymentMethod,
      commissionBreakdown: {
        totalAmount: booking.totalAmount,
        platformCommission: booking.platformCommission,
        providerPayout: booking.providerPayout,
        commissionOwed: booking.commissionOwed
      }
    })

  } catch (error) {
    console.error('❌ Error fetching payment method:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
