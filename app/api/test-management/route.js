import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 Testing Management API connection...')
    
    const MANAGEMENT_URL = `https://management-eu-west-2.hygraph.com/graphql`
    const MANAGEMENT_TOKEN = process.env.HYGRAPH_MANAGEMENT_TOKEN

    if (!MANAGEMENT_TOKEN) {
      return NextResponse.json({ 
        error: 'HYGRAPH_MANAGEMENT_TOKEN not found in environment variables' 
      }, { status: 500 })
    }

    // Get the createModel mutation details
    const query = `
      query {
        __schema {
          mutationType {
            fields {
              name
              args {
                name
                type {
                  name
                  kind
                  inputFields {
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
    
    // Find the createModel mutation
    const createModelMutation = result.data.__schema.mutationType.fields.find(
      field => field.name === 'createModel'
    )
    
    return NextResponse.json({ 
      success: true,
      message: 'createModel mutation details retrieved',
      createModelMutation: createModelMutation
    })

  } catch (error) {
    console.error('Management API Error:', error)
    
    return NextResponse.json({ 
      error: 'Management API connection failed',
      message: error.message
    }, { status: 500 })
  }
} 