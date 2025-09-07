import { Database } from '@/lib/database'
import { ObjectId } from 'mongodb'

/**
 * Booking model for service bookings
 */
export class Booking {
  constructor(bookingData) {
    this.businessId = new ObjectId(bookingData.businessId)
    this.userEmail = bookingData.userEmail
    this.userName = bookingData.userName
    this.date = new Date(bookingData.date)
    this.time = bookingData.time
    this.status = bookingData.status || 'PENDING' // PENDING, CONFIRMED, COMPLETED, CANCELLED
    this.serviceDetails = bookingData.serviceDetails || ''
    this.totalAmount = bookingData.totalAmount || 0
    this.paymentStatus = bookingData.paymentStatus || 'PENDING' // PENDING, PAID, REFUNDED
    this.paymentId = bookingData.paymentId || null
    this.notes = bookingData.notes || ''
    this.rating = bookingData.rating || null
    this.review = bookingData.review || null

    // ✅ NEW PAYMENT-RELATED FIELDS FOR PHASE 1
    this.platformCommission = bookingData.platformCommission || 0
    this.providerPayout = bookingData.providerPayout || 0
    this.paystackTransactionId = bookingData.paystackTransactionId || null
    this.paystackReference = bookingData.paystackReference || null
    this.payoutStatus = bookingData.payoutStatus || 'PENDING' // PENDING, PROCESSING, COMPLETED, FAILED
    this.payoutDate = bookingData.payoutDate || null
    this.disputeStatus = bookingData.disputeStatus || 'NONE' // NONE, RAISED, RESOLVED
    this.serviceCompletionDate = bookingData.serviceCompletionDate || null
    this.paymentMethod = bookingData.paymentMethod || 'CASH' // CASH, PAYSTACK
    this.invoiceGenerated = bookingData.invoiceGenerated || false
    this.invoiceId = bookingData.invoiceId || null
    this.commissionOwed = bookingData.commissionOwed || 0 // For cash payments

    this.createdAt = bookingData.createdAt || new Date()
    this.updatedAt = new Date()
  }

