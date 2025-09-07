import { ObjectId } from 'mongodb'
import { Database } from '@/lib/database'

/**
 * PaymentTransaction model for tracking all payment-related transactions
 * Supports both Paystack and cash payments with commission tracking
 */
export class PaymentTransaction {
  constructor(transactionData) {
    this.bookingId = new ObjectId(transactionData.bookingId)
    this.invoiceId = transactionData.invoiceId
    this.providerEmail = transactionData.providerEmail
    this.customerEmail = transactionData.customerEmail
    this.businessId = new ObjectId(transactionData.businessId)
    
    // Payment details
    this.totalAmount = transactionData.totalAmount || 0
    this.platformCommission = transactionData.platformCommission || 0
    this.providerPayout = transactionData.providerPayout || 0
    this.commissionOwed = transactionData.commissionOwed || 0 // For cash payments
    
    // Payment method and status
    this.paymentMethod = transactionData.paymentMethod || 'CASH' // CASH, PAYSTACK
    this.paymentStatus = transactionData.paymentStatus || 'PENDING' // PENDING, COMPLETED, FAILED, REFUNDED
    this.commissionStatus = transactionData.commissionStatus || 'PENDING' // PENDING, COLLECTED, OVERDUE
    
    // Paystack specific fields
    this.paystackReference = transactionData.paystackReference || null
    this.paystackTransactionId = transactionData.paystackTransactionId || null
    this.paystackChargeId = transactionData.paystackChargeId || null
    this.paystackFees = transactionData.paystackFees || 0
    
    // Payout tracking
    this.payoutStatus = transactionData.payoutStatus || 'PENDING' // PENDING, PROCESSING, COMPLETED, FAILED
    this.payoutDate = transactionData.payoutDate || null
    this.payoutReference = transactionData.payoutReference || null
    this.payoutMethod = transactionData.payoutMethod || 'BANK_TRANSFER' // BANK_TRANSFER, MOBILE_MONEY
    
    // Commission tracking for cash payments
    this.commissionDueDate = transactionData.commissionDueDate || null
    this.commissionPaidDate = transactionData.commissionPaidDate || null
    this.commissionPaymentMethod = transactionData.commissionPaymentMethod || null
    
    // Metadata
    this.currency = transactionData.currency || 'GHS'
    this.exchangeRate = transactionData.exchangeRate || 1
    this.notes = transactionData.notes || ''
    this.metadata = transactionData.metadata || {}
    
    this.createdAt = transactionData.createdAt || new Date()
    this.updatedAt = new Date()
  }

  /**
   * Create a new payment transaction
   */
  static async create(transactionData) {
    try {
      const collection = await Database.getCollection('payment_transactions')
      
      const transaction = new PaymentTransaction(transactionData)
      const result = await collection.insertOne(transaction)
      
      console.log(`✅ Payment transaction created: ${transaction.invoiceId}`)
      return {
        success: true,
        transactionId: result.insertedId,
        transaction: { _id: result.insertedId, ...transaction }
      }
    } catch (error) {
      console.error('❌ Error creating payment transaction:', error)
      throw error
    }
  }

  /**
   * Get transactions by provider
   */
  static async getByProvider(providerEmail, options = {}) {
    try {
      const collection = await Database.getCollection('payment_transactions')
      
      const query = { providerEmail }
      
      // Add date range filter if provided
      if (options.startDate || options.endDate) {
        query.createdAt = {}
        if (options.startDate) query.createdAt.$gte = new Date(options.startDate)
        if (options.endDate) query.createdAt.$lte = new Date(options.endDate)
      }
      
      // Add status filter if provided
      if (options.paymentStatus) {
        query.paymentStatus = options.paymentStatus
      }
      
      const transactions = await collection
        .find(query)
        .sort({ createdAt: -1 })
        .limit(options.limit || 100)
        .toArray()
      
      return transactions
    } catch (error) {
      console.error('❌ Error fetching provider transactions:', error)
      throw error
    }
  }

  /**
   * Get outstanding commission owed by provider (cash payments)
   */
  static async getOutstandingCommission(providerEmail) {
    try {
      const collection = await Database.getCollection('payment_transactions')
      
      const pipeline = [
        {
          $match: {
            providerEmail: providerEmail,
            paymentMethod: 'CASH',
            commissionStatus: { $in: ['PENDING', 'OVERDUE'] }
          }
        },
        {
          $group: {
            _id: null,
            totalOwed: { $sum: '$commissionOwed' },
            transactionCount: { $sum: 1 },
            oldestTransaction: { $min: '$createdAt' }
          }
        }
      ]
      
      const result = await collection.aggregate(pipeline).toArray()
      
      if (result.length === 0) {
        return {
          totalOwed: 0,
          transactionCount: 0,
          oldestTransaction: null
        }
      }
      
      return result[0]
    } catch (error) {
      console.error('❌ Error calculating outstanding commission:', error)
      throw error
    }
  }

