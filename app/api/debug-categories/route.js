import { NextResponse } from 'next/server'
import Category from '@/models/Category'
import { ensureConnection } from '@/lib/mongodb'

export async function GET() {
  try {
    await ensureConnection()
    
    // Get all categories (including inactive)
    const allCategories = await Category.find({}).sort({ name: 1 })
    
    // Get only active categories
    const activeCategories = await Category.find({ isActive: true }).sort({ name: 1 })
    
    // Get only inactive categories
    const inactiveCategories = await Category.find({ isActive: false }).sort({ name: 1 })
    
    return NextResponse.json({
      success: true,
      debug: {
        total: allCategories.length,
        active: activeCategories.length,
        inactive: inactiveCategories.length,
        allCategories: allCategories.map(cat => ({
          id: cat._id.toString(),
          name: cat.name,
          isActive: cat.isActive,
          createdAt: cat.createdAt,
          updatedAt: cat.updatedAt
        })),
        activeCategories: activeCategories.map(cat => ({
          id: cat._id.toString(),
          name: cat.name,
          isActive: cat.isActive
        })),
        inactiveCategories: inactiveCategories.map(cat => ({
          id: cat._id.toString(),
          name: cat.name,
          isActive: cat.isActive
        }))
      }
    })
  } catch (error) {
    console.error('❌ Error in debug categories:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to debug categories'
    }, { status: 500 })
  }
} 