import { Database } from '@/lib/database'
import { ObjectId } from 'mongodb'

/**
 * Review model for business reviews
 */
export class Review {
  constructor(reviewData) {
    this.businessId = new ObjectId(reviewData.businessId)
    this.userEmail = reviewData.userEmail
    this.userName = reviewData.userName
    this.rating = reviewData.rating // 1-5 stars
    this.comment = reviewData.comment || ''
    this.images = reviewData.images || [] // Array of image URLs (Cloudinary)
    this.isVerified = reviewData.isVerified || false // If from completed booking
    this.helpfulCount = reviewData.helpfulCount || 0
    this.status = reviewData.status || 'ACTIVE' // ACTIVE, HIDDEN, FLAGGED
    this.createdAt = reviewData.createdAt || new Date()
    this.updatedAt = new Date()
  }

  /**
   * Create a new review
   */
  static async create(reviewData) {
    try {
      const collection = await Database.getCollection('reviews')
      
      // Check if user already reviewed this business
      const existingReview = await collection.findOne({
        businessId: new ObjectId(reviewData.businessId),
        userEmail: reviewData.userEmail
      })
      
      if (existingReview) {
        throw new Error('You have already reviewed this business')
      }

      // Validate rating
      if (reviewData.rating < 1 || reviewData.rating > 5) {
        throw new Error('Rating must be between 1 and 5')
      }

      const review = new Review(reviewData)
      const result = await collection.insertOne(review)
      
      console.log(`✅ Review created: ${review.userEmail} rated ${review.rating} stars`)
      
      // Update business rating
      await this.updateBusinessRating(reviewData.businessId)
      
      return {
        success: true,
        reviewId: result.insertedId,
        review: { _id: result.insertedId, ...review }
      }
    } catch (error) {
      console.error('❌ Error creating review:', error)
      throw error
    }
  }

  /**
   * Get reviews by business ID
   */
  static async getByBusinessId(businessId, limit = 10, offset = 0) {
    try {
      const collection = await Database.getCollection('reviews')
      
      const reviews = await collection.find({
        businessId: new ObjectId(businessId),
        status: 'ACTIVE'
      })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray()
      
      return reviews
    } catch (error) {
      console.error('❌ Error fetching reviews by business:', error)
      throw error
    }
  }

  /**
   * Get reviews by user email
   */
  static async getByUserEmail(userEmail) {
    try {
      const collection = await Database.getCollection('reviews')
      const pipeline = [
        { $match: { userEmail: userEmail, status: 'ACTIVE' } },
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
        { $unwind: '$business.category' },
        { $sort: { createdAt: -1 } }
      ]
      
      return await collection.aggregate(pipeline).toArray()
    } catch (error) {
      console.error('❌ Error fetching reviews by user:', error)
      throw error
    }
  }

  /**
   * Update business rating after review changes
   */
  static async updateBusinessRating(businessId) {
    try {
      const collection = await Database.getCollection('reviews')
      
      // Calculate new rating and count
      const pipeline = [
        { $match: { businessId: new ObjectId(businessId), status: 'ACTIVE' } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 }
          }
        }
      ]
      
      const result = await collection.aggregate(pipeline).toArray()
      
      if (result.length > 0) {
        const { averageRating, totalReviews } = result[0]
        
        // Update business with new rating
        const { BusinessList } = await import('./BusinessList.js')
        await BusinessList.updateRating(
          businessId, 
          Math.round(averageRating * 10) / 10, // Round to 1 decimal
          totalReviews
        )
        
        console.log(`✅ Business rating updated: ${averageRating.toFixed(1)} (${totalReviews} reviews)`)
      }
    } catch (error) {
      console.error('❌ Error updating business rating:', error)
      throw error
    }
  }

  /**
   * Get review statistics for a business
   */
  static async getStatistics(businessId) {
    try {
      const collection = await Database.getCollection('reviews')
      
      const pipeline = [
        { $match: { businessId: new ObjectId(businessId), status: 'ACTIVE' } },
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            averageRating: { $avg: '$rating' },
            ratingBreakdown: {
              $push: '$rating'
            }
          }
        }
      ]
      
      const result = await collection.aggregate(pipeline).toArray()
      
      if (result.length === 0) {
        return {
          totalReviews: 0,
          averageRating: 0,
          ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        }
      }
      
      const stats = result[0]
      
      // Calculate rating breakdown
      const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      stats.ratingBreakdown.forEach(rating => {
        breakdown[rating]++
      })
      
      return {
        totalReviews: stats.totalReviews,
        averageRating: Math.round(stats.averageRating * 10) / 10,
        ratingBreakdown: breakdown
      }
    } catch (error) {
      console.error('❌ Error getting review statistics:', error)
      throw error
    }
  }

  /**
   * Mark review as helpful
   */
  static async markHelpful(reviewId) {
    try {
      const collection = await Database.getCollection('reviews')
      
      const result = await collection.updateOne(
        { _id: new ObjectId(reviewId) },
        { 
          $inc: { helpfulCount: 1 },
          $set: { updatedAt: new Date() }
        }
      )

      if (result.matchedCount === 0) {
        throw new Error('Review not found')
      }

      return { success: true }
    } catch (error) {
      console.error('❌ Error marking review as helpful:', error)
      throw error
    }
  }

  /**
   * Delete review (admin or user)
   */
  static async deleteById(reviewId, userEmail = null) {
    try {
      const collection = await Database.getCollection('reviews')
      
      const query = { _id: new ObjectId(reviewId) }
      if (userEmail) {
        query.userEmail = userEmail // Users can only delete their own reviews
      }
      
      const review = await collection.findOne(query)
      if (!review) {
        throw new Error('Review not found or access denied')
      }
      
      const result = await collection.deleteOne(query)
      
      if (result.deletedCount > 0) {
        // Update business rating after deletion
        await this.updateBusinessRating(review.businessId)
        console.log(`✅ Review deleted: ${reviewId}`)
        return true
      }
      
      return false
    } catch (error) {
      console.error('❌ Error deleting review:', error)
      throw error
    }
  }
} 