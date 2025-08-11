import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PaymentTransaction } from '@/models/PaymentTransaction'
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
    const { amount, transactionIds, paymentMethod } = body

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      )
    }

    if (!transactionIds || !Array.isArray(transactionIds)) {
      return NextResponse.json(
        { success: false, error: 'Transaction IDs required' },
        { status: 400 }
      )
    }

    // Generate manual payment reference
    const reference = `MANUAL_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    try {
      // Update commission status to 'PENDING_VERIFICATION' for manual payments
      const updatePromises = transactionIds.map(transactionId =>
        PaymentTransaction.updateCommissionStatus(transactionId, 'PENDING_VERIFICATION', {
          paymentMethod: 'MANUAL',
          paymentReference: reference,
          paymentDate: new Date(),
          amount: amount
        })
      )

      await Promise.all(updatePromises)

      // Create a manual commission payment record
      const manualPayment = {
        providerEmail: session.user.email,
        amount: amount,
        transactionIds: transactionIds,
        reference: reference,
        status: 'PENDING_VERIFICATION',
        paymentMethod: 'MANUAL',
        submittedAt: new Date(),
        notes: 'Manual payment submitted by provider, awaiting admin verification'
      }

      // Log the manual payment (in a real app, you'd store this in a separate collection)
      console.log(`📝 Manual commission payment submitted:`, manualPayment)

      // TODO: Send notification to admin about pending manual payment verification
      // TODO: Send confirmation email to provider

      return NextResponse.json({
        success: true,
        message: 'Manual payment recorded successfully',
        reference: reference,
        status: 'PENDING_VERIFICATION',
        note: 'Your payment has been recorded and is awaiting admin verification. You will be notified once verified.'
      })

    } catch (updateError) {
      console.error('Error updating commission status:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to record manual payment' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Error processing manual commission payment:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
