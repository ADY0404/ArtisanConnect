import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { Booking } from '@/models/Booking'
import { PaymentTransaction } from '@/models/PaymentTransaction'
import { CommissionService } from '@/app/_services/CommissionService'
import { connectDB } from '@/lib/mongodb'

export async function POST(request) {
  try {
    console.log('🧾 Invoice generation request received')

    // Check authentication
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      console.log('❌ No session or user found')
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is a provider
    if (session.user.role !== 'PROVIDER') {
      console.log('❌ User is not a provider:', session.user.role)
      return NextResponse.json(
        { success: false, error: 'Provider access required' },
        { status: 403 }
      )
    }

    // Ensure database connection
    await connectDB()

    const body = await request.json()
    console.log('📝 Request body:', body)

    const { bookingId, servicePrice, paymentMethod, additionalNotes } = body

    // Validate input
    console.log('🔍 Validating input:', { bookingId, servicePrice, paymentMethod })

    if (!bookingId || !servicePrice || servicePrice <= 0) {
      console.log('❌ Invalid booking ID or service price:', { bookingId, servicePrice })
      return NextResponse.json(
        { success: false, error: 'Invalid booking ID or service price' },
        { status: 400 }
      )
    }

    if (!['CASH', 'PAYSTACK'].includes(paymentMethod)) {
      console.log('❌ Invalid payment method:', paymentMethod)
      return NextResponse.json(
        { success: false, error: 'Invalid payment method' },
        { status: 400 }
      )
    }

    // Get the booking and verify ownership
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

    // Check if invoice already generated
    if (booking.invoiceGenerated) {
      return NextResponse.json(
        { success: false, error: 'Invoice already generated for this booking' },
        { status: 400 }
      )
    }

    // Determine provider tier and service type
    const providerTier = await CommissionService.determineProviderTier(session.user.email)
    const serviceType = CommissionService.determineServiceType({
      serviceDetails: booking.serviceDetails,
      isEmergency: false, // Could be determined from booking
      isRecurring: false, // Could be determined from booking
      scheduledDate: booking.date
    })

    // Calculate commission
    const commissionCalculation = await CommissionService.calculateCommission(
      servicePrice,
      providerTier,
      serviceType,
      paymentMethod
    )

    // Validate the calculation
    CommissionService.validateCommission(commissionCalculation)

    // Generate invoice using the Booking model
    const invoiceResult = await Booking.generateInvoice(
      bookingId,
      servicePrice,
      paymentMethod
    )

    if (!invoiceResult.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate invoice' },
        { status: 500 }
      )
    }

    // Create payment transaction record
    const transactionData = {
      bookingId: bookingId,
      invoiceId: invoiceResult.invoiceId,
      providerEmail: session.user.email,
      customerEmail: booking.userEmail,
      businessId: booking.businessId,
      totalAmount: servicePrice,
      platformCommission: commissionCalculation.platformCommission,
      providerPayout: commissionCalculation.providerPayout,
      commissionOwed: commissionCalculation.commissionOwed,
      paymentMethod: paymentMethod,
      paymentStatus: paymentMethod === 'PAYSTACK' ? 'PENDING' : 'COMPLETED',
      commissionStatus: paymentMethod === 'CASH' ? 'PENDING' : 'COLLECTED',
      notes: additionalNotes || '',
      metadata: {
        providerTier: providerTier,
        serviceType: serviceType,
        commissionRate: commissionCalculation.commissionRate
      }
    }

    const transactionResult = await PaymentTransaction.create(transactionData)

    if (!transactionResult.success) {
      console.error('Failed to create payment transaction:', transactionResult)
      // Continue anyway, as the invoice was generated successfully
    }

    // Prepare response data
    const invoiceData = {
      invoiceId: invoiceResult.invoiceId,
      bookingId: bookingId,
      customerName: booking.userName,
      customerEmail: booking.userEmail,
      serviceDate: booking.date,
      serviceDescription: booking.serviceDetails,
      totalAmount: servicePrice,
      paymentMethod: paymentMethod,
      platformCommission: commissionCalculation.platformCommission,
      providerPayout: commissionCalculation.providerPayout,
      commissionOwed: commissionCalculation.commissionOwed,
      commissionRate: commissionCalculation.commissionRate,
      providerTier: providerTier,
      serviceType: serviceType,
      additionalNotes: additionalNotes,
      generatedAt: new Date(),
      transactionId: transactionResult.transactionId
    }

    console.log(`✅ Invoice generated successfully: ${invoiceResult.invoiceId}`)

    // Send invoice email to customer
    try {
      const { InvoiceEmailService } = await import('@/app/_services/InvoiceEmailService')

      const customerData = {
        name: booking.userName,
        email: booking.userEmail
      }

      const invoiceEmailData = {
        id: invoiceResult.invoiceId,
        invoiceNumber: invoiceData.invoiceNumber,
        businessName: booking.businessName,
        providerName: booking.contactPerson || 'Service Provider',
        serviceDescription: booking.note || 'Home service',
        serviceDate: booking.date,
        totalAmount: servicePrice,
        commissionAmount: commissionCalculation.platformCommission,
        netAmount: commissionCalculation.providerPayout,
        paymentMethod,
        generatedAt: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      }

      const emailResult = await InvoiceEmailService.sendInvoiceEmail(customerData, invoiceEmailData)

      if (emailResult.success) {
        console.log(`📧 Invoice email sent successfully to ${booking.userEmail}`)
        invoiceData.emailSent = true
        invoiceData.emailSentAt = emailResult.sentAt
      } else {
        console.warn(`⚠️ Failed to send invoice email: ${emailResult.error}`)
        invoiceData.emailSent = false
        invoiceData.emailError = emailResult.error
      }
    } catch (emailError) {
      console.error('❌ Error sending invoice email:', emailError)
      invoiceData.emailSent = false
      invoiceData.emailError = emailError.message
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice generated successfully',
      invoice: invoiceData,
      commissionBreakdown: commissionCalculation
    })

  } catch (error) {
    console.error('❌ Error generating invoice:', error)
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

    // Check if invoice exists
    if (!booking.invoiceGenerated) {
      return NextResponse.json(
        { success: false, error: 'No invoice found for this booking' },
        { status: 404 }
      )
    }

    // Get payment transaction details
    const transaction = await PaymentTransaction.getByBookingId(bookingId)

    const invoiceData = {
      invoiceId: booking.invoiceId,
      bookingId: bookingId,
      customerName: booking.userName,
      customerEmail: booking.userEmail,
      serviceDate: booking.date,
      serviceDescription: booking.serviceDetails,
      totalAmount: booking.totalAmount,
      paymentMethod: booking.paymentMethod,
      platformCommission: booking.platformCommission,
      providerPayout: booking.providerPayout,
      commissionOwed: booking.commissionOwed,
      generatedAt: booking.serviceCompletionDate,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      transaction: transaction
    }

    return NextResponse.json({
      success: true,
      invoice: invoiceData
    })

  } catch (error) {
    console.error('❌ Error fetching invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
