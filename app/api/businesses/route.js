import { NextResponse } from 'next/server'
import BusinessList from '@/models/BusinessList'
import Category from '@/models/Category'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import User from '@/models/User'
import { ensureConnection } from '@/lib/mongodb'

export async function GET(request) {
  try {
    // Connect to database using Mongoose
    await ensureConnection()
    
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    
    let businesses;
    
    if (category) {
      // Get businesses by category name
      const categoryDoc = await Category.findByName(category)
      if (!categoryDoc) {
        return NextResponse.json({
          success: true,
          businessLists: []
        })
      }
      
      // Check if category is active
      if (!categoryDoc.isActive) {
        console.log(`⚠️ Category ${category} is inactive, returning empty business list`)
        return NextResponse.json({
          success: true,
          businessLists: []
        })
      }
      
      // ✅ PHASE 1: Only show approved and public businesses
      businesses = await BusinessList.find({ 
        categoryId: categoryDoc._id,
        isActive: true,
        isPublic: true, // Only show approved businesses
        approvalStatus: 'APPROVED'
      }).populate('categoryId')
    } else {
      // Get all active categories
      const activeCategories = await Category.find({ isActive: true });
      const activeCategoryIds = activeCategories.map(cat => cat._id);
      
      // ✅ PHASE 1: Only show approved and public businesses from active categories
      businesses = await BusinessList.find({ 
        categoryId: { $in: activeCategoryIds },
        isActive: true,
        isPublic: true, // Only show approved businesses
        approvalStatus: 'APPROVED'
      }).populate('categoryId').sort({ rating: -1, createdAt: -1 })
    }
    
    return NextResponse.json({
      success: true,
      businessLists: businesses.map(business => ({
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
        portfolio: business.portfolio,
        providerEmail: business.providerEmail,
        category: business.categoryId ? {
          id: business.categoryId._id.toString(),
          name: business.categoryId.name,
          backgroundColor: business.categoryId.backgroundColor,
          icon: business.categoryId.icon
        } : {
          id: '',
          name: 'Unknown Category',
          backgroundColor: '#3B82F6',
          icon: '/default-icon.svg'
        }
      }))
    })
  } catch (error) {
    console.error('❌ Error fetching businesses:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch businesses'
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const requestData = await request.json()
    
    // Handle different POST actions
    if (requestData.action) {
      switch (requestData.action) {
        case 'search':
          return await handleAdvancedSearch(requestData)
        case 'locations':
          return await handleLocationSuggestions(requestData)
        case 'popular':
          return await handlePopularSearches()
        default:
          return NextResponse.json({
            success: false,
            error: 'Unknown action'
          }, { status: 400 })
      }
    }

    // ✅ AUTHENTICATE USER FOR BUSINESS CREATION
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required to create business'
      }, { status: 401 })
    }

    // Connect to database for business creation using Mongoose
    await ensureConnection()

    const providerEmail = session.user.email
    console.log('🏢 Creating business for provider:', providerEmail)
    
    // Original business creation logic
    const businessData = requestData
    
    // Validate required fields
    if (!businessData.name || !businessData.about || !businessData.address || !businessData.categoryId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, about, address, categoryId'
      }, { status: 400 })
    }
    
    // Verify category exists
    const category = await Category.findById(businessData.categoryId)
    if (!category) {
      return NextResponse.json({
        success: false,
        error: 'Category not found'
      }, { status: 404 })
    }
    
    // ✅ CREATE BUSINESS WITH PROVIDER ASSOCIATION AND APPROVAL WORKFLOW
    const businessResult = await BusinessList.create({
      name: businessData.name,
      about: businessData.about,
      address: businessData.address,
      contactPerson: businessData.contactPerson || '',
      email: businessData.email || providerEmail, // Use provider email as fallback
      phone: businessData.phone || '',
      images: businessData.images || [
        'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop'
      ],
      // ✅ ADD PROVIDER TIER ASSIGNMENT
      providerTier: 'STANDARD', // Default tier for new providers
      tierAssignedAt: new Date(),
      performanceMetrics: {
        completedBookings: 0,
        averageRating: 0,
        totalRevenue: 0,
        accountAgeMonths: 0,
        isVerified: false,
        lastUpdated: new Date()
      },
      categoryId: businessData.categoryId,
      specializations: businessData.specializations || [],
      certifications: businessData.certifications || [],
      experience: businessData.experience || '',
      portfolio: businessData.portfolio || [],
      rating: 0,
      totalReviews: 0,
      providerEmail: providerEmail, // ✅ ASSOCIATE WITH PROVIDER
      createdBy: providerEmail,
      
      // ✅ PHASE 1: NEW APPROVAL WORKFLOW FIELDS
      approvalStatus: 'PENDING', // New businesses start as pending
      isPublic: false, // Only show approved businesses publicly
      isActive: false, // Keep inactive until approved
      documentsUploaded: businessData.documentsUploaded || [],
      guarantorInfo: businessData.guarantorInfo || {
        name: '',
        phone: '',
        relationship: '',
        ghanaCardNumber: ''
      }
    })
    
    if (!businessResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create business'
      }, { status: 500 })
    }

    const createdBusiness = businessResult.business
    
    // ✅ UPDATE USER RECORD TO INCLUDE BUSINESS ASSOCIATION
    try {
      const { getDatabase } = await import('@/lib/mongodb')
      const database = await getDatabase()
      
      // Add business to user's businesses array
      await database.collection('users').updateOne(
        { email: providerEmail },
        { 
          $addToSet: { 
            businessIds: createdBusiness._id,
            businesses: {
              businessId: createdBusiness._id.toString(),
              businessName: createdBusiness.name,
              role: 'owner',
              createdAt: new Date()
            }
          },
          $set: {
            isProvider: true,
            lastUpdated: new Date()
          }
        },
        { upsert: true }
      )
      
      console.log('✅ Associated business', createdBusiness._id, 'with provider', providerEmail)
    } catch (associationError) {
      console.error('⚠️ Failed to associate business with provider:', associationError)
      // Don't fail the request, just log the error
    }
    
    return NextResponse.json({
      success: true,
      businessId: createdBusiness._id.toString(), // Add businessId for reference
      businessList: {
        id: createdBusiness._id.toString(),
        name: createdBusiness.name,
        about: createdBusiness.about,
        address: createdBusiness.address,
        contactPerson: createdBusiness.contactPerson,
        email: createdBusiness.email,
        phone: createdBusiness.phone,
        images: createdBusiness.images,
        rating: createdBusiness.rating,
        totalReviews: createdBusiness.totalReviews,
        specializations: createdBusiness.specializations,
        certifications: createdBusiness.certifications,
        experience: createdBusiness.experience,
        portfolio: createdBusiness.portfolio,
        providerEmail: providerEmail, // ✅ INCLUDE PROVIDER INFO
        category: {
          id: category._id ? category._id.toString() : category.id || '',
          name: category.name,
          backgroundColor: category.backgroundColor,
          icon: category.icon
        }
      }
    }, { status: 201 })
  } catch (error) {
    console.error('❌ Error in POST request:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process request'
    }, { status: 500 })
  }
}

