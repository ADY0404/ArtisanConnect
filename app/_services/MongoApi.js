import Category from '@/models/Category'
import BusinessList from '@/models/BusinessList'
import { Booking } from '@/models/Booking'

/**
 * MongoDB-based API service to replace Hygraph GlobalApi
 * This maintains the same interface as GlobalApi.js for seamless migration
 */
class MongoApi {

  // ==================== CATEGORY METHODS ====================

  /**
   * Get all categories
   * Replaces: getCategory()
   */
  static async getCategory() {
    try {
      const categories = await Category.getAll()
      return { 
        categories: categories.map(cat => ({
          id: cat._id.toString(),
          name: cat.name,
          backgroundColor: cat.backgroundColor,
          icon: cat.icon
        }))
      }
    } catch (error) {
      console.error('❌ Error fetching categories:', error)
      throw error
    }
  }

  // ==================== BUSINESS METHODS ====================

  /**
   * Get all business listings
   * Replaces: getAllBusinessList()
   */
  static async getAllBusinessList() {
    try {
      const businesses = await BusinessList.getAll()
      return { 
        businessLists: businesses.map(business => ({
          id: business._id.toString(),
          name: business.name,
          about: business.about,
          address: business.address,
          contactPerson: business.contactPerson,
          email: business.email,
          phone: business.phone,
          images: business.images,
          rating: business.rating,
          totalReviews: business.totalReviews,
          category: {
            id: business.category._id.toString(),
            name: business.category.name,
            backgroundColor: business.category.backgroundColor,
            icon: business.category.icon
          }
        }))
      }
    } catch (error) {
      console.error('❌ Error fetching all businesses:', error)
      throw error
    }
  }

  /**
   * Get businesses by category
   * Replaces: getBusinessByCategory(category)
   */
  static async getBusinessByCategory(categoryName) {
    try {
      // First find the category by name
      const category = await Category.findByName(categoryName)
      if (!category) {
        return { businessLists: [] }
      }

      const businesses = await BusinessList.getByCategory(category._id.toString())
      return { 
        businessLists: businesses.map(business => ({
          id: business._id.toString(),
          name: business.name,
          about: business.about,
          address: business.address,
          contactPerson: business.contactPerson,
          email: business.email,
          phone: business.phone,
          images: business.images,
          rating: business.rating,
          totalReviews: business.totalReviews,
          category: {
            id: business.category._id.toString(),
            name: business.category.name,
            backgroundColor: business.category.backgroundColor,
            icon: business.category.icon
          }
        }))
      }
    } catch (error) {
      console.error('❌ Error fetching businesses by category:', error)
      throw error
    }
  }

  /**
   * Get business by ID
   * Replaces: getBusinessById(id)
   */
  static async getBusinessById(businessId) {
    try {
      const business = await BusinessList.findById(businessId)
      if (!business) {
        return { businessList: null }
      }

      return {
        businessList: {
          id: business._id.toString(),
          name: business.name,
          about: business.about,
          address: business.address,
          contactPerson: business.contactPerson,
          email: business.email,
          phone: business.phone,
          images: business.images,
          rating: business.rating,
          totalReviews: business.totalReviews,
          category: {
            id: business.category._id.toString(),
            name: business.category.name,
            backgroundColor: business.category.backgroundColor,
            icon: business.category.icon
          }
        }
      }
    } catch (error) {
      console.error('❌ Error fetching business by ID:', error)
      throw error
    }
  }

  // ==================== BOOKING METHODS ====================

  /**
   * Create a new booking
   * Replaces: createBooking(data)
   */
  static async createBooking(bookingData) {
    try {
      const result = await Booking.create({
        businessId: bookingData.BusinessList,
        userEmail: bookingData.UserEmail,
        userName: bookingData.UserName,
        date: bookingData.Date,
        time: bookingData.Time,
        serviceDetails: bookingData.Note || '',
        totalAmount: bookingData.totalAmount || 0
      })

      return {
        createBooking: {
          id: result.bookingId.toString()
        }
      }
    } catch (error) {
      console.error('❌ Error creating booking:', error)
      throw error
    }
  }

