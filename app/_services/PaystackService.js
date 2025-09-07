/**
 * Paystack Service for handling payment operations
 * Integrates with Paystack API for payments, transfers, and verification
 * Automatically switches to mock mode for development/testing
 */

import MockPaystackService from './MockPaystackService.js'

export class PaystackService {

  static baseURL = 'https://api.paystack.co'

  /**
   * Check if we should use mock mode
   */
  static shouldUseMockMode() {
    // Explicitly check for mock mode first
    if (process.env.PAYSTACK_MOCK_MODE === 'true') {
      return true
    }

    // If mock mode is explicitly disabled, check for valid keys
    if (process.env.PAYSTACK_MOCK_MODE === 'false') {
      return !process.env.PAYSTACK_SECRET_KEY ||
             process.env.PAYSTACK_SECRET_KEY.includes('your_key_here') ||
             process.env.PAYSTACK_SECRET_KEY.length < 10
    }

    // Default behavior for undefined PAYSTACK_MOCK_MODE
    return !process.env.PAYSTACK_SECRET_KEY ||
           process.env.PAYSTACK_SECRET_KEY.includes('your_key_here') ||
           process.env.NODE_ENV === 'development'
  }

  /**
   * Initialize a payment transaction
   */
  static async initializePayment(paymentData) {
    // Debug environment variables
    console.log('🔍 Paystack Environment Check:', {
      PAYSTACK_MOCK_MODE: process.env.PAYSTACK_MOCK_MODE,
      HAS_SECRET_KEY: !!process.env.PAYSTACK_SECRET_KEY,
      SECRET_KEY_LENGTH: process.env.PAYSTACK_SECRET_KEY?.length,
      SECRET_KEY_PREFIX: process.env.PAYSTACK_SECRET_KEY?.substring(0, 10),
      NODE_ENV: process.env.NODE_ENV,
      SHOULD_USE_MOCK: this.shouldUseMockMode()
    })

    // Use mock service if in mock mode
    if (this.shouldUseMockMode()) {
      console.log('🧪 Using Mock Paystack Service for payment initialization')
      return MockPaystackService.initializePayment(paymentData)
    }

    try {
      const { email, amount, reference, metadata } = paymentData

      // Validate amount
      const numericAmount = parseFloat(amount)
      if (!numericAmount || numericAmount <= 0 || isNaN(numericAmount)) {
        throw new Error(`Invalid amount: ${amount}. Amount must be a positive number.`)
      }

      console.log(`💰 Initializing Paystack payment: Amount=${numericAmount}, Reference=${reference}`)

      const response = await fetch(`${this.baseURL}/transaction/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          amount: Math.round(numericAmount * 100), // Convert to kobo and ensure integer
          reference,
          metadata,
          callback_url: `${process.env.NEXTAUTH_URL}/payment/callback`,
          channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money']
        })
      })
      
      const result = await response.json()
      
      if (!result.status) {
        throw new Error(result.message || 'Payment initialization failed')
      }
      
      console.log(`✅ Payment initialized: ${reference}`)
      return {
        success: true,
        authorization_url: result.data.authorization_url,
        access_code: result.data.access_code,
        reference: result.data.reference
      }
      
    } catch (error) {
      console.error('❌ Payment initialization error:', error)
      throw error
    }
  }
  
  /**
   * Verify a payment transaction
   */
  static async verifyPayment(reference) {
    // Use mock service if in mock mode
    if (this.shouldUseMockMode()) {
      console.log('🧪 Using Mock Paystack Service for payment verification')
      return MockPaystackService.verifyPayment(reference)
    }

    try {
      const response = await fetch(`${this.baseURL}/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (!result.status) {
        throw new Error(result.message || 'Payment verification failed')
      }
      
      console.log(`✅ Payment verified: ${reference}`)
      return {
        success: true,
        data: result.data
      }
      
    } catch (error) {
      console.error('❌ Payment verification error:', error)
      throw error
    }
  }
  
  /**
   * Create a transfer recipient
   */
  static async createTransferRecipient(recipientData) {
    // Use mock service if in mock mode
    if (this.shouldUseMockMode()) {
      console.log('🧪 Using Mock Paystack Service for transfer recipient creation')
      return MockPaystackService.createTransferRecipient(recipientData)
    }

    try {
      const { name, account_number, bank_code, currency = 'GHS' } = recipientData
      
      const response = await fetch(`${this.baseURL}/transferrecipient`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'nuban',
          name,
          account_number,
          bank_code,
          currency
        })
      })
      
