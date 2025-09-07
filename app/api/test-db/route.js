import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    console.log('🔍 Testing database connection...')
    
    // Test basic connection
    const client = await clientPromise
    console.log('✅ MongoDB client connected')
    
    // Test database access
    const db = client.db('homeservice')
    console.log('✅ Database accessed')
    
    // Test ping
    await client.db('admin').command({ ping: 1 })
    console.log('✅ Database ping successful')
    
    // Get database stats
    const stats = await db.stats()
    console.log('✅ Database stats retrieved')
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful!',
      database: 'homeservice',
      collections: stats.collections || 0,
      dataSize: stats.dataSize || 0,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Database connection error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 