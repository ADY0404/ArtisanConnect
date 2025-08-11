/**
 * Client-side API service for making HTTP requests to our API routes
 * This replaces the direct MongoDB imports that were causing build issues
 */
class ApiService {

  // ==================== CATEGORY METHODS ====================

  /**
   * Get all categories
   */
  static async getCategory() {
    try {
      // Add timestamp to URL for cache busting in production
      const timestamp = Date.now()
      const response = await fetch(`/api/categories?t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch categories')
      }
      
      return { categories: data.categories }
    } catch (error) {
      console.error('❌ Error fetching categories:', error)
      throw error
    }
  }

  // ==================== BUSINESS METHODS ====================

  /**
   * Get all business listings
   */
  static async getAllBusinessList() {
    try {
      const response = await fetch('/api/businesses')
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch businesses')
      }
      
      return { businessLists: data.businessLists }
    } catch (error) {
      console.error('❌ Error fetching businesses:', error)
      throw error
    }
  }

  /**
   * Get businesses by category
   */
  static async getBusinessByCategory(categoryName) {
    try {
      const response = await fetch(`/api/businesses?category=${encodeURIComponent(categoryName)}`)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch businesses by category')
      }
      
      return { businessLists: data.businessLists }
    } catch (error) {
      console.error('❌ Error fetching businesses by category:', error)
      throw error
    }
  }

  /**
   * Get business by ID
   */
  static async getBusinessById(businessId) {
    try {
      const response = await fetch(`/api/businesses/${businessId}`)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch business')
      }
      
      return { businessList: data.businessList }
    } catch (error) {
      console.error('❌ Error fetching business by ID:', error)
      throw error
    }
  }

  /**
   * Create a new business listing
   */
  static async createBusinessListing(businessData) {
    try {
      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(businessData)
      })
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create business listing')
      }
      
      return { success: true, businessList: data.businessList }
    } catch (error) {
      console.error('❌ Error creating business listing:', error)
      throw error
    }
  }

  // ==================== BOOKING METHODS ====================

  /**
   * Create a new booking
   */
  static async createBooking(bookingData) {
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      })
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create booking')
      }
      
      return { createBooking: data.createBooking }
    } catch (error) {
      console.error('❌ Error creating booking:', error)
      throw error
    }
  }

  /**
   * Get user bookings
   */
  static async getUserBookings(userEmail) {
    try {
      const response = await fetch(`/api/bookings?userEmail=${encodeURIComponent(userEmail)}`)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch user bookings')
      }
      
      return { bookings: data.bookings }
    } catch (error) {
      console.error('❌ Error fetching user bookings:', error)
      throw error
    }
  }

  /**
   * Delete a booking
   */
  static async deleteBooking(bookingId) {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete booking')
      }
      
      return { success: true }
    } catch (error) {
      console.error('❌ Error deleting booking:', error)
      throw error
    }
  }

  /**
   * Verify user booking
   */
  static async verifyUserBooking(businessId) {
    const response = await fetch('/api/bookings/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ businessId })
    })

    if (!response.ok) {
      throw new Error('Failed to verify user booking')
    }

    const data = await response.json()
    return data // Returns { hasBooking: boolean }
  }

  /**
   * Get provider availability for a business
   */
  static async getAvailability(businessId) {
    try {
      const response = await fetch(`/api/businesses/${businessId}/availability`);
      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error fetching availability:', error);
      throw error;
    }
  }

  /**
   * Get available time slots for a business on a specific date
   */
  static async getAvailableSlots(businessId, date) {
    try {
      const response = await fetch(`/api/businesses/${businessId}/available-slots?date=${date}`);
      if (!response.ok) {
        throw new Error('Failed to fetch available slots');
      }
      const data = await response.json();
      return { availableSlots: data };
    } catch (error) {
      console.error('❌ Error fetching available slots:', error);
      throw error;
    }
  }

  // ==================== REVIEW METHODS ====================

  /**
   * Get reviews for a business
   */
  static async getBusinessReviews(businessId, limit = 10, offset = 0) {
    try {
      const response = await fetch(`/api/reviews?businessId=${businessId}&limit=${limit}&offset=${offset}`)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch reviews')
      }
      
      return { reviews: data.reviews }
    } catch (error) {
      console.error('❌ Error fetching business reviews:', error)
      throw error
    }
  }

  /**
   * Get reviews by user
   */
  static async getUserReviews(userEmail) {
    try {
      const response = await fetch(`/api/reviews?userEmail=${encodeURIComponent(userEmail)}`)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch user reviews')
      }
      
      return { reviews: data.reviews }
    } catch (error) {
      console.error('❌ Error fetching user reviews:', error)
      throw error
    }
  }

  /**
   * Create a new review
   */
  static async createReview(reviewData) {
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData)
      })
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create review')
      }
      
      return { success: true, review: data.review }
    } catch (error) {
      console.error('❌ Error creating review:', error)
      throw error
    }
  }

  /**
   * Delete a review (user can only delete their own reviews)
   */
  static async deleteReview(reviewId) {
    try {
      const response = await fetch(`/api/reviews?reviewId=${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete review')
      }
      
      return { success: true, message: data.message }
    } catch (error) {
      console.error('❌ Error deleting review:', error)
      throw error
    }
  }

  /**
   * Get review statistics for a business
   */
  static async getReviewStatistics(businessId) {
    try {
      const response = await fetch(`/api/reviews/stats?businessId=${businessId}`)
      const data = await response.json()
      
      if (response.ok) {
        return { stats: data }
      } else {
        throw new Error(data.error || 'Failed to fetch review statistics')
      }
    } catch (error) {
      console.error('❌ Error fetching review statistics:', error)
      throw error
    }
  }

  /**
   * Enhanced search businesses with comprehensive filters
   */
  static async searchBusinessesWithFilters(filters = {}) {
    try {
      const {
        searchQuery = '',
        location = '',
        category = '',
        minRating = 0,
        priceRange = { min: 0, max: 1000 },
        radius = 10,
        coordinates = null,
        sortBy = 'rating', // rating, distance, price, reviews
        page = 1,
        limit = 20
      } = filters;

      // Enhanced debugging for location search
      console.log('🔍 ApiService.searchBusinessesWithFilters called with:', {
        location: location,
        hasLocation: !!location,
        locationLength: location?.length,
        category: category,
        coordinates: coordinates,
        radius: radius
      });

      const requestBody = {
        action: 'search',
        filters: {
          searchQuery,
          location,
          category,
          minRating,
          priceRange,
          radius,
          coordinates,
          sortBy,
          page,
          limit
        }
      };

      console.log('📡 Sending search request:', requestBody);

      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Search API error:', response.status, errorText);
        throw new Error(`Failed to search businesses: ${response.status}`);
      }

      const data = await response.json();

      console.log('✅ Search API response:', {
        totalResults: data.businesses?.length || 0,
        hasLocationFilter: !!location,
        appliedLocation: location
      });

      // Log sample results for debugging
      if (data.businesses && data.businesses.length > 0) {
        console.log('📋 Sample search results:', data.businesses.slice(0, 3).map(b => ({
          name: b.name,
          address: b.address,
          category: b.category?.name
        })));
      } else if (location) {
        console.warn('⚠️ No results found for location:', location);
      }

      return {
        businesses: data.businesses || [],
        total: data.total || 0,
        page,
        limit,
        totalPages: Math.ceil((data.total || 0) / limit)
      };

    } catch (error) {
      console.error('❌ Error searching businesses:', error);
      throw error;
    }
  }

  /**
   * Get location suggestions for autocomplete
   */
  static async getLocationSuggestions(query) {
    try {
      // Get unique locations from businesses
      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'locations',
          query
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get location suggestions');
      }

      const data = await response.json();
      return data.locations || [];

    } catch (error) {
      console.error('Error getting location suggestions:', error);
      return [];
    }
  }

  /**
   * Get nearby businesses based on coordinates
   */
  static async getNearbyBusinesses(latitude, longitude, radius = 10, limit = 10) {
    try {
      const filters = {
        coordinates: { latitude, longitude },
        radius,
        limit,
        sortBy: 'distance'
      };

      return await this.searchBusinessesWithFilters(filters);

    } catch (error) {
      console.error('Error getting nearby businesses:', error);
      throw error;
    }
  }

  /**
   * Get popular searches and categories
   */
  static async getPopularSearches() {
    try {
      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'popular'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get popular searches');
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error getting popular searches:', error);
      return {
        categories: [],
        locations: [],
        services: []
      };
    }
  }
}

export default ApiService 