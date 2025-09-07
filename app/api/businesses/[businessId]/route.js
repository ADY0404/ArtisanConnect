import { NextResponse } from 'next/server'
import BusinessList from '@/models/BusinessList'
import Category from '@/models/Category'
import { ensureConnection } from '@/lib/mongodb'
import { connectToDatabase } from '@/lib/mongodb'

export async function GET(request, { params }) {
  try {
    // Connect to database using Mongoose
    await ensureConnection()
    
    const { businessId } = params
    console.log(`🔍 Fetching business with ID: ${businessId}`)
    
    // Use Mongoose findById first, then manually get category
    const business = await BusinessList.findById(businessId)
    
    if (!business) {
      return NextResponse.json({
        success: false,
        error: 'Business not found'
      }, { status: 404 })
    }
    
    console.log(`📋 Business found: ${business.name}`)
    console.log(`👤 Provider Email: ${business.providerEmail}`)
    
    // Get category information separately
    let category = null
    try {
      category = await Category.findById(business.categoryId)
    } catch (error) {
      console.error('❌ Error fetching category:', error)
    }

    // Get portfolio data from portfolioItems collection
    let portfolioItems = []
    try {
      const { db } = await connectToDatabase()
      
      // First, find the user by email to get their ObjectId
      const user = await db.collection('users').findOne({ email: business.providerEmail })
      console.log(`👤 User found:`, user ? { id: user._id, email: user.email } : 'No user found')
      
      if (user) {
        // Search using the user's ObjectId
        const userObjectId = user._id.toString()
        console.log(`🔍 Searching with user ObjectId: ${userObjectId}`)
        
        portfolioItems = await db.collection('portfolioItems')
          .find({ 
            providerId: userObjectId,
            isPublic: true 
          })
          .sort({ createdAt: -1 })
          .toArray()
          
        console.log(`✅ Found ${portfolioItems.length} portfolio items using ObjectId`)
      }
      
      // If no items found with ObjectId, try with email as fallback
      if (portfolioItems.length === 0) {
        console.log(`🔍 Fallback: Searching with email: ${business.providerEmail}`)
        portfolioItems = await db.collection('portfolioItems')
          .find({ 
            providerId: business.providerEmail,
            isPublic: true 
          })
          .sort({ createdAt: -1 })
          .toArray()
          
        console.log(`✅ Found ${portfolioItems.length} portfolio items using email fallback`)
      }
      
      console.log(`📝 Portfolio items found:`, portfolioItems.map(item => ({ 
        title: item.title, 
        providerId: item.providerId 
      })))
    } catch (error) {
      console.error('❌ Error fetching portfolio items:', error)
    }

    // Transform portfolio items to match the expected format for PortfolioGallery
    const portfolio = portfolioItems.map(item => ({
      title: item.title,
      description: item.description,
      category: item.category,
      beforeImage: item.beforeImage,
      afterImage: item.afterImage,
      additionalImages: item.additionalImages || [],
      projectDate: item.projectDate,
      completedDate: item.projectDate, // Alias for compatibility
      duration: item.duration,
      cost: item.cost,
      tags: item.tags || [],
      customerName: item.customerName,
      client: item.customerName, // Alias for compatibility
      views: item.views || 0,
      likes: item.likes || 0,
      // Additional fields for better display
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }))
    
    console.log(`📊 Final portfolio data: ${portfolio.length} items`)
    
    return NextResponse.json({
      success: true,
      businessList: {
        id: business._id.toString(),
        name: business.name,
        about: business.about,
        address: business.address,
        contactPerson: business.contactPerson,
        email: business.email,
        phone: business.phone,
        images: business.images,
        rating: business.rating,
        totalReviews: business.totalReviews,
        specializations: business.specializations,
        certifications: business.certifications,
        experience: business.experience,
        portfolio: portfolio, // New detailed portfolio data
        providerEmail: business.providerEmail,
        category: category ? {
          id: category._id.toString(),
          name: category.name,
          backgroundColor: category.backgroundColor,
          icon: category.icon
        } : {
          id: '',
          name: 'Unknown Category',
          backgroundColor: '#3B82F6',
          icon: '/default-icon.svg'
        }
      }
    })
  } catch (error) {
    console.error('❌ Error fetching business:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch business'
    }, { status: 500 })
  }
} 