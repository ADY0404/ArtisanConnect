import { NextResponse } from 'next/server'
import { request, gql } from 'graphql-request'

const CONTENT_URL = `https://eu-west-2.cdn.hygraph.com/content/${process.env.NEXT_PUBLIC_MASTER_URL_KEY}/master`
const CONTENT_TOKEN = process.env.HYGRAPH_MANAGEMENT_TOKEN

const contentRequest = async (query, variables = {}) => {
  const headers = {
    Authorization: `Bearer ${CONTENT_TOKEN}`
  }
  return await request(CONTENT_URL, query, variables, headers)
}

const sampleBusinesses = [
  {
    name: "SparkleClean Pro",
    about: "Professional residential and commercial cleaning services",
    address: "123 Main Street, Downtown",
    contactPerson: "Sarah Johnson",
    email: "sarah@sparkleclean.com",
    images: [],
    categoryName: "Cleaning"
  },
  {
    name: "FixIt Masters",
    about: "Expert repair services for appliances and furniture",
    address: "456 Oak Avenue, City Center",
    contactPerson: "Mike Wilson",
    email: "mike@fixitmasters.com",
    images: [],
    categoryName: "Repair"
  },
  {
    name: "ColorCraft Painting",
    about: "Professional painting services for homes and offices",
    address: "789 Pine Road, Suburban Area",
    contactPerson: "David Chen",
    email: "david@colorcraft.com",
    images: [],
    categoryName: "Painting"
  },
  {
    name: "QuickMove Solutions",
    about: "Reliable moving and shifting services",
    address: "321 Elm Street, Business District",
    contactPerson: "Lisa Martinez",
    email: "lisa@quickmove.com",
    images: [],
    categoryName: "Shifting"
  },
  {
    name: "FlowTech Plumbing",
    about: "Licensed plumbing services and emergency repairs",
    address: "654 Maple Drive, Residential Zone",
    contactPerson: "John Rodriguez",
    email: "john@flowtech.com",
    images: [],
    categoryName: "Plumbing"
  },
  {
    name: "PowerLine Electric",
    about: "Certified electrical services and installations",
    address: "987 Cedar Lane, Industrial Area",
    contactPerson: "Robert Kim",
    email: "robert@powerline.com",
    images: [],
    categoryName: "Electric"
  }
]

