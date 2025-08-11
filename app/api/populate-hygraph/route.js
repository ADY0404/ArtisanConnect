import { NextResponse } from 'next/server'
import { request, gql } from 'graphql-request'

// Use Management API for mutations (create, update, delete)
const MANAGEMENT_URL = 'https://management-eu-west-2.hygraph.com/graphql'
// Use Content API for queries (read)
const CONTENT_URL = `https://eu-west-2.cdn.hygraph.com/content/${process.env.NEXT_PUBLIC_MASTER_URL_KEY}/master`
const MANAGEMENT_TOKEN = process.env.HYGRAPH_MANAGEMENT_TOKEN

// Helper function for management API requests (mutations)
const managementRequest = async (query, variables = {}) => {
  const headers = {
    Authorization: `Bearer ${MANAGEMENT_TOKEN}`
  }
  
  return await request(MANAGEMENT_URL, query, variables, headers)
}

// Helper function for content API requests (queries)
const contentRequest = async (query, variables = {}) => {
  const headers = {
    Authorization: `Bearer ${MANAGEMENT_TOKEN}`
  }
  
  return await request(CONTENT_URL, query, variables, headers)
}

// Sample data that matches the created schema
const sampleCategories = [
  { name: "Cleaning", icon: "https://cdn-icons-png.flaticon.com/512/2515/2515402.png", bgcolor: "#e3f2fd" },
  { name: "Repair", icon: "https://cdn-icons-png.flaticon.com/512/3456/3456426.png", bgcolor: "#f3e5f5" },
  { name: "Painting", icon: "https://cdn-icons-png.flaticon.com/512/1198/1198371.png", bgcolor: "#e8f5e8" },
  { name: "Shifting", icon: "https://cdn-icons-png.flaticon.com/512/2649/2649316.png", bgcolor: "#fff3e0" },
  { name: "Plumbing", icon: "https://cdn-icons-png.flaticon.com/512/2740/2740651.png", bgcolor: "#e0f2f1" },
  { name: "Electric", icon: "https://cdn-icons-png.flaticon.com/512/1940/1940954.png", bgcolor: "#f1f8e9" }
]

const sampleBusinesses = [
  {
    name: "SparkleClean Pro",
    about: "Professional residential and commercial cleaning services with eco-friendly products and experienced staff.",
    address: "123 Main Street, Downtown",
    contactPerson: "Sarah Johnson",
    email: "sarah@sparkleclean.com",
    images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400"],
    categoryName: "Cleaning"
  },
  {
    name: "FixIt Masters",
    about: "Expert repair services for home appliances, furniture, and general household items. Quick and reliable solutions.",
    address: "456 Oak Avenue, City Center",
    contactPerson: "Mike Wilson",
    email: "mike@fixitmasters.com",
    images: ["https://images.unsplash.com/photo-1519788300525-70dd5d5e70e6?w=400", "https://images.unsplash.com/photo-1558618047-3c8c76cd3d98?w=400"],
    categoryName: "Repair"
  },
  {
    name: "ColorCraft Painting",
    about: "Professional interior and exterior painting services with premium quality paints and skilled painters.",
    address: "789 Pine Road, Suburban Area",
    contactPerson: "David Chen",
    email: "david@colorcraft.com",
    images: ["https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400", "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400"],
    categoryName: "Painting"
  },
  {
    name: "QuickMove Solutions", 
    about: "Comprehensive moving and shifting services for residential and commercial properties with careful handling.",
    address: "321 Elm Street, Business District",
    contactPerson: "Lisa Martinez",
    email: "lisa@quickmove.com",
    images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400"],
    categoryName: "Shifting"
  },
  {
    name: "FlowTech Plumbing",
    about: "Licensed plumbing services including repairs, installations, and emergency plumbing solutions available 24/7.",
    address: "654 Maple Drive, Residential Zone",
    contactPerson: "John Rodriguez",
    email: "john@flowtech.com",
    images: ["https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400", "https://images.unsplash.com/photo-1558618047-3c8c76cd3d98?w=400"],
    categoryName: "Plumbing"
  },
  {
    name: "PowerLine Electric",
    about: "Certified electrical services for residential and commercial properties including wiring, repairs, and installations.",
    address: "987 Cedar Lane, Industrial Area", 
    contactPerson: "Robert Kim",
    email: "robert@powerline.com",
    images: ["https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400", "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"],
    categoryName: "Electric"
  }
]

