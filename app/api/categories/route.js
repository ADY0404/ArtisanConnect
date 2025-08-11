import { NextResponse } from 'next/server'
import Category from '@/models/Category'
import { ensureConnection } from '@/lib/mongodb'

export async function GET() {
  try {
    await ensureConnection()
    
    // Debug: Let's see what we're getting from the database
    const allCategories = await Category.find({}).sort({ name: 1 })
    console.log('🔍 All categories in database:', allCategories.map(cat => ({
      id: cat._id.toString(),
      name: cat.name,
      isActive: cat.isActive
    })))
    
    const categories = await Category.getAll()
    console.log('✅ Active categories only:', categories.map(cat => ({
      id: cat._id.toString(),
      name: cat.name,
      isActive: cat.isActive
    })))
    
    // Add timestamp to force cache busting in production
    const timestamp = Date.now()
    
    const response = NextResponse.json({
      success: true,
      timestamp, // Add timestamp to response for cache busting
      categories: categories.map(cat => ({
        id: cat._id.toString(),
        name: cat.name,
        backgroundColor: cat.backgroundColor,
        icon: cat.icon
      }))
    })
    
    // Aggressive cache control headers for production
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Last-Modified', new Date().toUTCString())
    response.headers.set('ETag', `"${timestamp}"`)
    response.headers.set('Vary', 'Accept-Encoding')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    
    return response
  } catch (error) {
    console.error('❌ Error fetching categories:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch categories'
    }, { status: 500 })
  }
} 