export async function POST() {
  try {
    console.log('🏢 Creating businesses (assumes categories are published)...')
    
    // Force cache invalidation - Updated mutation with RichText support
    const results = {
      businesses: [],
      errors: []
    }

    // 1. Get published categories
    console.log('📋 Fetching published categories...')
    let categoryMap = {}
    
    try {
      const categoriesQuery = gql`
        query GetCategories {
          categories {
            id
            name
          }
        }
      `
      const categoriesResult = await contentRequest(categoriesQuery)
      const categories = categoriesResult.categories || []
      
      categories.forEach(cat => {
        categoryMap[cat.name] = cat.id
      })
      
      console.log('✅ Found categories:', Object.keys(categoryMap))
      
      if (Object.keys(categoryMap).length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No published categories found',
          message: 'Please publish the categories in your Hygraph dashboard first',
          instructions: [
            '1. Go to Hygraph dashboard',
            '2. Click Content > Category',
            '3. For each category, click it and press Publish',
            '4. Then run this endpoint again'
          ]
        }, { status: 400 })
      }
      
    } catch (error) {
      console.error('❌ Failed to fetch categories:', error.message)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch categories',
        details: error.message
      }, { status: 500 })
    }

    // 2. Test token permissions first
    console.log('🔑 Testing token permissions...')
    try {
      const testQuery = gql`
        query TestPermissions {
          categories {
            id
            name
          }
        }
      `
      const testResult = await contentRequest(testQuery)
      console.log('✅ Token works for queries:', testResult.categories.length, 'categories found')
    } catch (error) {
      console.error('❌ Token failed for basic query:', error.message)
      return NextResponse.json({
        success: false,
        error: 'Token permission issue',
        details: 'The Content API token cannot perform queries. Please check your token permissions.',
        solution: 'Go to Hygraph Settings > API Access and ensure your token has query permissions'
      }, { status: 403 })
    }

    // 3. Create businesses
    console.log('🏗️ Creating businesses...')
    
    for (const business of sampleBusinesses) {
      try {
        const categoryId = categoryMap[business.categoryName]
        if (!categoryId) {
          console.warn(`⚠️ Category ${business.categoryName} not found, skipping ${business.name}`)
          results.errors.push({
            type: 'category_not_found',
            business: business.name,
            category: business.categoryName,
            error: `Category ${business.categoryName} not found`
          })
          continue
        }

        const createMutation = gql`
          mutation CreateBusiness(
            $name: String!
            $about: RichTextAST!
            $address: String!
            $contactPerson: String!
            $email: String!
            $categoryId: ID!
          ) {
            createBusinessList(data: {
              name: $name
              about: $about
              address: $address
              contactPerson: $contactPerson
              email: $email
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
          about: {
            raw: {
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      text: business.about
                    }
                  ]
                }
              ]
            }
          },
          address: business.address,
          contactPerson: business.contactPerson,
          email: business.email,
          categoryId
        }
        
        const result = await contentRequest(createMutation, variables)
        console.log(`✅ Created business: ${business.name}`)
        
        // Publish the business
        const publishMutation = gql`
          mutation PublishBusiness($id: ID!) {
            publishBusinessList(where: { id: $id }) {
              id
            }
          }
        `
        
        await contentRequest(publishMutation, { id: result.createBusinessList.id })
        console.log(`📢 Published business: ${business.name}`)
        
        results.businesses.push(result.createBusinessList)
        
      } catch (error) {
        console.error(`❌ Failed to create business ${business.name}:`, error.message)
        results.errors.push({
          type: 'business_creation',
          business: business.name,
          error: error.message,
          details: error.response?.errors
        })
      }
    }

    const summary = {
      businessesCreated: results.businesses.length,
      errorsCount: results.errors.length,
      categoriesFound: Object.keys(categoryMap).length
    }

    console.log('🎉 Business creation completed!')
    console.log('📊 Summary:', summary)

    return NextResponse.json({
      success: true,
      message: `Successfully created ${summary.businessesCreated} businesses!`,
      summary,
      results,
      nextSteps: [
        'Check your Hygraph dashboard to see the created businesses',
        'Test your application at http://localhost:3000',
        'Categories should now show businesses when clicked',
        'Business detail pages should work'
      ],
      troubleshooting: summary.errorsCount > 0 ? {
        message: 'Some businesses failed to create',
        errors: results.errors,
        suggestion: 'Check the errors array for details'
      } : null
    })

  } catch (error) {
    console.error('❌ Business creation failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Business creation failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Check current status
    const categoriesQuery = gql`
      query GetCategories {
        categories {
          id
          name
        }
      }
    `
    
    const businessesQuery = gql`
      query GetBusinesses {
        businessLists {
          id
          name
          category {
            name
          }
        }
      }
    `
    
    const categoriesResult = await contentRequest(categoriesQuery)
    const businessesResult = await contentRequest(businessesQuery)
    
    return NextResponse.json({
      success: true,
      message: 'Current status',
      data: {
        categories: categoriesResult.categories || [],
        businesses: businessesResult.businessLists || [],
        summary: {
          categoriesCount: (categoriesResult.categories || []).length,
          businessesCount: (businessesResult.businessLists || []).length
        }
      },
      ready: (categoriesResult.categories || []).length > 0,
      instructions: (categoriesResult.categories || []).length === 0 ? [
        'Categories not found. Please:',
        '1. Go to Hygraph dashboard',
        '2. Publish all categories in Content > Category',
        '3. Then run POST /api/create-businesses'
      ] : [
        'Categories found! Ready to create businesses.',
        'Run: POST /api/create-businesses'
      ]
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Status check failed',
      details: error.message
    }, { status: 500 })
  }
} 