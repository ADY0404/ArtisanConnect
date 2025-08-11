/**
 * Mock Paystack Service for Development and Testing
 * Simulates Paystack API responses without requiring real API keys
 */

export class MockPaystackService {
  
  static baseURL = 'https://api.paystack.co' // Keep for reference
  
  /**
   * Mock payment initialization
   */
  static async initializePayment(paymentData) {
    try {
      const { email, amount, reference, metadata } = paymentData
      
      console.log('🧪 MOCK: Initializing payment with data:', paymentData)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Generate mock response
      const mockResponse = {
        status: true,
        message: "Authorization URL created",
        data: {
          authorization_url: `${process.env.NEXTAUTH_URL}/mock-payment?reference=${reference}&amount=${amount}&email=${email}`,
          access_code: `mock_access_${Date.now()}`,
          reference: reference
        }
      }
      
      console.log('✅ MOCK: Payment initialized successfully:', reference)
      return {
        success: true,
        authorization_url: mockResponse.data.authorization_url,
        access_code: mockResponse.data.access_code,
        reference: mockResponse.data.reference
      }
      
    } catch (error) {
      console.error('❌ MOCK: Payment initialization error:', error)
      throw error
    }
  }
  
  /**
   * Mock payment verification
   */
  static async verifyPayment(reference) {
    try {
      console.log('🧪 MOCK: Verifying payment:', reference)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Generate mock verification response
      const mockResponse = {
        status: true,
        message: "Verification successful",
        data: {
          id: Math.floor(Math.random() * 1000000),
          domain: "test",
          status: "success",
          reference: reference,
          amount: 10000, // Mock amount in kobo
          message: null,
          gateway_response: "Successful",
          paid_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          channel: "card",
          currency: "GHS",
          ip_address: "127.0.0.1",
          metadata: {},
          log: {
            start_time: Math.floor(Date.now() / 1000),
            time_spent: 3,
            attempts: 1,
            errors: 0,
            success: true,
            mobile: false,
            input: [],
            history: [
              {
                type: "action",
                message: "Attempted to pay with card",
                time: Math.floor(Date.now() / 1000)
              },
              {
                type: "success",
                message: "Successfully paid with card",
                time: Math.floor(Date.now() / 1000)
              }
            ]
          },
          fees: 190, // Mock fee in kobo
          fees_split: null,
          authorization: {
            authorization_code: `AUTH_${Date.now()}`,
            bin: "408408",
            last4: "4081",
            exp_month: "12",
            exp_year: "2030",
            channel: "card",
            card_type: "visa DEBIT",
            bank: "Test Bank",
            country_code: "GH",
            brand: "visa",
            reusable: true,
            signature: `SIG_${Date.now()}`,
            account_name: null
          },
          customer: {
            id: Math.floor(Math.random() * 1000000),
            first_name: null,
            last_name: null,
            email: "test@example.com",
            customer_code: `CUS_${Date.now()}`,
            phone: null,
            metadata: {},
            risk_action: "default",
            international_format_phone: null
          },
          plan: null,
          split: {},
          order_id: null,
          paidAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          requested_amount: 10000,
          pos_transaction_data: null,
          source: null,
          fees_breakdown: null
        }
      }
      
      console.log('✅ MOCK: Payment verified successfully:', reference)
      return {
        success: true,
        data: mockResponse.data
      }
      
    } catch (error) {
      console.error('❌ MOCK: Payment verification error:', error)
      throw error
    }
  }
  
  /**
   * Mock transfer recipient creation
   */
  static async createTransferRecipient(recipientData) {
    try {
      const { name, account_number, bank_code, currency = 'GHS' } = recipientData
      
      console.log('🧪 MOCK: Creating transfer recipient:', recipientData)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const mockResponse = {
        status: true,
        message: "Transfer recipient created successfully",
        data: {
          active: true,
          createdAt: new Date().toISOString(),
          currency: currency,
          domain: "test",
          id: Math.floor(Math.random() * 1000000),
          integration: Math.floor(Math.random() * 1000000),
          name: name,
          recipient_code: `RCP_${Date.now()}`,
          type: "nuban",
          updatedAt: new Date().toISOString(),
          is_deleted: false,
          details: {
            authorization_code: null,
            account_number: account_number,
            account_name: name,
            bank_code: bank_code,
            bank_name: "Test Bank"
          }
        }
      }
      
      console.log('✅ MOCK: Transfer recipient created:', mockResponse.data.recipient_code)
      return {
        success: true,
        recipient_code: mockResponse.data.recipient_code,
        data: mockResponse.data
      }
      
    } catch (error) {
      console.error('❌ MOCK: Transfer recipient creation error:', error)
      throw error
    }
  }
  
