import bcrypt from 'bcryptjs'
import { Database } from '@/lib/database'
import { ObjectId } from 'mongodb'

/**
 * User model for handling all user-related database operations
 * Supports: CUSTOMER, PROVIDER, ADMIN roles
 */
export class User {
  constructor(userData) {
    this.name = userData.name
    this.email = userData.email?.toLowerCase()
    this.password = userData.password
    this.role = userData.role || 'CUSTOMER'
    this.phone = userData.phone || null
    this.address = userData.address || null
    this.avatar = userData.avatar || null
    this.emailVerified = userData.emailVerified || false
    this.isActive = userData.isActive !== undefined ? userData.isActive : true
    this.createdAt = userData.createdAt || new Date()
    this.updatedAt = new Date()
    this.emailVerificationToken = userData.emailVerificationToken || null
    this.emailVerificationExpires = userData.emailVerificationExpires || null
    this.passwordResetToken = userData.passwordResetToken || null
    this.passwordResetExpires = userData.passwordResetExpires || null
    this.passwordResetOtpHash = userData.passwordResetOtpHash || null
    this.passwordResetOtpExpires = userData.passwordResetOtpExpires || null
  }

  /**
   * Create a new user in the database
   * @param {Object} userData - User data object
   * @returns {Promise<Object>} Created user result
   */
  static async create(userData) {
    try {
      const collection = await Database.getCollection('users')
      
      // Check if user already exists
      const existingUser = await collection.findOne({ email: userData.email.toLowerCase() })
      if (existingUser) {
        throw new Error('User already exists with this email')
      }

      // Hash password
      const saltRounds = 12
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds)

      // Create user instance
      const user = new User({
        ...userData,
        password: hashedPassword
      })

      // Insert into database
      const result = await collection.insertOne(user)
      
      console.log(`✅ User created: ${userData.email} with role: ${user.role}`)
      return {
        success: true,
        userId: result.insertedId,
        user: { ...user, password: undefined } // Don't return password
      }
    } catch (error) {
      console.error('❌ Error creating user:', error)
      throw error
    }
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByEmail(email) {
    try {
      const collection = await Database.getCollection('users')
      return await collection.findOne({ email: email.toLowerCase() })
    } catch (error) {
      console.error('❌ Error finding user by email:', error)
      throw error
    }
  }

  /**
   * Find user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  static async findById(userId) {
    try {
      const collection = await Database.getCollection('users')
      return await collection.findOne({ _id: new ObjectId(userId) })
    } catch (error) {
      console.error('❌ Error finding user by ID:', error)
      throw error
    }
  }

  /**
   * Validate user password
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @returns {Promise<Object|null>} User object if valid, null if invalid
   */
  static async validatePassword(email, password) {
    try {
      const user = await this.findByEmail(email)
      if (!user) {
        return null
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is deactivated')
      }

      const isValid = await bcrypt.compare(password, user.password)
      if (isValid) {
        // Update last login
        await this.updateLastLogin(user._id)
        
        // Return user without password
        const { password: _, ...userWithoutPassword } = user
        return userWithoutPassword
      }
      
      return null
    } catch (error) {
      console.error('❌ Error validating password:', error)
      throw error
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Update result
   */
  static async updateProfile(userId, updateData) {
    try {
      const collection = await Database.getCollection('users')
      
      // Remove sensitive fields that shouldn't be updated directly
      const { password, email, role, _id, ...safeUpdateData } = updateData
      
      const result = await collection.updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            ...safeUpdateData, 
            updatedAt: new Date() 
          } 
        }
      )

      if (result.matchedCount === 0) {
        throw new Error('User not found')
      }

      console.log(`✅ User profile updated: ${userId}`)
      return { success: true, modifiedCount: result.modifiedCount }
    } catch (error) {
      console.error('❌ Error updating user profile:', error)
      throw error
    }
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Update result
   */
  static async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await this.findById(userId)
      if (!user) {
        throw new Error('User not found')
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect')
      }

      // Hash new password
      const saltRounds = 12
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