  /**
   * Get user bookings
   * Replaces: getUserBookings(userEmail)
   */
  static async getUserBookings(userEmail) {
    try {
      const bookings = await Booking.getByUserEmail(userEmail)
      return { 
        bookings: bookings.map(booking => ({
          id: booking._id.toString(),
          date: booking.date,
          time: booking.time,
          status: booking.status,
          serviceDetails: booking.serviceDetails,
          totalAmount: booking.totalAmount,
          paymentStatus: booking.paymentStatus,
          businessList: {
            id: booking.business._id.toString(),
            name: booking.business.name,
            about: booking.business.about,
            address: booking.business.address,
            contactPerson: booking.business.contactPerson,
            email: booking.business.email,
            phone: booking.business.phone,
            images: booking.business.images,
            category: {
              id: booking.business.category._id.toString(),
              name: booking.business.category.name,
              backgroundColor: booking.business.category.backgroundColor,
              icon: booking.business.category.icon
            }
          }
        }))
      }
    } catch (error) {
      console.error('❌ Error fetching user bookings:', error)
      throw error
    }
  }

  /**
   * Verify if a user has a confirmed booking with a business
   * New method to support conditional UI
   */
  static async verifyUserBooking(userEmail, businessId) {
    try {
      const hasBooking = await Booking.verifyUserBooking(userEmail, businessId)
      return { hasBooking }
    } catch (error) {
      console.error('❌ Error verifying user booking in MongoApi:', error)
      throw error
    }
  }

  /**
   * Get available time slots
   * New method for better booking experience
   */
  static async getAvailableSlots(businessId, date) {
    try {
      const slots = await Booking.getAvailableSlots(businessId, date)
      return { availableSlots: slots }
    } catch (error) {
      console.error('❌ Error fetching available slots:', error)
      throw error
    }
  }

  // ==================== SEARCH METHODS ====================

  /**
   * Search businesses
   * New enhanced search functionality
   */
  static async searchBusinesses(searchTerm, categoryId = null, filters = {}) {
    try {
      const businesses = await BusinessList.search(searchTerm, categoryId, filters)
      return { 
        businessLists: businesses.map(business => ({
          id: business._id.toString(),
          name: business.name,
          about: business.about,
          address: business.address,
          contactPerson: business.contactPerson,
          email: business.email,
          phone: business.phone,
          images: business.images,
          rating: business.rating,
          totalReviews: business.totalReviews,
          category: {
            id: business.category._id.toString(),
            name: business.category.name,
            backgroundColor: business.category.backgroundColor,
            icon: business.category.icon
          }
        }))
      }
    } catch (error) {
      console.error('❌ Error searching businesses:', error)
      throw error
    }
  }

  // ==================== ADMIN METHODS ====================

  /**
   * Create new category (Admin)
   */
  static async createCategory(categoryData) {
    try {
      const result = await Category.create(categoryData)
      return {
        createCategory: {
          id: result.categoryId.toString()
        }
      }
    } catch (error) {
      console.error('❌ Error creating category:', error)
      throw error
    }
  }

  /**
   * Create new business (Admin)
   */
  static async createBusiness(businessData) {
    try {
      const result = await BusinessList.create(businessData)
      return {
        createBusinessList: {
          id: result.businessId.toString()
        }
      }
    } catch (error) {
      console.error('❌ Error creating business:', error)
      throw error
    }
  }

  /**
   * Update business rating after review
   */
  static async updateBusinessRating(businessId, newRating, totalReviews) {
    try {
      await BusinessList.updateRating(businessId, newRating, totalReviews)
      return { success: true }
    } catch (error) {
      console.error('❌ Error updating business rating:', error)
      throw error
    }
  }

  // ==================== STATISTICS METHODS ====================

  /**
   * Get platform statistics (Admin)
   */
  static async getStatistics() {
    try {
      const bookingStats = await Booking.getStatistics()
      const categories = await Category.getAll()
      const businesses = await BusinessList.getAll()

      return {
        totalCategories: categories.length,
        totalBusinesses: businesses.length,
        totalBookings: bookingStats.totalBookings,
        totalRevenue: bookingStats.totalRevenue,
        averageRating: bookingStats.averageRating,
        bookingsByStatus: {
          pending: bookingStats.pendingBookings,
          confirmed: bookingStats.confirmedBookings,
          completed: bookingStats.completedBookings,
          cancelled: bookingStats.cancelledBookings
        }
      }
    } catch (error) {
      console.error('❌ Error fetching statistics:', error)
      throw error
    }
  }
}

export default MongoApi 