  /**
   * Create a new booking
   */
  static async create(bookingData) {
    try {
      const collection = await Database.getCollection('bookings')
      
      // Validate that the booking date is not in the past
      const bookingDate = new Date(bookingData.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset time to start of day
      
      if (bookingDate < today) {
        throw new Error('Cannot book appointments for past dates. Please select a future date.')
      }
      
      // Check for existing booking at same time/date
      const existingBooking = await collection.findOne({
        businessId: new ObjectId(bookingData.businessId),
        date: new Date(bookingData.date),
        time: bookingData.time,
        status: { $in: ['PENDING', 'CONFIRMED'] }
      })
      
      if (existingBooking) {
        throw new Error('Time slot already booked')
      }

      const booking = new Booking(bookingData)
      const result = await collection.insertOne(booking)
      
      console.log(`✅ Booking created: ${booking.userEmail} for ${booking.date}`)
      return {
        success: true,
        bookingId: result.insertedId,
        booking: { _id: result.insertedId, ...booking }
      }
    } catch (error) {
      console.error('❌ Error creating booking:', error)
      throw error
    }
  }

  /**
   * Get bookings by user email
   */
  static async getByUserEmail(userEmail) {
    try {
      const collection = await Database.getCollection('bookings')
      
      // Updated pipeline to work with MongoDB businesses collection (not Hygraph)
      const pipeline = [
        { $match: { userEmail: userEmail } },
        {
          $addFields: {
            businessObjectId: {
              $cond: {
                if: { $type: "$businessId" },
                then: { $toObjectId: "$businessId" },
                else: "$businessId"
              }
            }
          }
        },
        {
          $lookup: {
            from: 'businesslists', // MongoDB collection name
            localField: 'businessObjectId',
            foreignField: '_id',
            as: 'business'
          }
        },
        {
          $addFields: {
            business: {
              $cond: {
                if: { $eq: [{ $size: '$business' }, 0] },
                then: {
                  _id: '$businessId',
                  name: 'Service Provider',
                  about: 'Professional Service',
                  address: 'Location not specified',
                  contactPerson: 'Service Provider',
                  email: '',
                  phone: '',
                  images: ['/placeholder-business.jpg'],
                  category: {
                    _id: null,
                    name: 'General Service',
                    backgroundColor: '#3B82F6',
                    icon: '🔧'
                  }
                },
                else: { $arrayElemAt: ['$business', 0] }
              }
            }
          }
        },
        {
          $lookup: {
            from: 'categories', // MongoDB categories collection
            localField: 'business.categoryId',
            foreignField: '_id',
            as: 'businessCategory'
          }
        },
        {
          $addFields: {
            'business.category': {
              $cond: {
                if: { $eq: [{ $size: '$businessCategory' }, 0] },
                then: {
                  _id: null,
                  name: 'General Service',
                  backgroundColor: '#3B82F6',
                  icon: '🔧'
                },
                else: { $arrayElemAt: ['$businessCategory', 0] }
              }
            }
          }
        },
        { $unset: ['businessCategory', 'businessObjectId'] },
        { $sort: { createdAt: -1 } }
      ]
      
      const bookings = await collection.aggregate(pipeline).toArray()
      
      // If no bookings found, return empty array
      if (bookings.length === 0) {
        console.log(`📋 No bookings found for user: ${userEmail}`)
        return []
      }
      
      console.log(`📋 Found ${bookings.length} bookings for user: ${userEmail}`)
      return bookings
      
    } catch (error) {
      console.error('❌ Error fetching bookings by user:', error)
      
      // Fallback: Get basic booking data without lookups
      try {
        console.log('🔄 Attempting fallback booking retrieval...')
        const collection = await Database.getCollection('bookings')
        const basicBookings = await collection.find({ userEmail: userEmail })
          .sort({ createdAt: -1 })
          .toArray()
        
        // Add default business information for display
        const bookingsWithDefaults = basicBookings.map(booking => ({
          ...booking,
          business: {
            _id: booking.businessId,
            name: 'Service Provider',
            about: 'Professional Service',
            address: 'Location not specified',
            contactPerson: 'Service Provider',
            email: '',
            phone: '',
            images: ['/placeholder-business.jpg'],
            category: {
              _id: null,
              name: 'General Service',
              backgroundColor: '#3B82F6',
              icon: '🔧'
            }
          }
        }))
        
        console.log(`📋 Fallback: Found ${bookingsWithDefaults.length} bookings for user: ${userEmail}`)
        return bookingsWithDefaults
        
      } catch (fallbackError) {
        console.error('❌ Fallback booking retrieval also failed:', fallbackError)
        throw fallbackError
      }
    }
  }

  /**
   * Get bookings by business
   */
  static async getByBusiness(businessId) {
    try {
      const collection = await Database.getCollection('bookings')
      return await collection.find({ 
        businessId: new ObjectId(businessId) 
      }).sort({ date: 1, time: 1 }).toArray()
    } catch (error) {
      console.error('❌ Error fetching bookings by business:', error)
      throw error
    }
  }

  /**
   * Get booking by ID with full details
   */
  static async findById(bookingId) {
    try {
      const collection = await Database.getCollection('bookings')
      const pipeline = [
        { $match: { _id: new ObjectId(bookingId) } },
        {
          $lookup: {
            from: 'businesses',
            localField: 'businessId',
            foreignField: '_id',
            as: 'business'
          }
        },
        { $unwind: '$business' },
        {
          $lookup: {
            from: 'categories',
            localField: 'business.categoryId',
            foreignField: '_id',
            as: 'business.category'
          }
        },
        { $unwind: '$business.category' }
      ]
      
      const result = await collection.aggregate(pipeline).toArray()
      return result[0] || null
    } catch (error) {
      console.error('❌ Error finding booking by ID:', error)
      throw error
    }
  }

  /**
   * Delete booking by ID
   */
  static async deleteById(bookingId) {
    try {
      const collection = await Database.getCollection('bookings')
      
      const result = await collection.deleteOne({ 
        _id: new ObjectId(bookingId) 
      })

      if (result.deletedCount === 0) {
        return false // Booking not found
      }

      console.log(`✅ Booking deleted: ${bookingId}`)
      return true
    } catch (error) {
      console.error('❌ Error deleting booking:', error)
      throw error
    }
  }

  /**
   * Update booking status
   */
  static async updateStatus(bookingId, status) {
    try {
      const collection = await Database.getCollection('bookings')
      
      const validStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid booking status')
      }
      
      const result = await collection.updateOne(
        { _id: new ObjectId(bookingId) },
        { 
          $set: { 
            status: status,
            updatedAt: new Date() 
          } 
        }
      )

      if (result.matchedCount === 0) {
        throw new Error('Booking not found')
      }

      console.log(`✅ Booking status updated: ${bookingId} -> ${status}`)
      return { success: true }
    } catch (error) {
      console.error('❌ Error updating booking status:', error)
      throw error
    }
  }

