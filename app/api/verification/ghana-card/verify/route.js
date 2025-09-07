import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/mongodb'
import GhanaCardRegistry from '@/models/GhanaCardRegistry'

/**
 * Ghana Card Verification API Endpoint
 * 
 * This endpoint simulates connection to National Identification Authority (NIA)
 * database for Ghana Card verification during provider registration.
 * 
 * @route POST /api/verification/ghana-card/verify
 * @access Protected (requires authentication)
 */
export async function POST(request) {
  try {
    console.log('🆔 Ghana Card verification request received')

    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.log('❌ Unauthorized Ghana Card verification attempt')
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    // Connect to database
    await connectDB()

    // Parse request body
    const body = await request.json()
    const { 
      cardNumber, 
      method = 'manual',
      validateOnly = false,
      crossCheckTin = null,
      userAgent = 'Unknown',
      extractedName = null
    } = body

    console.log(`📋 Processing Ghana Card verification: ${cardNumber} (method: ${method})`)

    // Validate Ghana Card format and check digit
    const formatValidation = GhanaCardRegistry.validateCardNumber(cardNumber)
    if (!formatValidation.isValid) {
      console.log(`❌ Invalid Ghana Card format: ${cardNumber}`)
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
        message: 'Ghana Card format is valid',
        isValid: true
      })
    }

    // Lookup Ghana Card in mock database
    const cardRecord = await GhanaCardRegistry.findActiveCard(cardNumber)

    if (!cardRecord) {
      console.log(`⚠️ Ghana Card not found: ${cardNumber}`)
      
      // Get sample data to show what's available
      const sampleCards = await GhanaCardRegistry.find({}, 'cardNumber personalInfo.fullName').limit(5)
      const sampleNumbers = sampleCards.map(card => card.cardNumber).join(', ')
      const totalCards = await GhanaCardRegistry.countDocuments()
      
      return NextResponse.json({
        success: false,
        message: 'Ghana Card verification failed',
        code: 'CARD_NOT_FOUND',
        details: {
          extractedCardNumber: cardNumber,
          extractedName: extractedName || 'Not provided',
          reason: 'The Ghana Card number was not found in our test database',
          databaseInfo: {
            totalCardsInDatabase: totalCards,
            sampleCardNumbers: sampleNumbers,
            note: 'This is a mock/test database for demonstration purposes'
          }
        },
        suggestions: [
          'The extracted Ghana Card number appears to be from a real Ghana Card (not test data)',
          'Our system contains only mock/test data for demonstration',
          'For production use, this would connect to the real Ghana Card database',
          'Try using one of our test Ghana Card numbers for demonstration'
        ],
        testData: {
          availableCardNumbers: sampleNumbers,
          note: 'Use these test numbers to verify the system works correctly'
        }
      }, { status: 404 })
    }

    // Check if card is expired or inactive
    if (!cardRecord.isActive()) {
      const reason = cardRecord.isExpired() ? 'expired' : 'inactive'
      console.log(`⚠️ Ghana Card is ${reason}: ${cardNumber}`)
      return NextResponse.json({
        success: false,
        message: `Ghana Card is ${reason}`,
        code: reason.toUpperCase(),
        cardStatus: cardRecord.identificationInfo.cardStatus,
        expiryDate: cardRecord.identificationInfo.cardExpiryDate,
        suggestions: [
          reason === 'expired' 
            ? 'Renew your Ghana Card at the nearest NIA office'
            : 'Contact NIA to resolve card status issues'
        ]
      }, { status: 410 })
    }

    // Normalize method to match enum ['MANUAL','BIOMETRIC','OCR','API']
    const normalizedMethod = (method || 'manual').toUpperCase().includes('OCR')
      ? 'OCR'
      : (method || 'manual').toUpperCase()

    // Record verification attempt with security info
    await cardRecord.recordVerification(normalizedMethod, 'Business registration verification')
    await cardRecord.recordAccess({
      method: 'VERIFICATION_API',
      ipAddress: request.headers.get('x-forwarded-for') || 'Unknown',
      userAgent
    })

    // Get card data for response
    const cardData = cardRecord.getCardData()

    // Cross-check with TIN data if provided
    let crossCheckResult = null
    if (crossCheckTin) {
      try {
        const TinRegistry = (await import('@/models/TinRegistry')).default
        const tinRecord = await TinRegistry.findActiveTin(crossCheckTin)
        
        if (tinRecord && tinRecord.ownerInfo.ghanaCardNumber === cardNumber) {
          crossCheckResult = {
            match: true,
            tinBusinessName: tinRecord.businessName,
            message: 'Ghana Card matches TIN registry record'
          }
          console.log(`✅ Cross-check successful: Ghana Card matches TIN ${crossCheckTin}`)
        } else {
          crossCheckResult = {
            match: false,
            message: 'Ghana Card does not match TIN registry record',
            warning: 'Please verify the correct Ghana Card is being used'
          }
          console.log(`⚠️ Cross-check warning: Ghana Card does not match TIN ${crossCheckTin}`)
        }
      } catch (error) {
        console.log(`⚠️ Cross-check failed: ${error.message}`)
        crossCheckResult = {
          match: false,
          message: 'Unable to perform cross-check verification',
          error: 'TIN lookup service unavailable'
        }
      }
    }

    console.log(`✅ Ghana Card verification successful: ${cardData.fullName}`)

    // Return successful response with card data
    return NextResponse.json({
      success: true,
      message: 'Ghana Card verified successfully',
      cardData: {
        // Card Information
        cardNumber: cardData.cardNumber,
        status: cardData.status,
        issuedDate: cardData.issuedDate,
        expiryDate: cardData.expiryDate,
        issuingCenter: cardData.issuingCenter,
        
        // Personal Information
        fullName: cardData.fullName,
        firstName: cardData.firstName,
        middleName: cardData.middleName,
        lastName: cardData.lastName,
        dateOfBirth: cardData.dateOfBirth,
        placeOfBirth: cardData.placeOfBirth,
        gender: cardData.gender,
        nationality: cardData.nationality,
        
        // Contact Information
        address: cardData.address,
        phoneNumber: cardData.phoneNumber,
        
        // Verification Information
        isVerified: cardData.isVerified,
        lastVerificationDate: cardData.lastVerificationDate,
        verificationMethod: method.toUpperCase(),
        
        // Metadata
        verifiedAt: new Date().toISOString(),
        source: 'National Identification Authority (Simulated)'
      },
      
      // Cross-check results if performed
      ...(crossCheckResult && { crossCheck: crossCheckResult }),
      
      // Security and audit information
      verification: {
        method: normalizedMethod,
        timestamp: new Date().toISOString(),
        sessionUser: session.user.email,
        verificationId: `VER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    })

  } catch (error) {
    console.error('❌ Ghana Card verification error:', error)
    
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
      error: 'Ghana Card verification service temporarily unavailable',
      code: 'SERVICE_ERROR'
    }, { status: 500 })
  }
}

/**
 * Get Ghana Card validation rules and format information
 * 
 * @route GET /api/verification/ghana-card/verify
 * @access Public
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      validationRules: {
        format: 'GHA-NNNNNNNNN-N',
        description: 'Ghana National Identification Authority card format',
        example: 'GHA-123456789-1',
        components: {
          prefix: 'GHA (Country code)',
          mainNumber: '9-digit unique identifier',
          checkDigit: 'Single digit checksum'
        }
      },
      supportedMethods: [
        'manual',
        'ocr'
      ],
      supportedRegions: [
        'Greater Accra', 'Ashanti', 'Northern', 'Western', 
        'Eastern', 'Central', 'Volta', 'Upper East', 
        'Upper West', 'Brong-Ahafo', 'Western North', 
        'Ahafo', 'Bono', 'Bono East', 'Oti', 'Savannah', 'North East'
      ],
      cardStatuses: [
        'ACTIVE',
        'EXPIRED', 
        'SUSPENDED',
        'REVOKED',
        'REPLACED'
      ],
      securityFeatures: {
        checkDigitValidation: true,
        biometricVerification: true,
        auditTrail: true,
        crossReferenceCheck: true
      }
    })
  } catch (error) {
    console.error('❌ Error getting Ghana Card validation rules:', error)
    return NextResponse.json({
      success: false,
      error: 'Unable to retrieve validation rules'
    }, { status: 500 })
  }
}




