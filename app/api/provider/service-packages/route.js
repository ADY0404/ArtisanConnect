import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { connectToDatabase } from '@/lib/mongodb'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PROVIDER') {
      return NextResponse.json({ error: 'Provider access required' }, { status: 403 })
    }

    const { db } = await connectToDatabase()
    
    // Get service packages for this provider
    const packages = await db.collection('service_packages')
      .find({ providerId: session.user.email })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json(packages)

  } catch (error) {
    console.error('Error fetching service packages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch service packages' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PROVIDER') {
      return NextResponse.json({ error: 'Provider access required' }, { status: 403 })
    }

    const packageData = await request.json()
    const { db } = await connectToDatabase()

    // Create new service package
    const newPackage = {
      ...packageData,
      providerId: session.user.email,
      providerName: session.user.name,
      bookingCount: 0,
      averageRating: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('service_packages').insertOne(newPackage)

    return NextResponse.json({
      success: true,
      packageId: result.insertedId,
      message: 'Service package created successfully'
    })

  } catch (error) {
    console.error('Error creating service package:', error)
    return NextResponse.json(
      { error: 'Failed to create service package' },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PROVIDER') {
      return NextResponse.json({ error: 'Provider access required' }, { status: 403 })
    }

    const { packageId, ...updateData } = await request.json()
    const { db } = await connectToDatabase()

    // Update service package
    const result = await db.collection('service_packages').updateOne(
      { 
        _id: new ObjectId(packageId),
        providerId: session.user.email 
      },
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Service package not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Service package updated successfully'
    })

  } catch (error) {
    console.error('Error updating service package:', error)
    return NextResponse.json(
      { error: 'Failed to update service package' },
      { status: 500 }
    )
  }
} 