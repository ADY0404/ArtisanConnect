import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { PaymentTransaction } from '@/models/PaymentTransaction'
import { Booking } from '@/models/Booking'
import { connectDB } from '@/lib/mongodb'

export async function POST(request) {
  try {
    // Get the raw body for signature verification
    const body = await request.text()
    const signature = request.headers.get('x-paystack-signature')
    
    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET)
      .update(body)
      .digest('hex')
    
    if (hash !== signature) {
      console.log('❌ Invalid Paystack webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }
    
    const event = JSON.parse(body)
    console.log('📡 Paystack webhook received:', event.event)
    
    // Ensure database connection
    await connectDB()
    
    switch (event.event) {
      case 'charge.success':
        return await handleChargeSuccess(event)
      case 'charge.failed':
        return await handleChargeFailed(event)
      case 'transfer.success':
        return await handleTransferSuccess(event)
      case 'transfer.failed':
        return await handleTransferFailed(event)
      default:
        console.log(`⚠️ Unhandled webhook event: ${event.event}`)
        return NextResponse.json({ message: 'Event received' })
    }
    
  } catch (error) {
    console.error('❌ Paystack webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

/**
 * Handle successful charge (customer payment or commission payment)
 */
async function handleChargeSuccess(event) {
  try {
    const { data } = event
    const { reference, amount, customer, metadata } = data

    console.log(`✅ Processing successful charge: ${reference}`)

    // Check if this is a commission payment
    if (metadata && metadata.type === 'commission_payment') {
      return await handleCommissionPaymentSuccess(data)
    }

    // Handle regular booking payment
    const booking = await Booking.findOne({ paystackReference: reference })
    if (!booking) {
      console.log(`⚠️ No booking found for reference: ${reference}`)
      return NextResponse.json({ message: 'Booking not found' })
    }

    // Update booking payment status
    await Booking.updateById(booking._id, {
      paymentStatus: 'PAID',
      paystackTransactionId: data.id,
      paystackChargeId: data.id,
      updatedAt: new Date()
    })

    // Update payment transaction
    const transaction = await PaymentTransaction.getByBookingId(booking._id)
    if (transaction) {
      await PaymentTransaction.updateById(transaction._id, {
        paymentStatus: 'COMPLETED',
        paystackTransactionId: data.id,
        paystackChargeId: data.id,
        paystackFees: data.fees / 100, // Convert from kobo to cedis
        commissionStatus: 'COLLECTED', // Commission automatically collected
        updatedAt: new Date()
      })
    }

    console.log(`✅ Charge success processed for booking: ${booking._id}`)
    return NextResponse.json({ message: 'Charge success processed' })

  } catch (error) {
    console.error('❌ Error processing charge success:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}

/**
 * Handle successful commission payment
 */
async function handleCommissionPaymentSuccess(data) {
  try {
    const { reference, amount, metadata } = data

    console.log(`💳 Processing successful commission payment: ${reference}`)

    // Extract transaction IDs from metadata
    const transactionIds = metadata.transaction_ids || []
    const providerEmail = metadata.provider_email

    if (transactionIds.length === 0) {
      console.log(`⚠️ No transaction IDs found in commission payment metadata`)
      return NextResponse.json({ message: 'No transactions to update' })
    }

    // Update commission status for all related transactions
    const updatePromises = transactionIds.map(transactionId =>
      PaymentTransaction.updateCommissionStatus(transactionId, 'COLLECTED', {
        paymentMethod: 'PAYSTACK',
        paymentReference: reference,
        paymentDate: new Date(),
        amount: amount / 100, // Convert from kobo to cedis
        paystackTransactionId: data.id
      })
    )

    await Promise.all(updatePromises)

    console.log(`✅ Commission payment processed: ${transactionIds.length} transactions updated to COLLECTED`)
    console.log(`💰 Amount paid: GHS ${(amount / 100).toFixed(2)} by ${providerEmail}`)

    return NextResponse.json({
      message: 'Commission payment processed successfully',
      transactionsUpdated: transactionIds.length,
      amount: amount / 100
    })

  } catch (error) {
    console.error('❌ Error processing commission payment:', error)
    return NextResponse.json({ error: 'Commission payment processing failed' }, { status: 500 })
  }
}

/**
 * Handle failed charge
 */
async function handleChargeFailed(event) {
  try {
    const { data } = event
    const { reference } = data
    
    console.log(`❌ Processing failed charge: ${reference}`)
    
    // Find the booking by reference
    const booking = await Booking.findOne({ paystackReference: reference })
    if (!booking) {
      console.log(`⚠️ No booking found for reference: ${reference}`)
      return NextResponse.json({ message: 'Booking not found' })
    }
    
    // Update booking payment status
    await Booking.updateById(booking._id, {
      paymentStatus: 'FAILED',
      updatedAt: new Date()
    })
    
    // Update payment transaction
    const transaction = await PaymentTransaction.getByBookingId(booking._id)
    if (transaction) {
      await PaymentTransaction.updateById(transaction._id, {
        paymentStatus: 'FAILED',
        updatedAt: new Date()
      })
    }
    
    console.log(`❌ Charge failure processed for booking: ${booking._id}`)
    return NextResponse.json({ message: 'Charge failure processed' })
    
  } catch (error) {
    console.error('❌ Error processing charge failure:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}

/**
 * Handle successful transfer (payout to provider)
 */
async function handleTransferSuccess(event) {
  try {
    const { data } = event
    const { reference, recipient } = data
    
    console.log(`✅ Processing successful transfer: ${reference}`)
    
    // Find transaction by payout reference
    const transaction = await PaymentTransaction.findOne({ payoutReference: reference })
    if (!transaction) {
      console.log(`⚠️ No transaction found for transfer reference: ${reference}`)
      return NextResponse.json({ message: 'Transaction not found' })
    }
    
    // Update transaction payout status
    await PaymentTransaction.updateById(transaction._id, {
      payoutStatus: 'COMPLETED',
      payoutDate: new Date(),
      updatedAt: new Date()
    })
    
    console.log(`✅ Transfer success processed for transaction: ${transaction._id}`)
    return NextResponse.json({ message: 'Transfer success processed' })
    
  } catch (error) {
    console.error('❌ Error processing transfer success:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}

/**
 * Handle failed transfer
 */
async function handleTransferFailed(event) {
  try {
    const { data } = event
    const { reference } = data
    
    console.log(`❌ Processing failed transfer: ${reference}`)
    
    // Find transaction by payout reference
    const transaction = await PaymentTransaction.findOne({ payoutReference: reference })
    if (!transaction) {
      console.log(`⚠️ No transaction found for transfer reference: ${reference}`)
      return NextResponse.json({ message: 'Transaction not found' })
    }
    
    // Update transaction payout status
    await PaymentTransaction.updateById(transaction._id, {
      payoutStatus: 'FAILED',
      updatedAt: new Date()
    })
    
    console.log(`❌ Transfer failure processed for transaction: ${transaction._id}`)
    return NextResponse.json({ message: 'Transfer failure processed' })
    
  } catch (error) {
    console.error('❌ Error processing transfer failure:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