  /**
   * Update payment status
   */
  static async updatePaymentStatus(bookingId, paymentStatus, paymentId = null) {
    try {
      const collection = await Database.getCollection('bookings')
      
      const validPaymentStatuses = ['PENDING', 'PAID', 'REFUNDED']
      if (!validPaymentStatuses.includes(paymentStatus)) {
        throw new Error('Invalid payment status')
      }
      
      const updateData = {
        paymentStatus: paymentStatus,
        updatedAt: new Date()
      }
      
      if (paymentId) {
        updateData.paymentId = paymentId
      }
      
      const result = await collection.updateOne(
        { _id: new ObjectId(bookingId) },
        { $set: updateData }
      )

      if (result.matchedCount === 0) {
        throw new Error('Booking not found')
      }

      console.log(`✅ Payment status updated: ${bookingId} -> ${paymentStatus}`)
      return { success: true }
    } catch (error) {
      console.error('❌ Error updating payment status:', error)
      throw error
    }
  }

  /**
   * Generate invoice for completed service
   */
  static async generateInvoice(bookingId, servicePrice, paymentMethod = 'CASH') {
    try {
      const collection = await Database.getCollection('bookings')

      // Get the booking
      const booking = await collection.findOne({ _id: new ObjectId(bookingId) })
      if (!booking) {
        throw new Error('Booking not found')
      }

      // Calculate commission consistently using CommissionService
      const { CommissionService } = await import('@/app/_services/CommissionService')
      // Determine provider tier from business
      const providerEmail = booking.providerEmail
      const providerTier = await CommissionService.determineProviderTier(providerEmail)
      const calculation = await CommissionService.calculateCommission(
        servicePrice,
        providerTier,
        'STANDARD',
        paymentMethod
      )

      const platformCommission = calculation.platformCommission
      const providerPayout = calculation.providerPayout
      const commissionOwed = calculation.commissionOwed

      // Generate invoice ID
      const invoiceId = `INV-${Date.now()}-${bookingId.toString().slice(-6)}`

      const updateData = {
        totalAmount: servicePrice,
        platformCommission: platformCommission,
        providerPayout: providerPayout,
        commissionOwed: commissionOwed,
        paymentMethod: paymentMethod,
        invoiceGenerated: true,
        invoiceId: invoiceId,
        serviceCompletionDate: new Date(),
        commissionRateUsed: calculation.commissionRate, // store rate used for transparency
        status: 'COMPLETED',
        updatedAt: new Date()
      }

      const result = await collection.updateOne(
        { _id: new ObjectId(bookingId) },
        { $set: updateData }
      )

      if (result.matchedCount === 0) {
        throw new Error('Failed to update booking with invoice data')
      }

      console.log(`✅ Invoice generated: ${invoiceId} for booking ${bookingId}`)
      return {
        success: true,
        invoiceId,
        totalAmount: servicePrice,
        platformCommission,
        providerPayout,
        commissionOwed,
        paymentMethod
      }
    } catch (error) {
      console.error('❌ Error generating invoice:', error)
      throw error
    }
  }

  /**
   * Update payment method after service completion
   */
  static async updatePaymentMethod(bookingId, paymentMethod, paystackReference = null) {
    try {
      const collection = await Database.getCollection('bookings')

      const validPaymentMethods = ['CASH', 'PAYSTACK']
      if (!validPaymentMethods.includes(paymentMethod)) {
        throw new Error('Invalid payment method')
      }

      const updateData = {
        paymentMethod: paymentMethod,
        updatedAt: new Date()
      }

      if (paymentMethod === 'PAYSTACK' && paystackReference) {
        updateData.paystackReference = paystackReference
        updateData.paymentStatus = 'PAID'
        updateData.paymentId = paystackReference
      }

      const result = await collection.updateOne(
        { _id: new ObjectId(bookingId) },
        { $set: updateData }
      )

      if (result.matchedCount === 0) {
        throw new Error('Booking not found')
      }

      console.log(`✅ Payment method updated: ${bookingId} -> ${paymentMethod}`)
      return { success: true, modifiedCount: result.modifiedCount }
    } catch (error) {
      console.error('❌ Error updating payment method:', error)
      throw error
    }
  }

