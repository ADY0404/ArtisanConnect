/**
 * Commission Service for calculating platform fees and provider payouts
 * Supports dynamic commission rates based on provider tier and service type
 */

export class CommissionService {
  
  /**
   * Get commission rate based on provider tier and service type
   */
  static getCommissionRate(providerTier = 'NEW', serviceType = 'STANDARD') {
    // Base commission rates from environment variables
    const baseRates = {
      NEW: parseFloat(process.env.PLATFORM_COMMISSION_NEW_PROVIDER || '0.20'),
      VERIFIED: parseFloat(process.env.PLATFORM_COMMISSION_VERIFIED_PROVIDER || '0.18'),
      PREMIUM: parseFloat(process.env.PLATFORM_COMMISSION_PREMIUM_PROVIDER || '0.15'),
      ENTERPRISE: parseFloat(process.env.PLATFORM_COMMISSION_ENTERPRISE_PROVIDER || '0.12')
    }
    
    // Service type modifiers
    const serviceModifiers = {
      EMERGENCY: parseFloat(process.env.PLATFORM_COMMISSION_EMERGENCY_SERVICE || '0.25'),
      RECURRING: parseFloat(process.env.PLATFORM_COMMISSION_RECURRING_SERVICE || '0.15'),
      STANDARD: 0 // No modifier for standard services
    }
    
    // Get base rate for provider tier
    let commissionRate = baseRates[providerTier] || baseRates.NEW
    
    // Apply service type modifier (override for special services)
    if (serviceType === 'EMERGENCY' || serviceType === 'RECURRING') {
      commissionRate = serviceModifiers[serviceType]
    }
    
    return Math.min(Math.max(commissionRate, 0.10), 0.30) // Cap between 10% and 30%
  }
  
  /**
   * Calculate commission breakdown for a transaction
   */
  static calculateCommission(amount, providerTier = 'NEW', serviceType = 'STANDARD', paymentMethod = 'CASH') {
    const commissionRate = this.getCommissionRate(providerTier, serviceType)
    const platformCommission = amount * commissionRate
    
    let calculation = {
      totalAmount: amount,
      commissionRate: commissionRate,
      platformCommission: platformCommission,
      providerPayout: 0,
      commissionOwed: 0,
      paymentMethod: paymentMethod,
      breakdown: {
        baseAmount: amount,
        commissionPercentage: (commissionRate * 100).toFixed(1) + '%',
        platformFee: platformCommission,
        netToProvider: 0
      }
    }
    
    if (paymentMethod === 'PAYSTACK') {
      // For Paystack payments, commission is deducted automatically
      calculation.providerPayout = amount - platformCommission
      calculation.commissionOwed = 0
      calculation.breakdown.netToProvider = calculation.providerPayout
    } else if (paymentMethod === 'CASH') {
      // For cash payments, provider receives full amount but owes commission
      calculation.providerPayout = amount
      calculation.commissionOwed = platformCommission
      calculation.breakdown.netToProvider = amount
      calculation.breakdown.commissionDue = platformCommission
    }
    
    return calculation
  }
  
  /**
   * Determine provider tier based on their performance metrics
   */
  static async determineProviderTier(providerEmail) {
    try {
      // This would typically fetch from database
      // For now, we'll use a simple logic based on mock criteria
      
      // In a real implementation, you'd fetch:
      // - Total completed bookings
      // - Average rating
      // - Account age
      // - Verification status
      // - Revenue generated
      
      // Mock logic for demonstration
      const mockProviderData = {
        completedBookings: 25,
        averageRating: 4.7,
        accountAgeMonths: 8,
        isVerified: true,
        totalRevenue: 5000
      }
      
      // Tier determination logic
      if (mockProviderData.completedBookings >= 100 && 
          mockProviderData.averageRating >= 4.8 && 
          mockProviderData.totalRevenue >= 20000) {
        return 'ENTERPRISE'
      } else if (mockProviderData.completedBookings >= 50 && 
                 mockProviderData.averageRating >= 4.5 && 
                 mockProviderData.totalRevenue >= 10000) {
        return 'PREMIUM'
      } else if (mockProviderData.completedBookings >= 10 && 
                 mockProviderData.averageRating >= 4.0 && 
                 mockProviderData.isVerified) {
        return 'VERIFIED'
      } else {
        return 'NEW'
      }
    } catch (error) {
      console.error('❌ Error determining provider tier:', error)
      return 'NEW' // Default to NEW tier on error
    }
  }
  
