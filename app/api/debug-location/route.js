import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import BusinessList from '@/models/BusinessList'

export async function GET(request) {
  try {
    await connectDB()
    
    // Get URL search params for user coordinates if provided
    const url = new URL(request.url)
    const userLat = parseFloat(url.searchParams.get('lat')) 
    const userLng = parseFloat(url.searchParams.get('lng'))
    const radius = parseFloat(url.searchParams.get('radius')) || 10

    // Check overall location data status
    const totalBusinesses = await BusinessList.countDocuments({ isActive: true })
    const withCoordinates = await BusinessList.countDocuments({
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null },
      isActive: true
    })
    
    // Get sample businesses with their location data
    const sampleBusinesses = await BusinessList.find({ isActive: true }, {
      name: 1,
      address: 1,
      city: 1,
      state: 1,
      latitude: 1,
      longitude: 1
    }).limit(10)

    let distanceAnalysis = null
    if (userLat && userLng && !isNaN(userLat) && !isNaN(userLng)) {
      // Get businesses with coordinates and calculate distances
      const businessesWithCoords = await BusinessList.find({
        latitude: { $exists: true, $ne: null },
        longitude: { $exists: true, $ne: null },
        isActive: true
      }, {
        name: 1,
        address: 1,
        city: 1,
        latitude: 1,
        longitude: 1
      })

      // Calculate distances manually to verify the MongoDB calculation
      const businessesWithDistance = businessesWithCoords.map(business => {
        // Haversine formula for distance calculation
        const R = 6371 // Earth radius in km
        const dLat = (business.latitude - userLat) * Math.PI / 180
        const dLng = (business.longitude - userLng) * Math.PI / 180
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(userLat * Math.PI / 180) * Math.cos(business.latitude * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        const distance = R * c

        return {
          name: business.name,
          address: business.address,
          city: business.city,
          coordinates: `${business.latitude}, ${business.longitude}`,
          distance: Math.round(distance * 10) / 10
        }
      })

      // Sort by distance
      businessesWithDistance.sort((a, b) => a.distance - b.distance)

      const withinRadius = businessesWithDistance.filter(b => b.distance <= radius)

      distanceAnalysis = {
        userLocation: `${userLat}, ${userLng}`,
        radius: `${radius}km`,
        totalWithCoordinates: businessesWithDistance.length,
        withinRadius: withinRadius.length,
        closest5: businessesWithDistance.slice(0, 5),
        withinRadiusSample: withinRadius.slice(0, 5)
      }
    }

    return NextResponse.json({
      success: true,
      locationDataStatus: {
        totalBusinesses,
        withCoordinates,
        percentageWithCoordinates: Math.round((withCoordinates / totalBusinesses) * 100),
        needsMigration: totalBusinesses - withCoordinates
      },
      sampleBusinesses: sampleBusinesses.map(b => ({
        name: b.name,
        address: b.address,
        city: b.city,
        state: b.state,
        hasCoordinates: !!(b.latitude && b.longitude),
        coordinates: b.latitude && b.longitude ? `${b.latitude}, ${b.longitude}` : null
      })),
      distanceAnalysis,
      instructions: {
        checkWithUserLocation: "Add ?lat=YOUR_LAT&lng=YOUR_LNG&radius=10 to URL to test distance calculation",
        migrationNeeded: withCoordinates === 0 ? "Run /api/admin/migrate-location-data POST with action: 'migrate'" : null
      }
    })

  } catch (error) {
    console.error('❌ Debug location error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to debug location data',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { action, testCoordinates } = await request.json()

    if (action === 'test-filter') {
      // Test the same filtering logic used in the main search
      await connectDB()
      
      const { latitude, longitude, radius = 10 } = testCoordinates
      
      // Use the same aggregation pipeline as the main search
      const collection = await BusinessList.collection
      
      const pipeline = [
        { $match: { isActive: true } },
        {
          $addFields: {
            distance: {
              $multiply: [
                {
                  $acos: {
                    $add: [
                      {
                        $multiply: [
                          { $sin: { $degreesToRadians: latitude } },
                          { $sin: { $degreesToRadians: { $ifNull: ["$latitude", 0] } } }
                        ]
                      },
                      {
                        $multiply: [
                          { $cos: { $degreesToRadians: latitude } },
                          { $cos: { $degreesToRadians: { $ifNull: ["$longitude", 0] } } },
                          { $cos: { $degreesToRadians: { $subtract: [{ $ifNull: ["$longitude", 0] }, longitude] } } }
                        ]
                      }
                    ]
                  }
                },
                6371 // Earth radius in kilometers
              ]
            }
          }
        },
        {
          $match: {
            $and: [
              { latitude: { $exists: true, $ne: null } },
              { longitude: { $exists: true, $ne: null } },
              { distance: { $lte: radius } }
            ]
          }
        },
        { $sort: { distance: 1 } },
        { $limit: 10 }
      ]

      const results = await collection.aggregate(pipeline).toArray()

      return NextResponse.json({
        success: true,
        testResults: {
          userLocation: `${latitude}, ${longitude}`,
          radius: `${radius}km`,
          foundBusinesses: results.length,
          businesses: results.map(b => ({
            name: b.name,
            address: b.address,
            city: b.city,
            coordinates: `${b.latitude}, ${b.longitude}`,
            distance: Math.round(b.distance * 10) / 10
          }))
        }
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })

  } catch (error) {
    console.error('❌ Debug location POST error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to test location filtering',
      details: error.message
    }, { status: 500 })
  }
} 