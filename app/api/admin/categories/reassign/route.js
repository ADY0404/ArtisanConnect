import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import Category from '@/models/Category'
import BusinessList from '@/models/BusinessList'
import { ensureConnection } from '@/lib/mongodb'

/**
 * POST: Reassign businesses from one category to another
 * Required body: { fromCategoryId, toCategoryId }
 */
export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    await ensureConnection()
    
    const { fromCategoryId, toCategoryId } = await request.json()
    
    if (!fromCategoryId || !toCategoryId) {
      return NextResponse.json({
        success: false,
        error: 'Both fromCategoryId and toCategoryId are required'
      }, { status: 400 })
    }

    // Verify both categories exist
    const fromCategory = await Category.findById(fromCategoryId)
    const toCategory = await Category.findById(toCategoryId)
    
    if (!fromCategory) {
      return NextResponse.json({
        success: false,
        error: 'Source category not found'
      }, { status: 404 })
    }
    
    if (!toCategory) {
      return NextResponse.json({
        success: false,
        error: 'Target category not found'
      }, { status: 404 })
    }
    
    if (!toCategory.isActive) {
      return NextResponse.json({
        success: false,
        error: 'Target category must be active'
      }, { status: 400 })
    }

    // Count businesses in the source category
    const businessCount = await BusinessList.countDocuments({ categoryId: fromCategoryId })
    
    if (businessCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'No businesses found in the source category'
      }, { status: 404 })
    }

    // Update all businesses from the old category to the new one
    const updateResult = await BusinessList.updateMany(
      { categoryId: fromCategoryId },
      { 
        $set: { 
          categoryId: toCategoryId,
          updatedAt: new Date()
        } 
      }
    )

    return NextResponse.json({
      success: true,
      message: `Successfully reassigned ${updateResult.modifiedCount} businesses from "${fromCategory.name}" to "${toCategory.name}"`,
      modifiedCount: updateResult.modifiedCount
    })
  } catch (error) {
    console.error('❌ Error reassigning businesses:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to reassign businesses'
    }, { status: 500 })
  }
} 