  /**
   * Mock transfer initiation
   */
  static async initiateTransfer(transferData) {
    try {
      const { amount, recipient, reason, reference } = transferData
      
      console.log('🧪 MOCK: Initiating transfer:', transferData)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1200))
      
      const mockResponse = {
        status: true,
        message: "Transfer has been queued",
        data: {
          integration: Math.floor(Math.random() * 1000000),
          domain: "test",
          amount: amount * 100,
          currency: "GHS",
          source: "balance",
          reason: reason,
          recipient: recipient,
          status: "pending",
          transfer_code: `TRF_${Date.now()}`,
          id: Math.floor(Math.random() * 1000000),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          reference: reference
        }
      }
      
      console.log('✅ MOCK: Transfer initiated:', reference)
      return {
        success: true,
        transfer_code: mockResponse.data.transfer_code,
        data: mockResponse.data
      }
      
    } catch (error) {
      console.error('❌ MOCK: Transfer initiation error:', error)
      throw error
    }
  }
  
  /**
   * Mock banks list
   */
  static async getBanks(country = 'ghana') {
    try {
      console.log('🧪 MOCK: Fetching banks for:', country)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const mockBanks = [
        { name: "Access Bank", slug: "access-bank", code: "044", longcode: "044", gateway: "emandate", pay_with_bank: false, active: true, country: "Ghana", currency: "GHS", type: "nuban", id: 1 },
        { name: "Ecobank Ghana", slug: "ecobank-ghana", code: "130", longcode: "130", gateway: "emandate", pay_with_bank: false, active: true, country: "Ghana", currency: "GHS", type: "nuban", id: 2 },
        { name: "Fidelity Bank", slug: "fidelity-bank", code: "240", longcode: "240", gateway: "emandate", pay_with_bank: false, active: true, country: "Ghana", currency: "GHS", type: "nuban", id: 3 },
        { name: "First National Bank", slug: "first-national-bank", code: "341", longcode: "341", gateway: "emandate", pay_with_bank: false, active: true, country: "Ghana", currency: "GHS", type: "nuban", id: 4 },
        { name: "GCB Bank Limited", slug: "gcb-bank-limited", code: "040", longcode: "040", gateway: "emandate", pay_with_bank: false, active: true, country: "Ghana", currency: "GHS", type: "nuban", id: 5 }
      ]
      
      console.log('✅ MOCK: Banks fetched successfully')
      return {
        success: true,
        banks: mockBanks
      }
      
    } catch (error) {
      console.error('❌ MOCK: Error fetching banks:', error)
      throw error
    }
  }
  
  /**
   * Mock account resolution
   */
  static async resolveAccountNumber(account_number, bank_code) {
    try {
      console.log('🧪 MOCK: Resolving account:', { account_number, bank_code })
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600))
      
      const mockResponse = {
        status: true,
        message: "Account number resolved",
        data: {
          account_number: account_number,
          account_name: "John Doe Test Account",
          bank_id: Math.floor(Math.random() * 100)
        }
      }
      
      console.log('✅ MOCK: Account resolved successfully')
      return {
        success: true,
        account_name: mockResponse.data.account_name,
        account_number: mockResponse.data.account_number
      }
      
    } catch (error) {
      console.error('❌ MOCK: Account resolution error:', error)
      throw error
    }
  }
  
  // Keep all the utility methods from the original service
  static generateReference(prefix = 'PAY') {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `${prefix}_${timestamp}_${random}`
  }
  
  static generateTransferReference(prefix = 'TRF') {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `${prefix}_${timestamp}_${random}`
  }
  
  static calculateFees(amount) {
    let fee = 0
    if (amount <= 100) {
      fee = 0
    } else {
      fee = Math.max(1.95, amount * 0.019)
    }
    return Math.round(fee * 100) / 100
  }
  
  static validateWebhookSignature(payload, signature) {
    // For mock mode, always return true
    console.log('🧪 MOCK: Webhook signature validation (always returns true)')
    return true
  }
}

export default MockPaystackService
