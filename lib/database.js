import clientPromise from './mongodb'

/**
 * Database utility class for common operations
 * Provides abstraction layer over MongoDB operations
 */
export class Database {
  static async getDb() {
    const client = await clientPromise
    return client.db(process.env.MONGODB_DB_NAME || 'artisan_connect')
  }

  /**
   * Get a collection from the database
   * @param {string} collectionName - Name of the collection
   * @returns {Promise<Collection>} MongoDB collection
   */
  static async getCollection(collectionName) {
    const db = await this.getDb()
    return db.collection(collectionName)
  }

  /**
   * Create indexes for better performance
   * Should be called during app initialization
   */
  static async createIndexes() {
    try {
      const db = await this.getDb()
      
      // Users collection indexes
      const usersCollection = db.collection('users')
      await usersCollection.createIndex({ email: 1 }, { unique: true })
      await usersCollection.createIndex({ role: 1 })
      await usersCollection.createIndex({ createdAt: 1 })
      
      // Sessions collection indexes (for future use)
      const sessionsCollection = db.collection('sessions')
      await sessionsCollection.createIndex({ userId: 1 })
      await sessionsCollection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
      
      console.log('✅ Database indexes created successfully')
    } catch (error) {
      console.error('❌ Error creating database indexes:', error)
    }
  }

  /**
   * Health check for database connection
   * @returns {Promise<boolean>} Connection status
   */
  static async healthCheck() {
    try {
      const client = await clientPromise
      await client.db('admin').command({ ping: 1 })
      return true
    } catch (error) {
      console.error('Database health check failed:', error)
      return false
    }
  }

  /**
   * Close database connection (for cleanup)
   */
  static async close() {
    try {
      const client = await clientPromise
      await client.close()
      console.log('Database connection closed')
    } catch (error) {
      console.error('Error closing database connection:', error)
    }
  }
} 