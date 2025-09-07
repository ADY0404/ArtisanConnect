const mongoose = require('mongoose')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

let isConnected = false

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection
  }

  try {
    console.log('🔌 Connecting to MongoDB for verification setup...')
    
    const uri = process.env.MONGODB_URI
    if (!uri) {
      throw new Error('MONGODB_URI not found in environment variables')
    }

    // Get database name from environment variable
    const dbName = process.env.MONGODB_DB_NAME || 'artisan_connect'
    const uriWithDatabase = uri.includes('mongodb+srv://') ? 
      uri.replace('/?', `/${dbName}?`) : 
      `${uri.split('?')[0]}/${dbName}${uri.includes('?') ? '?' + uri.split('?')[1] : ''}`
    
    await mongoose.connect(uriWithDatabase, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: true,
      maxIdleTimeMS: 30000,
      connectTimeoutMS: 10000
    })

    isConnected = true
    console.log('✅ Connected to MongoDB successfully')
    return mongoose.connection

  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error)
    throw error
  }
}

async function disconnectDB() {
  if (!isConnected) {
    return
  }

  try {
    await mongoose.connection.close()
    isConnected = false
    console.log('🔌 Disconnected from MongoDB')
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error)
    throw error
  }
}

module.exports = { connectDB, disconnectDB }




