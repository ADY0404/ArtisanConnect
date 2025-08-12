import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import BusinessList from '@/models/BusinessList'

// Sample Ghana locations with coordinates
const ghanaLocations = [
  {
    city: 'Accra',
    state: 'Greater Accra Region',
    latitude: 5.6037,
    longitude: -0.1870,
    areas: ['East Legon', 'Adabraka', 'Osu', 'Dansoman', 'Tema', 'Madina']
  },
  {
    city: 'Kumasi',
    state: 'Ashanti Region', 
    latitude: 6.6885,
    longitude: -1.6244,
    areas: ['Asokwa', 'Bantama', 'Kwadaso', 'Nhyiaeso', 'Suame']
  },
  {
    city: 'Tamale',
    state: 'Northern Region',
    latitude: 9.4034,
    longitude: -0.8424,
    areas: ['Central Tamale', 'Kalpohin', 'Sakasaka', 'Zogbeli']
  },
  {
    city: 'Cape Coast',
    state: 'Central Region',
    latitude: 5.1053,
    longitude: -1.2466,
    areas: ['Cape Coast Castle', 'University of Cape Coast', 'Adisadel']
  },
  {
    city: 'Takoradi',
    state: 'Western Region',
    latitude: 4.8845,
    longitude: -1.7554,
    areas: ['Sekondi', 'European Town', 'Market Circle']
  },
  {
    city: 'Ho',
    state: 'Volta Region',
    latitude: 6.6108,
    longitude: 0.4708,
    areas: ['Ho Municipal', 'Bankoe', 'Ahoe']
  }
]

export async function POST(request) {
  try {
    await connectDB()

    const { action } = await request.json()

    if (action === 'migrate') {
      // Get all businesses without coordinates
      const businesses = await BusinessList.find({
        $or: [
          { latitude: { $exists: false } },
          { longitude: { $exists: false } },
          { latitude: null },
          { longitude: null }
        ]
      })

      console.log(`📍 Found ${businesses.length} businesses without coordinates`)

      let updated = 0
      
      for (const business of businesses) {
        // Randomly assign a Ghana location
        const randomLocation = ghanaLocations[Math.floor(Math.random() * ghanaLocations.length)]
        const randomArea = randomLocation.areas[Math.floor(Math.random() * randomLocation.areas.length)]
        
        // Add some random offset to coordinates for variety (within ~5km)
        const latOffset = (Math.random() - 0.5) * 0.09 // ~5km offset
        const lngOffset = (Math.random() - 0.5) * 0.09
        
        const updateData = {
          latitude: randomLocation.latitude + latOffset,
          longitude: randomLocation.longitude + lngOffset,
          city: randomLocation.city,
          state: randomLocation.state,
          country: 'Ghana',
          updatedAt: new Date()
        }

        // Update address if it's too generic
        if (!business.address || business.address === 'Ghana') {
          updateData.address = `${randomArea}, ${randomLocation.city}, ${randomLocation.state}`
        }

        await BusinessList.findByIdAndUpdate(business._id, updateData)
        updated++
      }

      return NextResponse.json({
        success: true,
        message: `Successfully updated ${updated} businesses with location data`,
        details: {
          totalFound: businesses.length,
          totalUpdated: updated,
          locationsUsed: ghanaLocations.map(l => `${l.city}, ${l.state}`)
        }
      })
    }

    if (action === 'check') {
      // Check current location data status
      const total = await BusinessList.countDocuments()
      const withCoordinates = await BusinessList.countDocuments({
        latitude: { $exists: true, $ne: null },
        longitude: { $exists: true, $ne: null }
      })
      const withCity = await BusinessList.countDocuments({
        city: { $exists: true, $ne: '', $ne: null }
      })

      const sampleBusinesses = await BusinessList.find({}, {
        name: 1,
        address: 1,
        city: 1,
        state: 1,
        latitude: 1,
        longitude: 1
      }).limit(5)

      return NextResponse.json({
        success: true,
        stats: {
          totalBusinesses: total,
          withCoordinates,
          withCity,
          percentageWithCoordinates: Math.round((withCoordinates / total) * 100),
          percentageWithCity: Math.round((withCity / total) * 100)
        },
        sampleData: sampleBusinesses
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use "migrate" or "check"'
    }, { status: 400 })

  } catch (error) {
    console.error('❌ Location migration error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to migrate location data',
      details: error.message
    }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    // Quick status check
    await connectDB()
    
    const total = await BusinessList.countDocuments()
    const withCoordinates = await BusinessList.countDocuments({
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null }
    })

    return NextResponse.json({
      success: true,
      message: 'Location data status',
      stats: {
        totalBusinesses: total,
        withCoordinates,
        needsMigration: total - withCoordinates,
        percentageComplete: Math.round((withCoordinates / total) * 100)
      }
    })

  } catch (error) {
    console.error('❌ Error checking location status:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to check location status'
    }, { status: 500 })
  }
} 