// POST method for smart data creation
export async function POST(request) {
  try {
    console.log('🚀 Starting smart data population...')
    
    const results = {
      categories: [],
      businesses: [],
      errors: [],
      published: []
    }

    // 1. First, get ALL categories (including Draft ones) from Management API
    console.log('🔍 Fetching all categories (including Draft)...')
    
    try {
      // Use Management API to get Draft categories
      const allCategoriesQuery = gql`
        query GetAllCategories {
          categories(stage: DRAFT) {
            id
            name
            stage
          }
        }
      `
      const allResult = await managementRequest(allCategoriesQuery)
      const draftCategories = allResult.categories || []
      console.log('📋 Found categories in Draft:', draftCategories.map(c => `${c.name} (${c.stage})`))
      
      // 2. Publish all Draft categories
      console.log('📢 Publishing Draft categories...')
      for (const category of draftCategories) {
        try {
          const publishMutation = gql`
            mutation PublishCategory($id: ID!) {
              publishCategory(where: { id: $id }) {
                id
                stage
              }
            }
          `
          const publishResult = await managementRequest(publishMutation, { id: category.id })
          console.log(`✅ Published category: ${category.name}`)
          results.published.push(category.name)
          results.categories.push(category)
        } catch (publishError) {
          console.error(`❌ Failed to publish category ${category.name}:`, publishError.message)
          results.errors.push({
            type: 'publish',
            name: category.name,
            error: publishError.message
          })
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to fetch/publish categories:', error.message)
      results.errors.push({
        type: 'category_fetch',
        error: error.message
      })
    }

    // 3. Now get published categories for business creation
    console.log('🗂️ Building category map from published categories...')
    let publishedCategories = []
    try {
      const publishedQuery = gql`
        query GetPublishedCategories {
          categories {
            id
            name
          }
        }
      `
      const publishedResult = await contentRequest(publishedQuery)
      publishedCategories = publishedResult.categories || []
      console.log('📋 Published categories available:', publishedCategories.map(c => c.name))
    } catch (error) {
      console.error('❌ Failed to fetch published categories:', error.message)
    }

    const categoryMap = {}
    publishedCategories.forEach(cat => {
      categoryMap[cat.name] = cat.id
    })

    // 4. Create Businesses
    if (Object.keys(categoryMap).length === 0) {
      console.log('⚠️ No published categories found, skipping business creation')
      results.errors.push({ 
        type: 'system', 
        name: 'no_published_categories', 
        error: 'No published categories available for business creation.' 
      })
    } else {
      console.log('🏢 Creating businesses...')
      console.log('📋 Available categories:', Object.keys(categoryMap))
      
      // Check existing businesses
      let existingBusinesses = []
      try {
        const existingQuery = gql`
          query GetExistingBusinesses {
            businessLists {
              id
              name
            }
          }
        `
        const existingResult = await contentRequest(existingQuery)
        existingBusinesses = existingResult.businessLists || []
        console.log('📋 Found existing businesses:', existingBusinesses.map(b => b.name))
      } catch (error) {
        console.log('⚠️ Could not fetch existing businesses (might be empty):', error.message)
      }
      
      for (const business of sampleBusinesses) {
        try {
          // Check if this business already exists
          const exists = existingBusinesses.find(b => b.name === business.name)
          if (exists) {
            console.log(`⏭️ Business ${business.name} already exists, skipping`)
            results.businesses.push(exists)
            continue
          }
          
          const categoryId = categoryMap[business.categoryName]
          if (!categoryId) {
            throw new Error(`Category ${business.categoryName} not found. Available: ${Object.keys(categoryMap).join(', ')}`)
          }

          const mutation = gql`
            mutation CreateBusiness(
              $name: String!
              $about: String!
              $address: String!
              $contactPerson: String!
              $email: String!
              $images: [String!]!
              $categoryId: ID!
            ) {
              createBusinessList(data: {
                name: $name
                about: $about
                address: $address
                contactPerson: $contactPerson
                email: $email
                images: $images
                category: { connect: { id: $categoryId } }
              }) {
                id
                name
                category {
                  name
                }
              }
            }
          `
          
          const variables = {
            name: business.name,
            about: business.about,
            address: business.address,
            contactPerson: business.contactPerson,
            email: business.email,
            images: business.images,
            categoryId
          }
          
          const result = await managementRequest(mutation, variables)
          results.businesses.push(result.createBusinessList)
          console.log(`✅ Created business: ${business.name}`)
          
          // Publish the business
          try {
            const publishMutation = gql`
              mutation PublishBusiness($id: ID!) {
                publishBusinessList(where: { id: $id }) {
                  id
                }
              }
            `
            await managementRequest(publishMutation, { id: result.createBusinessList.id })
            console.log(`📢 Published business: ${business.name}`)
          } catch (publishError) {
            console.log(`⚠️ Could not publish business ${business.name}: ${publishError.message}`)
          }
          
        } catch (error) {
          console.error(`❌ Failed to create business ${business.name}:`, error.message)
          results.errors.push({ 
            type: 'business', 
            name: business.name, 
            error: error.message,
            details: error.response?.errors || error.stack
          })
        }
      }
    }

    // 5. Final summary
    const summary = {
      categoriesPublished: results.published.length,
      businessesCreated: results.businesses.length,
      errorsCount: results.errors.length,
      totalOperations: results.published.length + results.businesses.length
    }

    console.log('🎉 Population completed!')
    console.log('📊 Summary:', summary)

    return NextResponse.json({
      success: true,
      message: `Data population completed! Published ${summary.categoriesPublished} categories and created ${summary.businessesCreated} businesses.`,
      results,
      summary,
      nextSteps: [
        'Check your Hygraph dashboard to see the published content',
        'Test your application at http://localhost:3000',
        'Categories should now display on the homepage',
        'Business listings should show when clicking categories'
      ],
      troubleshooting: summary.errorsCount > 0 ? 'Check the errors array for detailed information about what went wrong.' : null
    })

  } catch (error) {
    console.error('❌ Population error:', error)
    return NextResponse.json({
      success: false,
      error: 'Population failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

// GET method for testing and status checks
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'info'

  try {
    if (action === 'info') {
      return NextResponse.json({
        success: true,
        message: 'Hygraph Data Population API - Fixed for existing Draft categories',
        availableActions: {
          'POST /': 'Publish existing categories and create businesses',
          'GET /?action=status': 'Check current data status',
          'GET /?action=draft': 'Check Draft content status'
        },
        schemaInfo: {
          models: ['Category', 'BusinessList', 'Booking', 'Review'],
          contentEndpoint: CONTENT_URL,
          managementEndpoint: MANAGEMENT_URL
        }
      })
    }

    if (action === 'status') {
      console.log('🔍 Checking current published data status...')
      
      try {
        const statusQuery = gql`
          query GetDataStatus {
            categories {
              id
              name
            }
            businessLists {
              id
              name
              category {
                name
              }
            }
          }
        `
        
        const result = await contentRequest(statusQuery)
        
        return NextResponse.json({
          success: true,
          message: 'Current published data status retrieved',
          data: {
            categories: result.categories || [],
            businesses: result.businessLists || [],
            summary: {
              totalCategories: (result.categories || []).length,
              totalBusinesses: (result.businessLists || []).length
            }
          }
        })
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: 'Could not retrieve data status',
          details: error.message
        }, { status: 500 })
      }
    }

    if (action === 'draft') {
      console.log('🔍 Checking Draft content status...')
      
      try {
        const draftQuery = gql`
          query GetDraftStatus {
            categories(stage: DRAFT) {
              id
              name
              stage
            }
          }
        `
        
        const result = await managementRequest(draftQuery)
        
        return NextResponse.json({
          success: true,
          message: 'Draft content status retrieved',
          data: {
            draftCategories: result.categories || [],
            summary: {
              totalDraftCategories: (result.categories || []).length
            }
          }
        })
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: 'Could not retrieve draft status',
          details: error.message
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action',
      availableActions: ['info', 'status', 'draft']
    }, { status: 400 })

  } catch (error) {
    console.error('❌ GET error:', error)
    return NextResponse.json({
      success: false,
      error: 'Request failed',
      details: error.message
    }, { status: 500 })
  }
} 