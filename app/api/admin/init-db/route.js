import { NextResponse } from 'next/server'
import { initializeDatabase, createSampleUsers } from '@/lib/init-db'

/**
 * Initialize Database API Endpoint
 * POST /api/admin/init-db
 * 
 * This endpoint should only be used during development or initial setup
 */
export async function POST(request) {
  try {
    // Security check - only allow in development or with admin key
    const isProduction = process.env.NODE_ENV === 'production'
    const { adminKey, createSamples } = await request.json()
    
    if (isProduction && adminKey !== process.env.ADMIN_INIT_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin key required' },
        { status: 401 }
      )
    }

    console.log('🔧 Database initialization requested...')

    // Initialize database
    const initResult = await initializeDatabase()
    
    let sampleUsersResult = null
    if (createSamples) {
      sampleUsersResult = await createSampleUsers()
    }

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      initialization: initResult,
      sampleUsers: sampleUsersResult ? {
        created: sampleUsersResult.length,
        users: sampleUsersResult.map(u => ({
          email: u.user.email,
          role: u.user.role
        }))
      } : null,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Database initialization error:', error)
    
    return NextResponse.json(
      { 
        error: 'Database initialization failed',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * Get database status
 * GET /api/admin/init-db
 */
export async function GET() {
  try {
    const { Database } = await import('@/lib/database')
    const { User } = await import('@/models/User')
    
    // Check database connection
    const isHealthy = await Database.healthCheck()
    
    if (!isHealthy) {
      return NextResponse.json({
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString()
      })
    }

    // Get user statistics
    const stats = await User.getStatistics()
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      userStats: stats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Database status check error:', error)
    
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 