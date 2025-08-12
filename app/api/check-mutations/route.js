import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 Checking available mutations in Management API...')
    
    const MANAGEMENT_URL = `https://management-eu-west-2.hygraph.com/graphql`
    const MANAGEMENT_TOKEN = process.env.HYGRAPH_MANAGEMENT_TOKEN

    if (!MANAGEMENT_TOKEN) {
      return NextResponse.json({ 
        error: 'HYGRAPH_MANAGEMENT_TOKEN not found in environment variables' 
      }, { status: 500 })
    }

    // Query to get all available mutations
    const query = `
      query {
        __schema {
          mutationType {
            fields {
              name
              description
              args {
                name
                type {
                  name
                  kind
                }
              }
            }
          }
        }
      }
    `

    console.log('Making request to Management API...')
    
    const response = await fetch(MANAGEMENT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MANAGEMENT_TOKEN}`
      },
      body: JSON.stringify({ query })
    })

    const result = await response.json()
    
    if (result.errors) {
      return NextResponse.json({ 
        error: 'Management API Error',
        details: result.errors,
        message: result.errors[0]?.message || 'Unknown error'
      }, { status: 500 })
    }
    
    // Filter mutations that might be related to our models
    const allMutations = result.data.__schema.mutationType.fields
    const categoryMutations = allMutations.filter(field => 
      field.name.toLowerCase().includes('category')
    )
    const businessMutations = allMutations.filter(field => 
      field.name.toLowerCase().includes('business')
    )
    const contentMutations = allMutations.filter(field => 
      field.name.includes('create') || field.name.includes('publish') || field.name.includes('update')
    )
    
    return NextResponse.json({ 
      success: true,
      message: 'Available mutations retrieved',
      data: {
        totalMutations: allMutations.length,
        categoryMutations: categoryMutations,
        businessMutations: businessMutations,
        contentMutations: contentMutations.slice(0, 20), // First 20 to avoid overwhelming
        allMutationNames: allMutations.map(m => m.name).sort()
      }
    })

  } catch (error) {
    console.error('❌ Check mutations failed:', error)
    return NextResponse.json({
      error: 'Failed to check mutations',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
} 