import { NextResponse } from 'next/server'
import { Database } from '@/lib/database'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('userEmail')
    
    const collection = await Database.getCollection('bookings')
    
    // Get all bookings if no user email specified
    const query = userEmail ? { userEmail } : {}
    const bookings = await collection.find(query).toArray()
    
    console.log(`🔍 Debug: Found ${bookings.length} bookings in database`)
    
    // Get collections info
    const db = await Database.getDb()
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map(c => c.name)
    
    // Get businesses count and sample
    let businessCount = 0
    let sampleBusinesses = []
    try {
      const businessCollection = await Database.getCollection('businesslists')
      businessCount = await businessCollection.countDocuments()
      sampleBusinesses = await businessCollection.find({}).limit(3).toArray()
    } catch (e) {
      console.log('Business lists collection not found or empty')
    }
    
    // Get categories count
    let categoryCount = 0
    try {
      const categoryCollection = await Database.getCollection('categories')
      categoryCount = await categoryCollection.countDocuments()
    } catch (e) {
      console.log('Categories collection not found or empty')
    }
    
    // Detailed business ID analysis
    const businessIdAnalysis = bookings.map(booking => ({
      bookingId: booking._id.toString(),
      businessId: booking.businessId,
      businessIdType: typeof booking.businessId,
      businessIdString: booking.businessId?.toString(),
      isObjectId: booking.businessId?.constructor?.name === 'ObjectId',
      userEmail: booking.userEmail
    }))
    
    // Try to manually lookup businesses for each booking
    const businessLookups = []
    for (const booking of bookings) {
      try {
        const businessCollection = await Database.getCollection('businesslists')
        let business = null
        
        // Try multiple lookup strategies
        try {
          // Try as ObjectId
          const { ObjectId } = await import('mongodb')
          business = await businessCollection.findOne({ _id: new ObjectId(booking.businessId) })
        } catch (e) {
          // Try as string
          business = await businessCollection.findOne({ _id: booking.businessId })
        }
        
        if (!business) {
          // Try string comparison
          business = await businessCollection.findOne({ 
            $or: [
              { _id: booking.businessId },
              { _id: booking.businessId?.toString() }
            ]
          })
        }
        
        businessLookups.push({
          bookingId: booking._id.toString(),
          businessId: booking.businessId,
          businessFound: !!business,
          businessName: business?.name || 'Not found',
          businessEmail: business?.email || 'N/A'
        })
      } catch (e) {
        businessLookups.push({
          bookingId: booking._id.toString(),
          businessId: booking.businessId,
          businessFound: false,
          error: e.message
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      debug: {
        totalBookings: bookings.length,
        userSpecific: !!userEmail,
        collections: collectionNames,
        businessCount,
        categoryCount,
        sampleBooking: bookings[0] || null,
        sampleBusinesses: sampleBusinesses.map(b => ({
          id: b._id.toString(),
          name: b.name,
          email: b.email,
          contactPerson: b.contactPerson
        })),
        businessIdAnalysis,
        businessLookups,
        allBookings: bookings.map(b => ({
          id: b._id.toString(),
          userEmail: b.userEmail,
          userName: b.userName,
          date: b.date,
          time: b.time,
          status: b.status,
          businessId: b.businessId?.toString(),
          businessIdType: typeof b.businessId,
          createdAt: b.createdAt
        }))
      }
    })
  } catch (error) {
    console.error('❌ Debug API Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { action, userEmail } = body
    
    if (action === 'create_test_booking' && userEmail) {
      const { Booking } = await import('@/models/Booking')
      
      // First, make sure we have at least one business in the database
      const businessCollection = await Database.getCollection('businesslists')
      let testBusiness = await businessCollection.findOne({})
      
      if (!testBusiness) {
        // Create a test business first
        const { ObjectId } = await import('mongodb')
        const categoryCollection = await Database.getCollection('categories')
        let testCategory = await categoryCollection.findOne({})
        
        if (!testCategory) {
          // Create a test category
          const categoryResult = await categoryCollection.insertOne({
            name: 'General Services',
            backgroundColor: '#3B82F6',
            icon: '🔧',
            createdAt: new Date()
          })
          testCategory = { _id: categoryResult.insertedId, name: 'General Services' }
        }
        
        const businessResult = await businessCollection.insertOne({
          name: 'Test Service Provider',
          about: 'Professional test service provider',
          address: '123 Test Street, Test City',
          contactPerson: 'John Doe',
          email: 'test@provider.com',
          phone: '+1234567890',
          images: ['/placeholder-business.jpg'],
          categoryId: testCategory._id,
          providerEmail: 'test@provider.com',
          createdBy: 'test@provider.com',
          approvalStatus: 'APPROVED',
          isActive: true,
          isPublic: true,
          rating: 4.5,
          totalReviews: 10,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        
        testBusiness = { _id: businessResult.insertedId }
      }
      
      const testBooking = {
        businessId: testBusiness._id.toString(), // Ensure it's a string
        userEmail: userEmail,
        userName: userEmail.split('@')[0],
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        time: '10:00 AM',
        serviceDetails: 'Test booking created via debug API',
        totalAmount: 100,
        status: 'CONFIRMED'
      }
      
      console.log('🧪 Creating test booking:', testBooking)
      
      const result = await Booking.create(testBooking)
      
      return NextResponse.json({
        success: true,
        message: 'Test booking created',
        bookingId: result.bookingId.toString(),
        businessId: testBusiness._id.toString()
      })
    }
    
    if (action === 'fix_existing_bookings') {
      // Fix existing bookings that might have invalid business IDs
      const { Booking } = await import('@/models/Booking')
      const { ObjectId } = await import('mongodb')
      
      const bookingCollection = await Database.getCollection('bookings')
      const businessCollection = await Database.getCollection('businesslists')
      
      // Get all bookings
      const bookings = await bookingCollection.find({}).toArray()
      let fixedCount = 0
      
      for (const booking of bookings) {
        // Check if business exists
        let business = null
        try {
          business = await businessCollection.findOne({ _id: new ObjectId(booking.businessId) })
        } catch (e) {
          // Invalid ObjectId format
        }
        
        if (!business) {
          // Try to find any business to link to
          const anyBusiness = await businessCollection.findOne({})
          if (anyBusiness) {
            await bookingCollection.updateOne(
              { _id: booking._id },
              { 
                $set: { 
                  businessId: anyBusiness._id,
                  updatedAt: new Date()
                } 
              }
            )
            fixedCount++
          }
        }
      }
      
      return NextResponse.json({
        success: true,
        message: `Fixed ${fixedCount} bookings`,
        fixedCount
      })
    }
    
    if (action === 'seed_sample_data') {
      // Create sample businesses and categories
      const categoryCollection = await Database.getCollection('categories')
      const businessCollection = await Database.getCollection('businesslists')
      
      // Clear existing data
      await categoryCollection.deleteMany({})
      await businessCollection.deleteMany({})
      
      // Create categories
      const categories = [
        { name: 'Cleaning', backgroundColor: '#3B82F6', icon: '🧹' },
        { name: 'Plumbing', backgroundColor: '#10B981', icon: '🔧' },
        { name: 'Electrical', backgroundColor: '#F59E0B', icon: '⚡' },
        { name: 'Painting', backgroundColor: '#EF4444', icon: '🎨' },
        { name: 'Repair', backgroundColor: '#8B5CF6', icon: '🔨' }
      ]
      
      const createdCategories = await categoryCollection.insertMany(
        categories.map(cat => ({ ...cat, createdAt: new Date() }))
      )
      
      // Create businesses
      const businesses = [
        {
          name: 'Clean Pro Services',
          about: 'Professional cleaning services for homes and offices',
          address: '123 Main St, City Center',
          contactPerson: 'Sarah Johnson',
          email: 'sarah@cleanpro.com',
          phone: '+1234567890',
          images: ['/placeholder-business.jpg'],
          categoryId: createdCategories.insertedIds[0]
        },
        {
          name: 'Fix It Fast',
          about: 'Quick and reliable repair services',
          address: '456 Oak Ave, Downtown',
          contactPerson: 'Mike Wilson',
          email: 'mike@fixitfast.com',
          phone: '+1234567891',
          images: ['/placeholder-business.jpg'],
          categoryId: createdCategories.insertedIds[1]
        }
      ]
      
      const createdBusinesses = await businessCollection.insertMany(
        businesses.map(biz => ({
          ...biz,
          providerEmail: biz.email,
          createdBy: biz.email,
          approvalStatus: 'APPROVED',
          isActive: true,
          isPublic: true,
          rating: 4.5,
          totalReviews: 5,
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      )
      
      return NextResponse.json({
        success: true,
        message: 'Sample data created',
        categoriesCreated: Object.keys(createdCategories.insertedIds).length,
        businessesCreated: Object.keys(createdBusinesses.insertedIds).length
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action or missing userEmail'
    }, { status: 400 })
    
  } catch (error) {
    console.error('❌ Debug POST Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 