  /**
   * Add review and rating
   */
  static async addReview(bookingId, rating, review) {
    try {
      const collection = await Database.getCollection('bookings')
      
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5')
      }
      
      const result = await collection.updateOne(
        { _id: new ObjectId(bookingId) },
        { 
          $set: { 
            rating: rating,
            review: review,
            updatedAt: new Date() 
          } 
        }
      )

      if (result.matchedCount === 0) {
        throw new Error('Booking not found')
      }

      console.log(`✅ Review added for booking: ${bookingId}`)
      return { success: true }
    } catch (error) {
      console.error('❌ Error adding review:', error)
      throw error
    }
  }

  /**
   * Find booking by ID
   */
  static async findById(bookingId) {
    try {
      const collection = await Database.getCollection('bookings')
      const booking = await collection.findOne({ _id: new ObjectId(bookingId) })
      return booking
    } catch (error) {
      console.error('❌ Error finding booking by ID:', error)
      throw error
    }
  }

  /**
   * Update booking by ID
   */
  static async updateById(bookingId, updateData) {
    try {
      const collection = await Database.getCollection('bookings')

      const result = await collection.updateOne(
        { _id: new ObjectId(bookingId) },
        { $set: { ...updateData, updatedAt: new Date() } }
      )

      if (result.matchedCount === 0) {
        throw new Error('Booking not found')
      }

      console.log(`✅ Booking updated: ${bookingId}`)
      return { success: true, modifiedCount: result.modifiedCount }
    } catch (error) {
      console.error('❌ Error updating booking:', error)
      throw error
    }
  }

  /**
   * Verify if a user has a confirmed/completed booking with a business
   */
  static async verifyUserBooking(userEmail, businessId) {
    try {
      const collection = await Database.getCollection('bookings');
      const booking = await collection.findOne({
        userEmail: userEmail,
        businessId: new ObjectId(businessId),
        status: { $in: ['CONFIRMED', 'COMPLETED', 'In Progress'] }
      });
      return booking !== null;
    } catch (error) {
      console.error('❌ Error verifying user booking:', error);
      return false;
    }
  }

  /**
   * Get available time slots for a business on a specific date
   */
  static async getAvailableSlots(businessId, date) {
    try {
      const collection = await Database.getCollection('bookings')
      
      // Get all booked slots for the date
      const bookedSlots = await collection.find({
        businessId: new ObjectId(businessId),
        date: new Date(date),
        status: { $in: ['PENDING', 'CONFIRMED'] }
      }).toArray()

      // Standard working hours (9 AM to 6 PM)
      const allSlots = [
        '09:00', '10:00', '11:00', '12:00', 
        '13:00', '14:00', '15:00', '16:00', '17:00'
      ]
      
      const bookedTimes = bookedSlots.map(booking => booking.time)
      const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot))
      
      return availableSlots
    } catch (error) {
      console.error('❌ Error getting available slots:', error)
      throw error
    }
  }

  /**
   * Get booking statistics
   */
  static async getStatistics(businessId = null) {
    try {
      const collection = await Database.getCollection('bookings')
      
      const matchCondition = businessId ? 
        { businessId: new ObjectId(businessId) } : {}
      
      const pipeline = [
        { $match: matchCondition },
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            pendingBookings: {
              $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] }
            },
            confirmedBookings: {
              $sum: { $cond: [{ $eq: ['$status', 'CONFIRMED'] }, 1, 0] }
            },
            completedBookings: {
              $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
            },
            cancelledBookings: {
              $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0] }
            },
            totalRevenue: { $sum: '$totalAmount' },
            averageRating: { $avg: '$rating' }
          }
        }
      ]
      
      const result = await collection.aggregate(pipeline).toArray()
      return result[0] || {
        totalBookings: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        totalRevenue: 0,
        averageRating: 0
      }
    } catch (error) {
      console.error('❌ Error getting booking statistics:', error)
      throw error
    }
  }
} 