      // Update password
      const collection = await Database.getCollection('users')
      const result = await collection.updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            password: hashedNewPassword,
            updatedAt: new Date()
          } 
        }
      )

      console.log(`✅ Password changed for user: ${userId}`)
      return { success: true, modifiedCount: result.modifiedCount }
    } catch (error) {
      console.error('❌ Error changing password:', error)
      throw error
    }
  }

  /**
   * Update user role (Admin only)
   * @param {string} userId - User ID
   * @param {string} newRole - New role (CUSTOMER, PROVIDER, ADMIN)
   * @returns {Promise<Object>} Update result
   */
  static async updateRole(userId, newRole) {
    try {
      const validRoles = ['CUSTOMER', 'PROVIDER', 'ADMIN']
      if (!validRoles.includes(newRole)) {
        throw new Error('Invalid role')
      }

      const collection = await Database.getCollection('users')
      const result = await collection.updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            role: newRole,
            updatedAt: new Date()
          } 
        }
      )

      if (result.matchedCount === 0) {
        throw new Error('User not found')
      }

      console.log(`✅ User role updated: ${userId} -> ${newRole}`)
      return { success: true, modifiedCount: result.modifiedCount }
    } catch (error) {
      console.error('❌ Error updating user role:', error)
      throw error
    }
  }

  /**
   * Get users by role
   * @param {string} role - User role
   * @param {Object} options - Query options (limit, skip, sort)
   * @returns {Promise<Array>} Array of users
   */
  static async findByRole(role, options = {}) {
    try {
      const collection = await Database.getCollection('users')
      const { limit = 50, skip = 0, sort = { createdAt: -1 } } = options

      const users = await collection
        .find({ role }, { projection: { password: 0 } }) // Exclude password
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray()

      return users
    } catch (error) {
      console.error('❌ Error finding users by role:', error)
      throw error
    }
  }

  /**
   * Deactivate user account
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Update result
   */
  static async deactivateUser(userId) {
    try {
      const collection = await Database.getCollection('users')
      const result = await collection.updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            isActive: false,
            updatedAt: new Date()
          } 
        }
      )

      if (result.matchedCount === 0) {
        throw new Error('User not found')
      }

      console.log(`✅ User deactivated: ${userId}`)
      return { success: true, modifiedCount: result.modifiedCount }
    } catch (error) {
      console.error('❌ Error deactivating user:', error)
      throw error
    }
  }

  /**
   * Update last login timestamp
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  static async updateLastLogin(userId) {
    try {
      const collection = await Database.getCollection('users')
      await collection.updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            lastLogin: new Date(),
            updatedAt: new Date()
          } 
        }
      )
    } catch (error) {
      console.error('❌ Error updating last login:', error)
      // Don't throw error for this non-critical operation
    }
  }

  /**
   * Get user statistics
   * @returns {Promise<Object>} User statistics
   */
  static async getStatistics() {
    try {
      const collection = await Database.getCollection('users')
      
      const stats = await collection.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]).toArray()

      const totalUsers = await collection.countDocuments()
      const activeUsers = await collection.countDocuments({ isActive: true })

      return {
        totalUsers,
        activeUsers,
        roleDistribution: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count
          return acc
        }, {})
      }
    } catch (error) {
      console.error('❌ Error getting user statistics:', error)
      throw error
    }
  }

  /**
   * Get all users with pagination, search, and filtering
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of users per page
   * @param {Object} filters - Search and filter options
   * @returns {Promise<Object>} Paginated users result
   */
  static async getAllWithPagination(page = 1, limit = 20, filters = {}) {
    try {
      const collection = await Database.getCollection('users')
      const { role, search } = filters
      
      // Build query
      const query = {}
      
      // Role filter
      if (role && role.trim()) {
        query.role = role.trim().toUpperCase()
      }
      
      // Search filter (name or email)
      if (search && search.trim()) {
        const searchRegex = { $regex: search.trim(), $options: 'i' }
        query.$or = [
          { name: searchRegex },
          { email: searchRegex }
        ]
      }
      
      // Calculate pagination
      const skip = (page - 1) * limit
      const totalItems = await collection.countDocuments(query)
      const totalPages = Math.ceil(totalItems / limit)
      
      // Fetch users
      const users = await collection
        .find(query, { projection: { password: 0 } }) // Exclude password
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray()
      
      console.log(`✅ Fetched ${users.length} users (page ${page}/${totalPages})`)
      
      return {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    } catch (error) {
      console.error('❌ Error getting users with pagination:', error)
      throw error
    }
  }

  /**
   * Update user status (activate/deactivate)
   * @param {string} userId - User ID
   * @param {boolean} isActive - Active status
   * @returns {Promise<Object>} Update result
   */
  static async updateStatus(userId, isActive) {
    try {
      const collection = await Database.getCollection('users')
      const result = await collection.updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            isActive: Boolean(isActive),
            updatedAt: new Date()
          } 
        }
      )

      if (result.matchedCount === 0) {
        throw new Error('User not found')
      }

      console.log(`✅ User status updated: ${userId} -> ${isActive ? 'active' : 'inactive'}`)
      return { 
        success: true, 
        modifiedCount: result.modifiedCount,
        status: isActive ? 'activated' : 'deactivated'
      }
    } catch (error) {
      console.error('❌ Error updating user status:', error)
      throw error
    }
  }

  /**
   * Find user by email verification token
   * @param {string} token - Hashed verification token
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByEmailVerificationToken(token) {
    try {
      const collection = await Database.getCollection('users')
      return await collection.findOne({ 
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() }
      })
    } catch (error) {
      console.error('❌ Error finding user by verification token:', error)
      throw error
    }
  }

  /**
   * Set password reset token for a user identified by email
   */
  static async setPasswordResetToken(email, hashedToken, expiresAt) {
    try {
      const collection = await Database.getCollection('users')
      const result = await collection.updateOne(
        { email: email.toLowerCase() },
        {
          $set: {
            passwordResetToken: hashedToken,
            passwordResetExpires: expiresAt,
            updatedAt: new Date(),
          },
          $unset: {
            passwordResetOtpHash: "",
            passwordResetOtpExpires: "",
          }
        }
      )

      return { success: result.matchedCount > 0 }
    } catch (error) {
      console.error('❌ Error setting password reset token:', error)
      throw error
    }
  }

  /**
   * Find user by password reset token (hashed) that hasn't expired
   */
  static async findByPasswordResetToken(hashedToken) {
    try {
      const collection = await Database.getCollection('users')
      return await collection.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() }
      })
    } catch (error) {
      console.error('❌ Error finding by password reset token:', error)
      throw error
    }
  }

  /**
   * Set password reset OTP (hashed) and expiry
   */
  static async setPasswordResetOtp(userId, hashedOtp, expiresAt) {
    try {
      const collection = await Database.getCollection('users')
      const result = await collection.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            passwordResetOtpHash: hashedOtp,
            passwordResetOtpExpires: expiresAt,
            updatedAt: new Date(),
          }
        }
      )
      return { success: result.matchedCount > 0 }
    } catch (error) {
      console.error('❌ Error setting password reset OTP:', error)
      throw error
    }
  }

  /**
   * Complete password reset with token and OTP
   */
  static async completePasswordReset(hashedToken, hashedOtp, newPassword) {
    try {
      const collection = await Database.getCollection('users')
      const user = await collection.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() },
        passwordResetOtpHash: hashedOtp,
        passwordResetOtpExpires: { $gt: new Date() }
      })

      if (!user) {
        throw new Error('Invalid or expired reset token/OTP')
      }

      const saltRounds = 12
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

      const result = await collection.updateOne(
        { _id: user._id },
        {
          $set: {
            password: hashedNewPassword,
            updatedAt: new Date()
          },
          $unset: {
            passwordResetToken: "",
            passwordResetExpires: "",
            passwordResetOtpHash: "",
            passwordResetOtpExpires: ""
          }
        }
      )

      return { success: result.modifiedCount > 0 }
    } catch (error) {
      console.error('❌ Error completing password reset:', error)
      throw error
    }
  }

  /**
   * Mark a user's email as verified
   * @param {ObjectId} userId - The user's ID
   * @returns {Promise<Object>} Update result
   */
  static async verifyEmail(userId) {
    try {
      const collection = await Database.getCollection('users')
      const result = await collection.updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            emailVerified: true,
            updatedAt: new Date()
          },
          $unset: {
            emailVerificationToken: "",
            emailVerificationExpires: ""
          }
        }
      )
      return { success: true, modifiedCount: result.modifiedCount };
    } catch (error) {
      console.error('❌ Error verifying email:', error)
      throw error
    }
  }
} 