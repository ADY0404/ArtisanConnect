import { Database } from './database'
import { User } from '../models/User'

/**
 * Initialize database with indexes and default admin user
 * Run this once when setting up the application
 */
export async function initializeDatabase() {
  console.log('🚀 Initializing database...')
  
  try {
    // Test database connection
    console.log('📡 Testing database connection...')
    const isHealthy = await Database.healthCheck()
    if (!isHealthy) {
      throw new Error('Database connection failed')
    }
    console.log('✅ Database connection successful')

    // Create indexes
    console.log('📝 Creating database indexes...')
    await Database.createIndexes()

    // Create default admin user if it doesn't exist
    console.log('👤 Checking for admin user...')
    const adminEmail = 'admin@homeservice.com'
    const existingAdmin = await User.findByEmail(adminEmail)
    
    if (!existingAdmin) {
      console.log('🔧 Creating default admin user...')
      await User.create({
        name: 'System Administrator',
        email: adminEmail,
        password: 'Admin123!', // Change this in production
        role: 'ADMIN'
      })
      console.log('✅ Default admin user created')
      console.log(`📧 Admin Email: ${adminEmail}`)
      console.log('🔑 Admin Password: Admin123! (Please change this)')
    } else {
      console.log('✅ Admin user already exists')
    }

    // Get user statistics
    const stats = await User.getStatistics()
    console.log('📊 Current user statistics:', stats)

    console.log('🎉 Database initialization completed successfully!')
    
    return {
      success: true,
      message: 'Database initialized successfully',
      stats
    }

  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  }
}

/**
 * Create sample users for testing
 */
export async function createSampleUsers() {
  console.log('👥 Creating sample users for testing...')
  
  try {
    const sampleUsers = [
      {
        name: 'John Customer',
        email: 'customer@test.com',
        password: 'Test123!',
        role: 'CUSTOMER'
      },
      {
        name: 'Jane Provider',
        email: 'provider@test.com',
        password: 'Test123!',
        role: 'PROVIDER',
        phone: '+1234567890',
        address: '123 Service Street, City, State'
      },
      {
        name: 'Bob Plumber',
        email: 'plumber@test.com',
        password: 'Test123!',
        role: 'PROVIDER',
        phone: '+1987654321',
        address: '456 Fix Lane, City, State'
      }
    ]

    const results = []
    for (const userData of sampleUsers) {
      try {
        const existingUser = await User.findByEmail(userData.email)
        if (!existingUser) {
          const result = await User.create(userData)
          results.push(result)
          console.log(`✅ Created sample user: ${userData.email} (${userData.role})`)
        } else {
          console.log(`⚠️ Sample user already exists: ${userData.email}`)
        }
      } catch (error) {
        console.error(`❌ Error creating sample user ${userData.email}:`, error.message)
      }
    }

    console.log(`🎉 Sample users creation completed! Created ${results.length} new users.`)
    return results

  } catch (error) {
    console.error('❌ Error creating sample users:', error)
    throw error
  }
}

/**
 * Reset database (use with caution!)
 */
export async function resetDatabase() {
  console.log('⚠️ RESETTING DATABASE - This will delete all users!')
  
  try {
    const db = await Database.getDb()
    
    // Drop users collection
    await db.collection('users').drop()
    console.log('🗑️ Users collection dropped')
    
    // Recreate indexes
    await Database.createIndexes()
    console.log('📝 Indexes recreated')
    
    console.log('✅ Database reset completed')
    
  } catch (error) {
    if (error.code === 26) { // Collection doesn't exist
      console.log('ℹ️ Users collection didn\'t exist, continuing...')
    } else {
      console.error('❌ Error resetting database:', error)
      throw error
    }
  }
} 