// Advanced search handler
async function handleAdvancedSearch(requestData) {
  try {
    const { filters = {} } = requestData
    const {
      searchQuery = '',
      location = '',
      category = '',
      minRating = 0,
      priceRange = { min: 0, max: 1000 },
      radius = 10,
      coordinates = null,
      sortBy = 'rating',
      page = 1,
      limit = 20
    } = filters

    const { Database } = await import('@/lib/database')
    const collection = await Database.getCollection('businesslists')
    
    // Get all active categories first
    const categoryCollection = await Database.getCollection('categories')
    const activeCategories = await categoryCollection.find({ isActive: true }).toArray()
    const activeCategoryIds = activeCategories.map(cat => cat._id)

    // Build match conditions
    const matchConditions = { 
      isActive: true,
      isPublic: true, // ✅ PHASE 1: Only show approved businesses
      approvalStatus: 'APPROVED',
      categoryId: { $in: activeCategoryIds } // Only show businesses from active categories
    }

    // Smart Text search with relevance scoring
    if (searchQuery) {
      const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(term => term.length > 2)
      const searchRegexes = searchTerms.map(term => ({ $regex: term, $options: 'i' }))
      
      matchConditions.$or = matchConditions.$or || []
      
      // Exact match (highest priority)
      const exactSearchRegex = { $regex: `^${searchQuery}$`, $options: 'i' }
      matchConditions.$or.push(
        { name: exactSearchRegex },
        { about: exactSearchRegex }
      )
      
      // Partial match (medium priority)
      const partialSearchRegex = { $regex: searchQuery, $options: 'i' }
      matchConditions.$or.push(
        { name: partialSearchRegex },
        { about: partialSearchRegex },
        { specializations: partialSearchRegex },
        { 'category.name': partialSearchRegex },
        { keywords: { $elemMatch: partialSearchRegex } }
      )
      
      // Individual term matching (lowest priority)
      if (searchTerms.length > 1) {
        searchRegexes.forEach(regex => {
          matchConditions.$or.push(
            { name: regex },
            { about: regex },
            { specializations: regex }
          )
        })
      }
      
      console.log(`🔍 Smart search for: "${searchQuery}" with ${searchTerms.length} terms`)
    }

    // Category filter
    if (category && category !== 'All Categories') {
      // Look up category by name first
      const { ObjectId } = await import('mongodb')
      const categoryDoc = await categoryCollection.findOne({ name: category })
      if (categoryDoc) {
        // Only apply the category filter if the category is active
        if (categoryDoc.isActive) {
          matchConditions.categoryId = categoryDoc._id
        } else {
          // If the category is inactive, return empty results
          console.log(`⚠️ Search requested inactive category: ${category}`)
          return NextResponse.json({
            success: true,
            businesses: [],
            total: 0,
            page,
            totalPages: 0
          })
        }
      }
    }

    // Rating filter
    if (minRating > 0) {
      matchConditions.rating = { $gte: minRating }
    }

    // Smart Location filtering - ENHANCED VERSION
    if (location && location.trim() !== '') {
      console.log(`📍 LOCATION FILTER APPLIED: "${location}"`);

      if (!coordinates) {
        // Enhanced text-based location matching with fuzzy search
        const locationTerms = location.toLowerCase().split(/\s+/).filter(term => term.length > 2)
        const locationRegexes = locationTerms.map(term => ({ $regex: term, $options: 'i' }))

        // Create separate location conditions to avoid conflicts with search $or
        const locationConditions = []

        // Exact location match (highest priority)
        const exactLocationRegex = { $regex: `^${location}$`, $options: 'i' }
        locationConditions.push(
          { city: exactLocationRegex },
          { state: exactLocationRegex },
          { address: exactLocationRegex }
        )

        // Partial location match (medium priority)
        const partialLocationRegex = { $regex: location, $options: 'i' }
        locationConditions.push(
          { address: partialLocationRegex },
          { city: partialLocationRegex },
          { state: partialLocationRegex },
          { 'contactPerson.address': partialLocationRegex },
          { 'serviceAreas': { $elemMatch: partialLocationRegex } }
        )

        // Fuzzy match for individual terms (lowest priority)
        if (locationTerms.length > 1) {
          locationRegexes.forEach(regex => {
            locationConditions.push(
              { address: regex },
              { city: regex },
              { state: regex }
            )
          })
        }

        // Combine with existing conditions using $and
        if (matchConditions.$or) {
          // If we already have search conditions, combine them properly
          matchConditions.$and = [
            { $or: matchConditions.$or }, // Existing search conditions
            { $or: locationConditions }   // Location conditions
          ]
          delete matchConditions.$or // Remove the original $or to avoid conflicts
        } else {
          // If no search conditions, just add location conditions
          matchConditions.$or = locationConditions
        }

        console.log(`🔍 Text-based location search for: "${location}" with ${locationConditions.length} location conditions`)
        console.log(`🔧 Final match conditions structure:`, Object.keys(matchConditions))
      }
    }

    // Build aggregation pipeline
    const pipeline = [
      { $match: matchConditions },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' }
    ]

    // Add distance calculation if coordinates provided
    if (coordinates && coordinates.latitude && coordinates.longitude) {
      console.log(`📍 GPS Filtering: User location: ${coordinates.latitude}, ${coordinates.longitude}, Radius: ${radius}km`)
      
      pipeline.push({
        $addFields: {
          distance: {
            $multiply: [
              {
                $acos: {
                  $add: [
                    {
                      $multiply: [
                        { $sin: { $degreesToRadians: coordinates.latitude } },
                        { $sin: { $degreesToRadians: { $ifNull: ["$latitude", 0] } } }
                      ]
                    },
                    {
                      $multiply: [
                        { $cos: { $degreesToRadians: coordinates.latitude } },
                        { $cos: { $degreesToRadians: { $ifNull: ["$longitude", 0] } } },
                        { $cos: { $degreesToRadians: { $subtract: [{ $ifNull: ["$longitude", 0] }, coordinates.longitude] } } }
                      ]
                    }
                  ]
                }
              },
              6371 // Earth radius in kilometers
            ]
          }
        }
      })

      // Filter by radius if coordinates are available
      pipeline.push({
        $match: {
          $and: [
            { latitude: { $exists: true, $ne: null } }, // Only businesses with coordinates
            { longitude: { $exists: true, $ne: null } }, // Only businesses with coordinates
            { distance: { $lte: radius } } // Within the specified radius
          ]
        }
      })
    }

    // Sorting
    const sortOptions = {}
    switch (sortBy) {
      case 'distance':
        if (coordinates) {
          sortOptions.distance = 1
        } else {
          sortOptions.rating = -1
        }
        break
      case 'rating':
        sortOptions.rating = -1
        sortOptions.totalReviews = -1
        break
      case 'reviews':
        sortOptions.totalReviews = -1
        sortOptions.rating = -1
        break
      case 'price':
        sortOptions['pricing.basePrice'] = 1
        break
      default:
        sortOptions.rating = -1
    }

    pipeline.push({ $sort: sortOptions })

    // Get total count before pagination
    const countPipeline = [...pipeline, { $count: "total" }]
    const totalResult = await collection.aggregate(countPipeline).toArray()
    const total = totalResult[0]?.total || 0

    // Add pagination
    pipeline.push({ $skip: (page - 1) * limit })
    pipeline.push({ $limit: limit })

    // Execute search
    const businesses = await collection.aggregate(pipeline).toArray()

    // Enhanced debugging for location filtering
    console.log(`🔍 SEARCH RESULTS DEBUG:`)
    console.log(`   📊 Total results found: ${businesses.length}`)
    console.log(`   📍 Location filter applied: ${location ? `"${location}"` : 'None'}`)
    console.log(`   🎯 Category filter: ${category || 'All'}`)
    console.log(`   🔧 Match conditions used:`, JSON.stringify(matchConditions, null, 2))

    if (location && businesses.length > 0) {
      console.log(`   📋 Sample results with location filter:`)
      businesses.slice(0, 3).forEach((business, index) => {
        console.log(`     ${index + 1}. ${business.name} - Address: ${business.address}`)
      })
    }

    if (coordinates && coordinates.latitude && coordinates.longitude) {
      console.log(`🔍 GPS Location Filter Results: Found ${businesses.length} businesses within ${radius}km`)
      if (businesses.length > 0) {
        const nearbyBusinesses = businesses.filter(b => b.distance && b.distance <= radius)
        console.log(`📊 Businesses with valid distances: ${nearbyBusinesses.length}`)
        if (nearbyBusinesses.length > 0) {
          console.log(`📍 Distance range: ${Math.min(...nearbyBusinesses.map(b => b.distance)).toFixed(2)}km - ${Math.max(...nearbyBusinesses.map(b => b.distance)).toFixed(2)}km`)
        }
      }
    } else if (location && location.trim() !== '') {
      console.log(`📍 TEXT-BASED Location Filter: "${location}"`)
      console.log(`   📊 Results after location filtering: ${businesses.length}`)
      if (businesses.length === 0) {
        console.warn(`   ⚠️ NO RESULTS FOUND for location: "${location}"`)
        console.log(`   💡 Suggestion: Check if businesses have address data matching this location`)
      }
    }
    
    // Format response
    const formattedBusinesses = businesses.map(business => ({
      id: business._id.toString(),
      name: business.name,
      about: business.about,
      address: business.address || business.contactPerson?.address,
      contactPerson: business.contactPerson,
      email: business.email,
      phone: business.phone,
      images: business.images,
      rating: business.rating || 0,
      totalReviews: business.totalReviews || 0,
      distance: business.distance ? Math.round(business.distance * 10) / 10 : null,
      category: business.category ? {
        id: business.category._id?.toString(),
        name: business.category.name,
        backgroundColor: business.category.backgroundColor,
        icon: business.category.icon
      } : null
    }))
    
    return NextResponse.json({
      success: true,
      businesses: formattedBusinesses,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('❌ Error in advanced search:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to search businesses',
      details: error.message
    }, { status: 500 })
  }
}

// Location suggestions handler
async function handleLocationSuggestions(requestData) {
  try {
    const { query } = requestData
    
    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        locations: []
      })
    }
    
    const { Database } = await import('@/lib/database')
    const collection = await Database.getCollection('businesslists')
    
    // Get unique locations from businesses
    const locations = await collection.aggregate([
      {
        $match: {
          $or: [
            { 'contactPerson.address': { $regex: query, $options: 'i' } },
            { address: { $regex: query, $options: 'i' } }
          ]
        }
      },
      {
        $group: {
          _id: null,
          addresses: { $addToSet: '$contactPerson.address' },
          businessAddresses: { $addToSet: '$address' }
        }
      }
    ]).toArray()
    
    let suggestions = []
    if (locations[0]) {
      const { addresses, businessAddresses } = locations[0]
      suggestions = [
        ...(businessAddresses || []).filter(Boolean),
        ...(addresses || []).filter(Boolean)
      ].slice(0, 10) // Limit to 10 suggestions
    }
    
    return NextResponse.json({
      success: true,
      locations: [...new Set(suggestions)] // Remove duplicates
    })
  } catch (error) {
    console.error('❌ Error getting location suggestions:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get location suggestions'
    }, { status: 500 })
  }
}

// Popular searches handler
async function handlePopularSearches() {
  try {
    const { Database } = await import('@/lib/database')
    
    // Get top categories by business count
    const categoryCollection = await Database.getCollection('categories')
    const categories = await categoryCollection.aggregate([
      {
        $lookup: {
          from: 'businesses',
          localField: '_id',
          foreignField: 'categoryId',
          as: 'businesses'
        }
      },
      {
        $addFields: {
          businessCount: { $size: '$businesses' }
        }
      },
      {
        $sort: { businessCount: -1 }
      },
      {
        $limit: 6
      },
      {
        $project: {
          name: 1,
          businessCount: 1
        }
      }
    ]).toArray()
    
    // Get popular services (simplified)
    const businessCollection = await Database.getCollection('businesses')
    const services = await businessCollection.aggregate([
      {
        $group: {
          _id: '$name',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 8
      },
      {
        $project: {
          name: '$_id',
          count: 1
        }
      }
    ]).toArray()
    
    return NextResponse.json({
      success: true,
      categories: categories.map(cat => cat.name),
      services: services.map(service => service.name)
    })
  } catch (error) {
    console.error('❌ Error getting popular searches:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get popular searches'
    }, { status: 500 })
  }
} 