  /**
   * Update commission status
   */
  static async updateCommissionStatus(transactionId, status, paymentDetails = {}) {
    try {
      const collection = await Database.getCollection('payment_transactions')
      
      const validStatuses = ['PENDING', 'COLLECTED', 'OVERDUE']
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid commission status')
      }
      
      const updateData = {
        commissionStatus: status,
        updatedAt: new Date()
      }
      
      if (status === 'COLLECTED') {
        updateData.commissionPaidDate = new Date()
        if (paymentDetails.paymentMethod) {
          updateData.commissionPaymentMethod = paymentDetails.paymentMethod
        }
      }
      
      const result = await collection.updateOne(
        { _id: new ObjectId(transactionId) },
        { $set: updateData }
      )
      
      if (result.matchedCount === 0) {
        throw new Error('Transaction not found')
      }
      
      console.log(`✅ Commission status updated: ${transactionId} -> ${status}`)
      return { success: true, modifiedCount: result.modifiedCount }
    } catch (error) {
      console.error('❌ Error updating commission status:', error)
      throw error
    }
  }

  /**
   * Process Paystack webhook data
   */
  static async processPaystackWebhook(webhookData) {
    try {
      const collection = await Database.getCollection('payment_transactions')
      
      const { reference, status, amount, fees, transaction_id } = webhookData.data
      
      // Find transaction by Paystack reference
      const transaction = await collection.findOne({ paystackReference: reference })
      
      if (!transaction) {
        console.log(`⚠️ Transaction not found for Paystack reference: ${reference}`)
        return { success: false, message: 'Transaction not found' }
      }
      
      const updateData = {
        paymentStatus: status === 'success' ? 'COMPLETED' : 'FAILED',
        paystackTransactionId: transaction_id,
        paystackFees: fees / 100, // Convert from kobo to cedis
        updatedAt: new Date()
      }
      
      if (status === 'success') {
        updateData.payoutStatus = 'PENDING'
      }
      
      const result = await collection.updateOne(
        { _id: transaction._id },
        { $set: updateData }
      )
      
      console.log(`✅ Paystack webhook processed: ${reference} -> ${status}`)
      return { success: true, transactionId: transaction._id }
    } catch (error) {
      console.error('❌ Error processing Paystack webhook:', error)
      throw error
    }
  }

  /**
   * Get transaction by booking ID
   */
  static async getByBookingId(bookingId) {
    try {
      const collection = await Database.getCollection('payment_transactions')
      const transaction = await collection.findOne({ bookingId: new ObjectId(bookingId) })
      return transaction
    } catch (error) {
      console.error('❌ Error finding transaction by booking ID:', error)
      throw error
    }
  }

  /**
   * Get multiple transactions by IDs
   */
  static async getByIds(transactionIds) {
    try {
      const collection = await Database.getCollection('payment_transactions')
      const objectIds = transactionIds.map(id => new ObjectId(id))

      const transactions = await collection.find({
        _id: { $in: objectIds }
      }).toArray()

      return transactions.map(transaction => new PaymentTransaction(transaction))
    } catch (error) {
      console.error('❌ Error getting transactions by IDs:', error)
      throw error
    }
  }

  /**
   * Update transaction by ID
   */
  static async updateById(transactionId, updateData) {
    try {
      const collection = await Database.getCollection('payment_transactions')

      const result = await collection.updateOne(
        { _id: new ObjectId(transactionId) },
        { $set: { ...updateData, updatedAt: new Date() } }
      )

      if (result.matchedCount === 0) {
        throw new Error('Transaction not found')
      }

      console.log(`✅ Transaction updated: ${transactionId}`)
      return { success: true, modifiedCount: result.modifiedCount }
    } catch (error) {
      console.error('❌ Error updating transaction:', error)
      throw error
    }
  }

  /**
   * Get commission summary for admin dashboard
   */
  static async getCommissionSummary(dateRange = {}) {
    try {
      const collection = await Database.getCollection('payment_transactions')
      
      const matchStage = {}
      if (dateRange.startDate || dateRange.endDate) {
        matchStage.createdAt = {}
        if (dateRange.startDate) matchStage.createdAt.$gte = new Date(dateRange.startDate)
        if (dateRange.endDate) matchStage.createdAt.$lte = new Date(dateRange.endDate)
      }
      
      const pipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalCommissionEarned: { $sum: '$platformCommission' },
            totalCommissionOwed: { 
              $sum: { 
                $cond: [
                  { $and: [
                    { $eq: ['$paymentMethod', 'CASH'] },
                    { $in: ['$commissionStatus', ['PENDING', 'OVERDUE']] }
                  ]},
                  '$commissionOwed',
                  0
                ]
              }
            },
            paystackTransactions: {
              $sum: { $cond: [{ $eq: ['$paymentMethod', 'PAYSTACK'] }, 1, 0] }
            },
            cashTransactions: {
              $sum: { $cond: [{ $eq: ['$paymentMethod', 'CASH'] }, 1, 0] }
            },
            totalTransactions: { $sum: 1 },
            totalVolume: { $sum: '$totalAmount' }
          }
        }
      ]
      
      const result = await collection.aggregate(pipeline).toArray()
      
      if (result.length === 0) {
        return {
          totalCommissionEarned: 0,
          totalCommissionOwed: 0,
          paystackTransactions: 0,
          cashTransactions: 0,
          totalTransactions: 0,
          totalVolume: 0
        }
      }
      
      return result[0]
    } catch (error) {
      console.error('❌ Error getting commission summary:', error)
      throw error
    }
  }
}
