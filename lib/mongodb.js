import { MongoClient } from 'mongodb'
import mongoose from 'mongoose'

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env.local' })
}

const uri = process.env.MONGODB_URI
const options = {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4 // Use IPv4, skip trying IPv6
}

let client
let clientPromise

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local')
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

// Mongoose connection for real-time features
let isConnected = false
let connectionPromise = null

export async function connectDB() {
  // If already connected, return immediately
  if (isConnected && mongoose.connection.readyState === 1) {
    
    return mongoose.connection
  }

  // If connection is in progress, wait for it
  if (connectionPromise) {
    console.log('⏳ Waiting for existing connection...')
    return await connectionPromise
  }

  try {
    console.log('🔌 Connecting to MongoDB via Mongoose...')
    
    // Get database name from environment variable
    const dbName = process.env.MONGODB_DB_NAME || 'artisan_connect'
    const uriWithDatabase = uri.includes('mongodb+srv://') ? 
      uri.replace('/?', `/${dbName}?`) : 
      `${uri.split('?')[0]}/${dbName}${uri.includes('?') ? '?' + uri.split('?')[1] : ''}`
    
    // Create connection promise
    connectionPromise = mongoose.connect(uriWithDatabase, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: true, // Changed back to true to prevent the error
      maxIdleTimeMS: 30000,
      connectTimeoutMS: 10000
    })

    const connection = await connectionPromise
    isConnected = true
    console.log('✅ Connected to MongoDB via Mongoose')
    
    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      console.log('🔌 Mongoose disconnected from MongoDB')
      isConnected = false
      connectionPromise = null
    })

    mongoose.connection.on('error', (error) => {
      console.error('❌ Mongoose connection error:', error)
      isConnected = false
      connectionPromise = null
    })

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 Mongoose reconnected to MongoDB')
      isConnected = true
    })

    // Clear the connection promise since we're now connected
    connectionPromise = null
    return connection

  } catch (error) {
    console.error('❌ Failed to connect to MongoDB via Mongoose:', error)
    isConnected = false
    connectionPromise = null
    throw error
  }
}

// Enhanced function to ensure connection is ready for queries
export async function ensureConnection() {
  const maxRetries = 3
  let retries = 0

  while (retries < maxRetries) {
    try {
      await connectDB()
      
      // Double-check connection state
      if (mongoose.connection.readyState === 1) {
        return mongoose.connection
      } else {
        throw new Error(`Connection not ready. State: ${mongoose.connection.readyState}`)
      }
    } catch (error) {
      retries++
      console.error(`❌ Connection attempt ${retries}/${maxRetries} failed:`, error.message)
      
      if (retries >= maxRetries) {
        throw new Error(`Failed to establish database connection after ${maxRetries} attempts`)
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * retries))
    }
  }
}

// Function to get Mongoose connection status
export function getConnectionStatus() {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name
  }
}

// Function to close Mongoose connection
export async function disconnectDB() {
  if (!isConnected) {
    return
  }

  try {
    await mongoose.connection.close()
    isConnected = false
    connectionPromise = null
    console.log('🔌 Disconnected from MongoDB via Mongoose')
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error)
    throw error
  }
}

// Function to get native MongoDB database for direct operations
export async function getDatabase() {
  try {
    const client = await clientPromise
    return client.db(process.env.MONGODB_DB_NAME || 'artisan_connect')
  } catch (error) {
    console.error('❌ Failed to get MongoDB database:', error)
    throw error
  }
}

// Function to connect to database (alias for compatibility)
export async function connectToDatabase() {
  try {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB_NAME || 'artisan_connect')
    return { db }
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB database:', error)
    throw error
  }
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise 