import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/mongodb'
import TinRegistry from '@/models/TinRegistry'

/**
 * TIN Lookup API Endpoint
 * 
 * This endpoint simulates connection to Ghana Revenue Authority's TIN database
 * for business auto-fill functionality during provider registration.
 * 
 * @route POST /api/verification/tin/lookup
 * @access Protected (requires authentication)
 */
export async function POST(request) {
  try {
    console.log('🔍 TIN lookup request received')

    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.log('❌ Unauthorized TIN lookup attempt')
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    // Connect to database
    await connectDB()

    // Parse request body
    const body = await request.json()
    const { tinNumber, validateOnly = false } = body

    console.log(`📋 Processing TIN lookup: ${tinNumber}`)

    // Validate TIN format
    const formatValidation = TinRegistry.validateTinFormat(tinNumber)
    if (!formatValidation.isValid) {
      console.log(`❌ Invalid TIN format: ${tinNumber}`)
      return NextResponse.json({
        success: false,
        error: formatValidation.error,
        code: 'INVALID_FORMAT'
      }, { status: 400 })
    }

    // If only validation requested, return early
    if (validateOnly) {
      return NextResponse.json({
        success: true,
        message: 'TIN format is valid',
        isValid: true
      })
    }

    // Lookup TIN in mock database
    const tinRecord = await TinRegistry.findActiveTin(tinNumber)

    if (!tinRecord) {
      console.log(`⚠️ TIN not found in registry: ${tinNumber}`)
      return NextResponse.json({
        success: false,
        message: 'TIN not found in Ghana Revenue Authority database',
        code: 'TIN_NOT_FOUND',
        suggestions: [
          'Verify the TIN number is correct',
          'Check if the business is currently registered',
          'Contact Ghana Revenue Authority for assistance'
        ]
      }, { status: 404 })
    }

    // Check if TIN is expired
    if (tinRecord.isExpired()) {
      console.log(`⚠️ TIN is expired: ${tinNumber}`)
      return NextResponse.json({
        success: false,
        message: 'TIN registration has expired',
        code: 'TIN_EXPIRED',
        expiryDate: tinRecord.registrationInfo.expiryDate,
        suggestions: [
          'Renew your TIN registration with Ghana Revenue Authority',
          'Contact GRA for renewal procedures'
        ]
      }, { status: 410 })
    }

    // Get business data for auto-fill
    const businessData = tinRecord.getBusinessData()

    console.log(`✅ TIN lookup successful: ${businessData.businessName}`)

    // Return successful response with business data
    return NextResponse.json({
      success: true,
      message: 'Business information retrieved successfully',
      businessData: {
        // Business Information
        businessName: businessData.businessName,
        businessType: businessData.businessType,
        registrationYear: businessData.registrationYear,
        category: businessData.category,
        description: businessData.description,
        
        // Owner Information
        ownerName: businessData.ownerName,
        email: businessData.email,
        phone: businessData.phone,
        ghanaCardNumber: businessData.ghanaCardNumber,
        
        // Address Information
        address: {
          street: businessData.address.street,
          city: businessData.address.city,
          region: businessData.address.region,
          digitalAddress: businessData.address.digitalAddress,
          coordinates: businessData.address.coordinates
        },
        
        // Registration Information
        tinNumber: businessData.tinNumber,
        isActive: businessData.isActive,
        expiryDate: businessData.expiryDate,
        
        // Metadata
        retrievedAt: new Date().toISOString(),
        source: 'Ghana Revenue Authority (Simulated)'
      }
    })

  } catch (error) {
    console.error('❌ TIN lookup error:', error)
    
    // Return appropriate error based on error type
    if (error.name === 'ValidationError') {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.message
      }, { status: 400 })
    }

    if (error.name === 'MongoError' || error.name === 'MongooseError') {
      return NextResponse.json({
        success: false,
        error: 'Database service temporarily unavailable'
      }, { status: 503 })
    }

    return NextResponse.json({
      success: false,
      error: 'TIN lookup service temporarily unavailable',
      code: 'SERVICE_ERROR'
    }, { status: 500 })
  }
}

/**
 * Get TIN validation rules
 * 
 * @route GET /api/verification/tin/lookup
 * @access Public
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      validationRules: {
        format: 'TIN-YYYY-NNNNNN',
        description: 'Ghana Revenue Authority TIN format',
        example: 'TIN-2024-000001',
        yearRange: {
          min: 2010,
          max: new Date().getFullYear()
        },
        sequenceRange: {
          min: 1,
          max: 999999
        }
      },
      supportedBusinessTypes: [
        'SOLE_PROPRIETORSHIP',
        'PARTNERSHIP', 
        'LIMITED_COMPANY',
        'NGO'
      ],
      supportedRegions: [
        'Greater Accra', 'Ashanti', 'Northern', 'Western', 
        'Eastern', 'Central', 'Volta', 'Upper East', 
        'Upper West', 'Brong-Ahafo', 'Western North', 
        'Ahafo', 'Bono', 'Bono East', 'Oti', 'Savannah', 'North East'
      ]
    })
  } catch (error) {
    console.error('❌ Error getting TIN validation rules:', error)
    return NextResponse.json({
      success: false,
      error: 'Unable to retrieve validation rules'
    }, { status: 500 })
  }
}