      const result = await response.json()
      
      if (!result.status) {
        throw new Error(result.message || 'Recipient creation failed')
      }
      
      console.log(`✅ Transfer recipient created: ${result.data.recipient_code}`)
      return {
        success: true,
        recipient_code: result.data.recipient_code,
        data: result.data
      }
      
    } catch (error) {
      console.error('❌ Transfer recipient creation error:', error)
      throw error
    }
  }
  
  /**
   * Initiate a transfer (payout)
   */
  static async initiateTransfer(transferData) {
    // Use mock service if in mock mode
    if (this.shouldUseMockMode()) {
      console.log('🧪 Using Mock Paystack Service for transfer initiation')
      return MockPaystackService.initiateTransfer(transferData)
    }

    try {
      const { amount, recipient, reason, reference } = transferData

      // Validate amount
      const numericAmount = parseFloat(amount)
      if (!numericAmount || numericAmount <= 0 || isNaN(numericAmount)) {
        throw new Error(`Invalid transfer amount: ${amount}. Amount must be a positive number.`)
      }

      console.log(`💸 Initiating Paystack transfer: Amount=${numericAmount}, Reference=${reference}`)

      const response = await fetch(`${this.baseURL}/transfer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source: 'balance',
          amount: Math.round(numericAmount * 100), // Convert to kobo and ensure integer
          recipient,
          reason,
          reference
        })
      })
      
      const result = await response.json()
      
      if (!result.status) {
        throw new Error(result.message || 'Transfer initiation failed')
      }
      
      console.log(`✅ Transfer initiated: ${reference}`)
      return {
        success: true,
        transfer_code: result.data.transfer_code,
        data: result.data
      }
      
    } catch (error) {
      console.error('❌ Transfer initiation error:', error)
      throw error
    }
  }
  
  /**
   * Get list of banks
   */
  static async getBanks(country = 'ghana') {
    // Use mock service if in mock mode
    if (this.shouldUseMockMode()) {
      console.log('🧪 Using Mock Paystack Service for banks list')
      return MockPaystackService.getBanks(country)
    }

    try {
      const response = await fetch(`${this.baseURL}/bank?country=${country}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (!result.status) {
        throw new Error(result.message || 'Failed to fetch banks')
      }
      
      return {
        success: true,
        banks: result.data
      }
      
    } catch (error) {
      console.error('❌ Error fetching banks:', error)
      throw error
    }
  }
  
  /**
   * Resolve account number
   */
  static async resolveAccountNumber(account_number, bank_code) {
    // Use mock service if in mock mode
    if (this.shouldUseMockMode()) {
      console.log('🧪 Using Mock Paystack Service for account resolution')
      return MockPaystackService.resolveAccountNumber(account_number, bank_code)
    }

    try {
      const response = await fetch(
        `${this.baseURL}/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      const result = await response.json()
      
      if (!result.status) {
        throw new Error(result.message || 'Account resolution failed')
      }
      
      return {
        success: true,
        account_name: result.data.account_name,
        account_number: result.data.account_number
      }
      
    } catch (error) {
      console.error('❌ Account resolution error:', error)
      throw error
    }
  }
  
  /**
   * Generate payment reference
   */
  static generateReference(prefix = 'PAY') {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `${prefix}_${timestamp}_${random}`
  }
  
  /**
   * Generate transfer reference
   */
  static generateTransferReference(prefix = 'TRF') {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `${prefix}_${timestamp}_${random}`
  }
  
  /**
   * Calculate Paystack fees
   */
  static calculateFees(amount) {
    // Paystack fee structure for Ghana
    let fee = 0
    
    if (amount <= 100) {
      fee = 0 // No fee for amounts <= GHS 1
    } else {
      fee = Math.max(1.95, amount * 0.019) // 1.95% with minimum of GHS 1.95
    }
    
    return Math.round(fee * 100) / 100 // Round to 2 decimal places
  }
  
  /**
   * Validate webhook signature
   */
  static validateWebhookSignature(payload, signature) {
    const crypto = require('crypto')
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex')

    return hash === signature
  }
}

export default PaystackService
