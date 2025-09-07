import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 Debugging environment and SDK...')
    
    const debugInfo = {
      environment: {
        HYGRAPH_MANAGEMENT_TOKEN: process.env.HYGRAPH_MANAGEMENT_TOKEN ? 'Present' : 'Missing',
        NEXT_PUBLIC_MASTER_URL_KEY: process.env.NEXT_PUBLIC_MASTER_URL_KEY ? 'Present' : 'Missing',
        NODE_ENV: process.env.NODE_ENV
      },
      urls: {
        contentAPI: `https://eu-west-2.cdn.hygraph.com/content/${process.env.NEXT_PUBLIC_MASTER_URL_KEY}/master`,
        managementAPI: `https://management-eu-west-2.hygraph.com/graphql`
      }
    }
    
    console.log('Environment check:', debugInfo.environment)
    
    // Test SDK import
    try {
      const sdk = await import('@hygraph/management-sdk')
      debugInfo.sdk = {
        imported: true,
        exports: Object.keys(sdk),
        hasClient: !!sdk.Client,
        clientType: typeof sdk.Client
      }
      console.log('✅ SDK imported successfully')
      
      // Try to create a client instance
      try {
        const client = new sdk.Client({
          endpoint: debugInfo.urls.contentAPI,
          authToken: process.env.HYGRAPH_MANAGEMENT_TOKEN,
          name: 'debug-test'
        })
        debugInfo.client = {
          created: true,
          type: typeof client
        }
        console.log('✅ Client created successfully')
      } catch (clientError) {
        debugInfo.client = {
          created: false,
          error: clientError.message
        }
        console.error('❌ Client creation failed:', clientError.message)
      }
      
    } catch (sdkError) {
      debugInfo.sdk = {
        imported: false,
        error: sdkError.message
      }
      console.error('❌ SDK import failed:', sdkError.message)
    }
    
    return NextResponse.json({
      success: true,
      debugInfo,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
} 