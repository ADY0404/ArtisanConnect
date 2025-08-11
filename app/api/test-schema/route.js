import { NextResponse } from 'next/server'
import { gql, request } from 'graphql-request'

export async function GET() {
  try {
    console.log('🔍 Testing Hygraph schema...')
    
    const MASTER_URL = `https://eu-west-2.cdn.hygraph.com/content/${process.env.NEXT_PUBLIC_MASTER_URL_KEY}/master`
    
    // Test basic introspection to see what types are available
    const introspectionQuery = gql`
      query {
        __schema {
          queryType {
            fields {
              name
              type {
                name
              }
            }
          }
        }
      }
    `
    
    const result = await request(MASTER_URL, introspectionQuery)
    
    // Filter for our models
    const fields = result.__schema.queryType.fields
    const categoryFields = fields.filter(field => 
      field.name.toLowerCase().includes('categor')
    )
    const businessFields = fields.filter(field => 
      field.name.toLowerCase().includes('business')
    )
    
    console.log('Available fields:', fields.map(f => f.name))
    console.log('Category fields:', categoryFields)
    console.log('Business fields:', businessFields)
    
    return NextResponse.json({
      success: true,
      message: 'Schema introspection successful',
      data: {
        totalFields: fields.length,
        categoryFields: categoryFields,
        businessFields: businessFields,
        allFields: fields.map(f => f.name)
      }
    })

  } catch (error) {
    console.error('❌ Schema test failed:', error)
    return NextResponse.json({
      error: 'Schema test failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
} 