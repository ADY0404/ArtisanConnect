/**
 * Commission Service for calculating platform fees and provider payouts
 * Supports dynamic commission rates based on provider tier and service type
 */

export class CommissionService {
  
  /**
   * Get commission rate based on provider tier and service type
   */
  static async getCommissionRate(providerTier = 'STANDARD', serviceType = 'STANDARD') {
    try {
      // Try to get rates from admin-managed commission config
      const { connectToDatabase } = await import('@/lib/mongodb')
      const { db } = await connectToDatabase()

      const commissionConfig = await db.collection('commission_config').findOne({
        type: 'provider_tiers'
      })

      // Use admin-managed rates if available (admin UI stores NEW/VERIFIED/STANDARD/PREMIUM/ENTERPRISE)
      const storedRates = commissionConfig?.rates || {}

      // Use the specific tier rate directly, with fallbacks for backward compatibility
      const tierKey = String(providerTier).toUpperCase()
      let ratePercentage = storedRates[tierKey]
      
      // Fallback logic for tier mapping (backward compatibility)
      if (ratePercentage === undefined) {
        if (['NEW', 'VERIFIED'].includes(tierKey)) {
          ratePercentage = storedRates.STANDARD ?? storedRates.VERIFIED ?? storedRates.NEW ?? 18.0
        } else if (tierKey === 'ENTERPRISE') {
          ratePercentage = storedRates.ENTERPRISE ?? storedRates.PREMIUM ?? 15.0
        } else {
          ratePercentage = storedRates.STANDARD ?? 18.0
        }
      }

      // Convert percentage to decimal
      const baseRate = (ratePercentage / 100)
      
      return baseRate

    } catch (error) {
      console.error('❌ Error fetching commission rates:', error)
      // Fallback to environment variables (simplified tier system)
      const baseRates = {
        STANDARD: parseFloat(process.env.PLATFORM_COMMISSION_STANDARD_PROVIDER || '0.18'),
        PREMIUM: parseFloat(process.env.PLATFORM_COMMISSION_PREMIUM_PROVIDER || '0.15')
      }
      const mappedTier = ['NEW', 'VERIFIED'].includes(String(providerTier).toUpperCase())
        ? 'STANDARD'
        : (String(providerTier).toUpperCase() === 'ENTERPRISE' ? 'PREMIUM' : String(providerTier).toUpperCase())
      const baseRate = baseRates[mappedTier] || baseRates.STANDARD
      
      return baseRate
    }

    // Service type modifiers
    const serviceModifiers = {
      EMERGENCY: 0.25, // 25% for emergency services
      RECURRING: 0.15, // 15% for recurring services
      STANDARD: 0 // No modifier for standard services
    }

    // Apply service type modifier (override for special services)
    let commissionRate = baseRate
    if (serviceType === 'EMERGENCY' || serviceType === 'RECURRING') {
      commissionRate = serviceModifiers[serviceType]
    }

    return Math.min(Math.max(commissionRate, 0.05), 0.50) // Cap between 5% and 50%
  }
  
  /**
   * Calculate commission breakdown for a transaction
   */
  static async calculateCommission(amount, providerTier = 'STANDARD', serviceType = 'STANDARD', paymentMethod = 'CASH') {
    const commissionRate = await this.getCommissionRate(providerTier, serviceType)
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
      // Import here to avoid circular dependencies
      const { connectToDatabase } = await import('@/lib/mongodb')
      const BusinessList = (await import('@/models/BusinessList')).default

      // Get provider's business and performance data
      const business = await BusinessList.findOne({
        providerEmail: providerEmail
      })

      if (!business) {
        console.log(`⚠️ No business found for provider: ${providerEmail}`)
        return 'NEW'
      }

      // ✅ HANDLE EXISTING PROVIDERS WITHOUT TIER PROPERTIES
      if (!business.providerTier || !business.performanceMetrics) {
        console.log(`🔧 Initializing tier properties for existing provider: ${providerEmail}`)

        // Initialize tier properties for existing providers
        const initialMetrics = {
          completedBookings: 0,
          averageRating: business.rating || 0,
          totalRevenue: 0,
          accountAgeMonths: Math.floor((new Date() - business.createdAt) / (1000 * 60 * 60 * 24 * 30)),
          isVerified: business.approvalStatus === 'APPROVED',
          lastUpdated: new Date()
        }

        await BusinessList.findByIdAndUpdate(business._id, {
          providerTier: 'STANDARD', // Default to STANDARD tier
          isPremiumProvider: false,
          tierAssignedAt: new Date(),
          performanceMetrics: initialMetrics
        })

        console.log(`✅ Initialized tier properties for existing provider: ${providerEmail}`)

        // Continue with tier calculation using initialized data
      }

      // If tier is already assigned and recent, use it
      if (business.providerTier && business.tierAssignedAt) {
        const daysSinceAssignment = (new Date() - business.tierAssignedAt) / (1000 * 60 * 60 * 24)
        if (daysSinceAssignment < 30) { // Tier is valid for 30 days
          return business.providerTier
        }
      }

      // Get real performance metrics
      const { db } = await connectToDatabase()

      // Calculate completed bookings
      const completedBookings = await db.collection('bookings').countDocuments({
        providerEmail: providerEmail,
        status: 'COMPLETED'
      })

      // Calculate total revenue from completed bookings
      const revenueResult = await db.collection('payment_transactions').aggregate([
        {
          $match: {
            providerEmail: providerEmail,
            paymentStatus: 'COMPLETED'
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' }
          }
        }
      ]).toArray()

      const totalRevenue = revenueResult[0]?.totalRevenue || 0

      // Get average rating
      const averageRating = business.rating || 0

      // Calculate account age in months
      const accountAgeMonths = Math.floor((new Date() - business.createdAt) / (1000 * 60 * 60 * 24 * 30))

      // Check verification status
      const isVerified = business.approvalStatus === 'APPROVED'

      // Update performance metrics
      const updatedMetrics = {
        completedBookings,
        averageRating,
        totalRevenue,
        accountAgeMonths,
        isVerified,
        lastUpdated: new Date()
      }

      // Simplified tier determination - only check if eligible for Premium
      // Default to STANDARD, only promote to PREMIUM if manually done by admin
      let newTier = 'STANDARD'

      // Check if already premium (admin-promoted)
      if (business.isPremiumProvider) {
        newTier = 'PREMIUM'
      }

      // Note: Premium promotion is now only done manually by admins
      // Automatic tier upgrades are disabled in the simplified system

      // Update business with new tier and metrics
      await BusinessList.findByIdAndUpdate(business._id, {
        providerTier: newTier,
        tierAssignedAt: new Date(),
        performanceMetrics: updatedMetrics
      })

      console.log(`✅ Provider tier updated: ${providerEmail} -> ${newTier}`, {
        completedBookings,
        averageRating,
        totalRevenue,
        accountAgeMonths,
        isVerified
      })

      return newTier

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
