import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 Testing Hygraph Management SDK import...')
    
    // Test if the package exists
    try {
      const sdk = await import('@hygraph/management-sdk')
      console.log('✅ SDK imported successfully')
      console.log('📦 Available exports:', Object.keys(sdk))
      
      // Check what's in the SDK
      console.log('🔍 SDK structure:')
      for (const [key, value] of Object.entries(sdk)) {
        console.log(`  - ${key}:`, typeof value)
        if (key === 'FieldType' && value) {
          console.log('    FieldType properties:', Object.keys(value))
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'SDK import successful',
        exports: Object.keys(sdk),
        sdkStructure: Object.fromEntries(
          Object.entries(sdk).map(([key, value]) => [
            key, 
            typeof value === 'object' && value !== null ? Object.keys(value) : typeof value
          ])
        )
      })
      
    } catch (importError) {
      console.error('❌ SDK import failed:', importError)
      return NextResponse.json({
        success: false,
        error: 'SDK import failed',
        message: importError.message,
        stack: importError.stack
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return NextResponse.json({
      error: 'Test failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
} 