  /**
   * Determine service type based on booking details
   */
  static determineServiceType(bookingDetails) {
    const { serviceDetails, isEmergency, isRecurring, scheduledDate } = bookingDetails
    
    // Check if it's an emergency service (same day or urgent keywords)
    if (isEmergency || this.isEmergencyService(serviceDetails, scheduledDate)) {
      return 'EMERGENCY'
    }
    
    // Check if it's a recurring service
    if (isRecurring || this.isRecurringService(serviceDetails)) {
      return 'RECURRING'
    }
    
    return 'STANDARD'
  }
  
  /**
   * Check if service qualifies as emergency
   */
  static isEmergencyService(serviceDetails, scheduledDate) {
    const emergencyKeywords = [
      'emergency', 'urgent', 'leak', 'burst', 'flooding', 'electrical fault',
      'power outage', 'gas leak', 'broken', 'immediate', 'asap'
    ]
    
    // Check for emergency keywords in service details
    const hasEmergencyKeywords = emergencyKeywords.some(keyword => 
      serviceDetails.toLowerCase().includes(keyword)
    )
    
    // Check if scheduled for same day or within 4 hours
    const now = new Date()
    const scheduled = new Date(scheduledDate)
    const hoursDifference = (scheduled - now) / (1000 * 60 * 60)
    const isSameDay = scheduled.toDateString() === now.toDateString()
    const isUrgent = hoursDifference <= 4
    
    return hasEmergencyKeywords || (isSameDay && isUrgent)
  }
  
  /**
   * Check if service qualifies as recurring
   */
  static isRecurringService(serviceDetails) {
    const recurringKeywords = [
      'weekly', 'monthly', 'quarterly', 'regular', 'maintenance',
      'subscription', 'recurring', 'routine', 'scheduled'
    ]
    
    return recurringKeywords.some(keyword => 
      serviceDetails.toLowerCase().includes(keyword)
    )
  }
  
  /**
   * Calculate total commission owed by provider (for cash payments)
   */
  static async calculateOwedCommission(providerEmail, dateRange = {}) {
    try {
      // This would fetch from PaymentTransaction model
      // For now, return mock calculation
      
      const mockTransactions = [
        { amount: 500, commissionRate: 0.18, paymentMethod: 'CASH' },
        { amount: 300, commissionRate: 0.18, paymentMethod: 'CASH' },
        { amount: 750, commissionRate: 0.20, paymentMethod: 'CASH' }
      ]
      
      const totalOwed = mockTransactions.reduce((sum, transaction) => {
        return sum + (transaction.amount * transaction.commissionRate)
      }, 0)
      
      return {
        totalOwed: totalOwed,
        transactionCount: mockTransactions.length,
        breakdown: mockTransactions.map(t => ({
          amount: t.amount,
          commission: t.amount * t.commissionRate,
          rate: (t.commissionRate * 100).toFixed(1) + '%'
        }))
      }
    } catch (error) {
      console.error('❌ Error calculating owed commission:', error)
      throw error
    }
  }
  
  /**
   * Generate commission report for admin
   */
  static async generateCommissionReport(dateRange = {}) {
    try {
      // This would aggregate data from PaymentTransaction model
      // For now, return mock report
      
      return {
        totalCommissionEarned: 2500.00,
        totalCommissionOwed: 850.00,
        paystackCommission: 1650.00,
        cashCommissionOwed: 850.00,
        transactionBreakdown: {
          paystack: 45,
          cash: 23
        },
        topProviders: [
          { email: 'provider1@example.com', commission: 450.00, tier: 'PREMIUM' },
          { email: 'provider2@example.com', commission: 380.00, tier: 'VERIFIED' },
          { email: 'provider3@example.com', commission: 320.00, tier: 'NEW' }
        ],
        averageCommissionRate: 0.175
      }
    } catch (error) {
      console.error('❌ Error generating commission report:', error)
      throw error
    }
  }
  
  /**
   * Validate commission calculation
   */
  static validateCommission(calculation) {
    const { totalAmount, platformCommission, providerPayout, commissionOwed } = calculation
    
    // Basic validation rules
    if (totalAmount <= 0) {
      throw new Error('Total amount must be positive')
    }
    
    if (platformCommission < 0 || platformCommission > totalAmount) {
      throw new Error('Invalid platform commission amount')
    }
    
    if (providerPayout < 0) {
      throw new Error('Provider payout cannot be negative')
    }
    
    if (commissionOwed < 0) {
      throw new Error('Commission owed cannot be negative')
    }
    
    // Ensure calculations add up correctly
    const tolerance = 0.01 // Allow for small rounding differences
    
    if (calculation.paymentMethod === 'PAYSTACK') {
      const expectedPayout = totalAmount - platformCommission
      if (Math.abs(providerPayout - expectedPayout) > tolerance) {
        throw new Error('Paystack payout calculation mismatch')
      }
    }
    
    return true
  }
}
