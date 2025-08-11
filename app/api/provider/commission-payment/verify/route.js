import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import PaystackService from '@/app/_services/PaystackService'
import { PaymentTransaction } from '@/models/PaymentTransaction'
import { connectDB } from '@/lib/mongodb'

export async function POST(request) {
  try {
    console.log('🔍 Commission payment verification request received')
    
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
    const { reference } = body

    if (!reference) {
      return NextResponse.json(
        { success: false, error: 'Payment reference is required' },
        { status: 400 }
      )
    }

    console.log('📝 Verifying commission payment reference:', reference)

    // Verify payment with Paystack
    const verificationResult = await PaystackService.verifyPayment(reference)

    if (!verificationResult.success) {
      console.log('❌ Commission payment verification failed:', reference)
      return NextResponse.json(
        { success: false, error: 'Payment verification failed' },
        { status: 400 }
      )
    }

    const paymentData = verificationResult.data

    // Check if payment was successful
    if (paymentData.status !== 'success') {
      console.log('❌ Commission payment was not successful:', paymentData.status)
      return NextResponse.json(
        { success: false, error: 'Payment was not successful' },
        { status: 400 }
      )
    }

    // Extract transaction IDs from metadata
    const metadata = paymentData.metadata || {}
    const transactionIds = metadata.transaction_ids || []
    const providerEmail = metadata.provider_email

    // Verify this payment belongs to the current user
    if (providerEmail !== session.user.email) {
      console.log('❌ Commission payment does not belong to current user')
      return NextResponse.json(
        { success: false, error: 'Unauthorized payment verification' },
        { status: 403 }
      )
    }

    console.log(`✅ Commission payment verified for ${transactionIds.length} transactions`)

    // Update commission status for all related transactions
    if (transactionIds.length > 0) {
      try {
        const updatePromises = transactionIds.map(transactionId =>
          PaymentTransaction.updateCommissionStatus(transactionId, 'COLLECTED', {
            paymentMethod: 'PAYSTACK',
            paymentReference: reference,
            paymentDate: new Date(),
            amount: paymentData.amount / 100, // Convert from kobo to cedis
            paystackTransactionId: paymentData.id
          })
        )

        await Promise.all(updatePromises)

        console.log(`✅ Commission status updated to COLLECTED for ${transactionIds.length} transactions`)
      } catch (updateError) {
        console.error('❌ Error updating commission status:', updateError)
        return NextResponse.json(
          { success: false, error: 'Failed to update commission status' },
          { status: 500 }
        )
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Commission payment verified and processed successfully',
      data: {
        reference: reference,
        amount: paymentData.amount / 100, // Convert from kobo to cedis
        status: paymentData.status,
        paid_at: paymentData.paid_at,
        transactionsUpdated: transactionIds.length
      }
    })

  } catch (error) {
    console.error('❌ Commission payment verification error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Payment verification failed' },
      { status: 500 }
    )
  }
}
