import { NextResponse } from 'next/server'
import Category from '@/models/Category'
import { ensureConnection } from '@/lib/mongodb'

const CATEGORY_ICONS = {
  'Cleaning': {
    icon: 'https://cdn-icons-png.flaticon.com/512/2515/2515402.png', // Cleaning spray icon
    backgroundColor: '#10B981', // Emerald green
    description: 'Professional home and office cleaning services'
  },
  'Electric': {
    icon: 'https://cdn-icons-png.flaticon.com/512/1940/1940954.png', // Electric bolt icon
    backgroundColor: '#F97316', // Orange
    description: 'Electrical installation and repair services'
  },
  'Painting': {
    icon: 'https://cdn-icons-png.flaticon.com/512/1198/1198371.png', // Paint brush icon
    backgroundColor: '#EF4444', // Red
    description: 'Interior and exterior painting services'
  },
  'Plumbing': {
    icon: 'https://cdn-icons-png.flaticon.com/512/2740/2740651.png', // Wrench/pipe icon
    backgroundColor: '#06B6D4', // Cyan
    description: 'Professional plumbing and water system services'
  },
  'Repair': {
    icon: 'https://cdn-icons-png.flaticon.com/512/3456/3456426.png', // Hammer/tools icon
    backgroundColor: '#F59E0B', // Amber
    description: 'General repair and maintenance services'
  },
  'Shifting': {
    icon: 'https://cdn-icons-png.flaticon.com/512/2649/2649316.png', // Moving truck icon
    backgroundColor: '#8B5CF6', // Purple
    description: 'Moving and relocation services'
  }
}

export async function POST() {
  try {
    await ensureConnection()
    
    console.log('🎨 Starting category icon update...')
    
    const results = {
      updated: [],
      errors: [],
      totalCategories: 0
    }
    
    // Get all existing categories
    const categories = await Category.getAll()
    results.totalCategories = categories.length
    
    console.log(`📂 Found ${categories.length} categories to update`)
    
    // Update each category with proper icons
    for (const category of categories) {
      const categoryName = category.name
      const iconData = CATEGORY_ICONS[categoryName]
      
      if (!iconData) {
        console.log(`⚠️ No icon data found for category: ${categoryName}`)
        results.errors.push({
          category: categoryName,
          error: 'No icon mapping found'
        })
        continue
      }
      
      try {
        // Update the category with new icon and background color
        const updateResult = await Category.update(category._id, {
          icon: iconData.icon,
          backgroundColor: iconData.backgroundColor,
          description: iconData.description
        })
        
        if (updateResult.success) {
          console.log(`✅ Updated ${categoryName} with new icon`)
          results.updated.push({
            category: categoryName,
            icon: iconData.icon,
            backgroundColor: iconData.backgroundColor
          })
        } else {
          throw new Error('Update failed')
        }
      } catch (error) {
        console.error(`❌ Failed to update ${categoryName}:`, error.message)
        results.errors.push({
          category: categoryName,
          error: error.message
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully updated ${results.updated.length} category icons`,
      results: {
        updated: results.updated.length,
        errors: results.errors.length,
        total: results.totalCategories,
        details: results
      }
    })
    
  } catch (error) {
    console.error('❌ Error updating category icons:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update category icons',
      details: error.message
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    await ensureConnection()
    
    // Get current categories and their icons
    const categories = await Category.getAll()
    
    return NextResponse.json({
      success: true,
      message: 'Current category icons',
      data: {
        categories: categories.map(cat => ({
          id: cat._id.toString(),
          name: cat.name,
          icon: cat.icon,
          backgroundColor: cat.backgroundColor,
          description: cat.description
        })),
        availableUpdates: Object.keys(CATEGORY_ICONS),
        iconMappings: CATEGORY_ICONS
      }
    })
  } catch (error) {
    console.error('❌ Error fetching category icons:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch category icons'
    }, { status: 500 })
  }
} 