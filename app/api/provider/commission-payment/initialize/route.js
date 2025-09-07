import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import PaystackService from '@/app/_services/PaystackService'
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
    const { amount, transactionIds } = body

    // Validate and format amount
    const numericAmount = parseFloat(amount)
    if (!numericAmount || numericAmount <= 0 || isNaN(numericAmount)) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount. Amount must be a positive number.' },
        { status: 400 }
      )
    }

    // Round amount to 2 decimal places to avoid floating point issues
    const formattedAmount = Math.round(numericAmount * 100) / 100

    console.log(`💰 Processing commission payment: Original=${amount}, Formatted=${formattedAmount}`)

    if (!transactionIds || !Array.isArray(transactionIds)) {
      return NextResponse.json(
        { success: false, error: 'Transaction IDs required' },
        { status: 400 }
      )
    }

    // Ensure database connection
    await connectDB()

    // Verify the amount matches the actual commission owed
    let totalCommissionOwed = 0
    try {
      const transactions = await PaymentTransaction.getByIds(transactionIds)

      console.log(`🔍 Verifying commission for ${transactions.length} transactions:`)
      transactions.forEach((transaction, index) => {
        console.log(`  Transaction ${index + 1}: ID=${transaction._id}, Status=${transaction.commissionStatus}, Owed=${transaction.commissionOwed}`)
      })

      totalCommissionOwed = transactions.reduce((total, transaction) => {
        if (transaction.commissionStatus === 'PENDING') {
          return total + (transaction.commissionOwed || 0)
        }
        return total
      }, 0)

      // Round to 2 decimal places to avoid floating point issues
      totalCommissionOwed = Math.round(totalCommissionOwed * 100) / 100
      const providedAmount = formattedAmount

      console.log(`💰 Commission verification: Expected=${totalCommissionOwed}, Provided=${providedAmount}`)

      if (Math.abs(totalCommissionOwed - providedAmount) > 0.01) {
        console.log(`❌ Amount mismatch: Expected ${totalCommissionOwed}, got ${providedAmount}`)
        return NextResponse.json(
          {
            success: false,
            error: `Amount mismatch. Expected GHS ${totalCommissionOwed.toFixed(2)}, but received GHS ${providedAmount.toFixed(2)}`
          },
          { status: 400 }
        )
      }

      console.log(`✅ Commission amount verified: GHS ${totalCommissionOwed.toFixed(2)} for ${transactionIds.length} transactions`)
    } catch (verificationError) {
      console.error('❌ Error verifying commission amount:', verificationError)
      return NextResponse.json(
        { success: false, error: 'Failed to verify commission amount' },
        { status: 500 }
      )
    }

    // Generate payment reference
    const reference = PaystackService.generateReference('COMM')
    
    // Prepare payment data
    const paymentData = {
      email: session.user.email,
      amount: formattedAmount, // Use formatted amount to ensure proper integer conversion
      reference: reference,
      metadata: {
        type: 'commission_payment',
        provider_email: session.user.email,
        transaction_ids: transactionIds,
        transaction_count: transactionIds.length
      }
    }

    // Initialize Paystack payment
    const paymentResult = await PaystackService.initializePayment(paymentData)

    if (!paymentResult.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to initialize payment' },
        { status: 500 }
      )
    }

    // Create a commission payment record
    const commissionPayment = {
      providerEmail: session.user.email,
      amount: formattedAmount, // Use formatted amount for consistency
      transactionIds: transactionIds,
      paystackReference: reference,
      status: 'PENDING',
      paymentMethod: 'PAYSTACK',
      createdAt: new Date()
    }

    // Store commission payment record (you might want to create a separate collection for this)
    // For now, we'll log it
    console.log(`💳 Commission payment initialized:`, commissionPayment)

    return NextResponse.json({
      success: true,
      authorization_url: paymentResult.authorization_url,
      access_code: paymentResult.access_code,
      reference: paymentResult.reference,
      amount: amount
    })

  } catch (error) {
    console.error('❌ Error initializing commission payment:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
