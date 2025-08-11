import { NextResponse } from 'next/server'
import { User } from '@/models/User'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(request) {
  try {
    const adminEmail = 'admin@homeservice.com'
    
    // Check if admin user exists
    const adminUser = await User.findByEmail(adminEmail)
    
    if (adminUser) {
      return NextResponse.json({
        success: true,
        adminExists: true,
        user: {
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
          isActive: adminUser.isActive,
          createdAt: adminUser.createdAt
        }
      })
    } else {
      return NextResponse.json({
        success: true,
        adminExists: false,
        message: 'Admin user not found'
      })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { action, ...params } = await request.json()
    
    console.log(`🔧 Debug Admin API called with action: ${action}`)
    
    const { db } = await connectToDatabase()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    switch (action) {
      case 'check_provider_business':
        return await checkProviderBusiness(db, params)
      
      case 'fix_provider_business':
        return await fixProviderBusiness(db, params)
        
      case 'create_provider_business':
        return await createProviderBusiness(db, params)
        
      case 'list_all_businesses':
        return await listAllBusinesses(db, params)
        
      case 'check_messages':
        return await checkMessages(db, params)
        
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
    
  } catch (error) {
    console.error('❌ Debug Admin API error:', error)
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}

async function checkProviderBusiness(db, { providerEmail, businessId }) {
  console.log(`🔍 Checking provider-business association: ${providerEmail} -> ${businessId}`)
  
  // 1. Find the business
  const business = await db.collection('businesslists').findOne({
    _id: new ObjectId(businessId)
  })
  
  // 2. Find provider businesses
  const providerBusinesses = await db.collection('businesslists').find({
    $or: [
      { email: providerEmail },
      { contactPerson: providerEmail },
      { 'contactInfo.email': providerEmail }
    ]
  }).toArray()
  
  // 3. Check messages for this conversation
  const messages = await db.collection('chatmessages').find({
    bookingId: `dm_${businessId}_${providerEmail.replace(/[^a-zA-Z0-9]/g, '_')}`
  }).toArray()
  
  return NextResponse.json({
    business: business ? {
      _id: business._id,
      name: business.name,
      email: business.email,
      contactPerson: business.contactPerson
    } : null,
    providerBusinesses: providerBusinesses.map(b => ({
      _id: b._id,
      name: b.name,
      email: b.email
    })),
    messages: messages.length,
    isAssociated: providerBusinesses.some(b => b._id.toString() === businessId)
  })
}

async function fixProviderBusiness(db, { providerEmail, businessId }) {
  console.log(`🔧 Fixing provider-business association: ${providerEmail} -> ${businessId}`)
  
  // Update the business to associate it with the provider
  const result = await db.collection('businesslists').updateOne(
    { _id: new ObjectId(businessId) },
    { 
      $set: { 
        email: providerEmail,
        contactPerson: providerEmail,
        updatedAt: new Date()
      }
    }
  )
  
  return NextResponse.json({
    success: result.modifiedCount > 0,
    modifiedCount: result.modifiedCount
  })
}

async function createProviderBusiness(db, { providerEmail }) {
  console.log(`🏢 Creating business for provider: ${providerEmail}`)
  
  // Create a new business for this provider
  const newBusiness = {
    name: "Provider Services",
    contactPerson: providerEmail,
    email: providerEmail,
    phone: "+1 (555) 123-4567",
    address: "123 Service Street, Provider City",
    category: {
      name: "General Services",
      color: "#3B82F6",
      icon: "🔧"
    },
    images: [],
    about: "Professional service provider",
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  const result = await db.collection('businesslists').insertOne(newBusiness)
  
  return NextResponse.json({
    success: !!result.insertedId,
    businessId: result.insertedId,
    business: newBusiness
  })
}

async function listAllBusinesses(db, params) {
  const businesses = await db.collection('businesslists').find({}).limit(10).toArray()
  
  return NextResponse.json({
    businesses: businesses.map(b => ({
      _id: b._id,
      name: b.name,
      email: b.email,
      contactPerson: b.contactPerson
    }))
  })
}

async function checkMessages(db, { bookingId }) {
  const messages = await db.collection('chatmessages').find({
    bookingId: bookingId
  }).toArray()
  
  return NextResponse.json({
    bookingId,
    messageCount: messages.length,
    messages: messages.map(m => ({
      _id: m._id,
      senderId: m.senderId,
      senderEmail: m.senderEmail,
      message: m.message?.substring(0, 100),
      timestamp: m.timestamp
    }))
  })
}
