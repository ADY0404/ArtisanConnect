import { NextResponse } from 'next/server'
import GlobalApi from '@/app/_services/GlobalApi'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'test'

    console.log('🧪 Testing Hygraph connection...')

    if (action === 'test') {
      // Test basic connection by fetching categories
      try {
        const categories = await GlobalApi.getCategory()
        console.log('✅ Hygraph connection successful')
        console.log('📊 Categories found:', categories?.categories?.length || 0)

        // Skip business query for now since BusinessList model doesn't exist yet
        // const businesses = await GlobalApi.getAllBusinessList()
        // console.log('📊 Businesses found:', businesses?.businessLists?.length || 0)

        return NextResponse.json({
          success: true,
          message: 'Hygraph connection successful - Category model working!',
          data: {
            categoriesCount: categories?.categories?.length || 0,
            // businessesCount: businesses?.businessLists?.length || 0,
            categories: categories?.categories || [],
            // businesses: businesses?.businessLists || []
            note: 'BusinessList model not created yet - only Category model is available'
          }
        })
      } catch (error) {
        console.error('❌ Hygraph connection failed:', error)
        return NextResponse.json({
          success: false,
          error: 'Failed to connect to Hygraph',
          details: error.message
        }, { status: 500 })
      }
    }

    if (action === 'populate') {
      console.log('🌱 Populating Hygraph with sample data...')
      
      // This would require the Management API and proper schema setup
      // For now, let's just return instructions
      return NextResponse.json({
        success: true,
        message: 'Data population requires complete schema setup',
        instructions: [
          '1. ✅ Category model created successfully!',
          '2. ❌ Need to create BusinessList model',
          '3. ❌ Need to create Booking model', 
          '4. Then we can populate data programmatically'
        ]
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use ?action=test or ?action=populate'
    }, { status: 400 })

  } catch (error) {
    console.error('❌ Test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { action, data } = await request.json()

    console.log('🧪 POST Test action:', action)

    if (action === 'create-category') {
      // Example of creating a category (requires proper schema)
      console.log('Creating category:', data)
      
      // This would use the Management API
      // const result = await createCategory(data)
      
      return NextResponse.json({
        success: true,
        message: 'Category creation test (schema setup required)',
        data: data
      })
    }

    if (action === 'create-business') {
      // Example of creating a business
      console.log('Creating business:', data)
      
      try {
        const result = await GlobalApi.createBusinessListing(data)
        console.log('✅ Business created:', result)
        
        return NextResponse.json({
          success: true,
          message: 'Business created successfully',
          data: result
        })
      } catch (error) {
        console.error('❌ Business creation failed:', error)
        return NextResponse.json({
          success: false,
          error: 'Failed to create business',
          details: error.message
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })

  } catch (error) {
    console.error('❌ POST Test error:', error)
    return NextResponse.json({
      success: false,
      error: 'POST test failed',
      details: error.message
    }, { status: 500 })
  }
} 