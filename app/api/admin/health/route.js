import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { Database } from '@/lib/database'
import { ensureConnection } from '@/lib/mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    console.log('🔍 Health API session check:', session?.user?.email, session?.user?.role)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      console.log('❌ Health API unauthorized:', { 
        hasSession: !!session, 
        userRole: session?.user?.role 
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Fetching real-time platform health metrics')

    // Get system metrics
    const startTime = Date.now()
    const health = await getSystemHealth()
    const responseTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      health: {
        ...health,
        responseTime,
        lastChecked: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Health check error:', error)
    return NextResponse.json({
      success: false,
      health: {
        status: 'unhealthy',
        issues: ['Health check API failure'],
        uptime: 0,
        memoryUsage: null,
        databaseStatus: 'disconnected',
        apiServices: {},
        lastChecked: new Date().toISOString()
      }
    }, { status: 500 })
  }
}

async function getSystemHealth() {
  const issues = []
  let status = 'healthy'

  // 1. System Uptime
  const uptime = Math.floor(process.uptime())

  // 2. Memory Usage
  const memoryUsage = process.memoryUsage()
  const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100

  if (memoryUsagePercent > 85) {
    issues.push('High memory usage detected')
    status = 'warning'
  }

  // 3. Database Health
  const databaseStatus = await checkDatabaseHealth()
  if (databaseStatus !== 'connected') {
    issues.push('Database connection issues')
    status = 'unhealthy'
  }

  // 4. API Services Health
  const apiServices = await checkAPIServices()
  const failedServices = Object.entries(apiServices).filter(([_, status]) => status !== 'healthy')
  
  if (failedServices.length > 0) {
    issues.push(`API services down: ${failedServices.map(([name]) => name).join(', ')}`)
    status = status === 'healthy' ? 'warning' : 'unhealthy'
  }

  // 5. Environment Health
  const envHealth = checkEnvironmentHealth()
  if (envHealth.issues.length > 0) {
    issues.push(...envHealth.issues)
    status = 'warning'
  }

  return {
    status: issues.length === 0 ? 'healthy' : status,
    issues,
    uptime,
    memoryUsage: {
      used: memoryUsage.heapUsed,
      total: memoryUsage.heapTotal,
      percentage: Math.round(memoryUsagePercent)
    },
    databaseStatus,
    apiServices,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      env: process.env.NODE_ENV
    }
  }
}

async function checkDatabaseHealth() {
  try {
    const db = await Database.connect()
    
    // Test basic operations
    const testCollection = db.collection('health_check')
    const testDoc = { timestamp: new Date(), test: true }
    
    await testCollection.insertOne(testDoc)
    await testCollection.deleteOne({ test: true })
    
    return 'connected'
  } catch (error) {
    console.error('Database health check failed:', error)
    return 'disconnected'
  }
}

async function checkAPIServices() {
  const services = {}

  // Check Authentication Service
  try {
    const session = await getServerSession()
    services.authentication = 'healthy'
  } catch (error) {
    services.authentication = 'unhealthy'
  }

  // Check Database Operations
  try {
    const collection = await Database.getCollection('users')
    await collection.countDocuments({}, { limit: 1 })
    services.database_operations = 'healthy'
  } catch (error) {
    services.database_operations = 'unhealthy'
  }

  // Check File System
  try {
    const fs = require('fs').promises
    await fs.access('./package.json')
    services.file_system = 'healthy'
  } catch (error) {
    services.file_system = 'unhealthy'
  }

  return services
}

function checkEnvironmentHealth() {
  const issues = []
  const requiredEnvVars = [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'MONGODB_URI',
    'NEXT_PUBLIC_MASTER_URL_KEY'
  ]

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      issues.push(`Missing environment variable: ${envVar}`)
    }
  }

  return { issues }
} 