import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectToDatabase } from '@/lib/mongodb'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    
    // Get testimonials for the provider
    const testimonials = await db.collection('testimonials')
      .find({ providerId: session.user.id || session.user.email })
      .sort({ createdAt: -1 })
      .toArray()

    console.log(`📝 Found ${testimonials.length} testimonials for provider ${session.user.email}`)

    return NextResponse.json({ testimonials })

  } catch (error) {
    console.error('Error fetching testimonials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch testimonials' },
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

    const testimonialData = await request.json()
    const { db } = await connectToDatabase()

    // Validate required fields
    const { customerName, rating, testimonialText, projectType } = testimonialData

    if (!customerName || !rating || !testimonialText || !projectType) {
      return NextResponse.json(
        { error: 'Missing required fields: customerName, rating, testimonialText, projectType' },
        { status: 400 }
      )
    }

    // Create new testimonial
    const newTestimonial = {
      ...testimonialData,
      id: `testimonial_${Date.now()}`,
      providerId: session.user.id || session.user.email,
      providerName: session.user.name,
      providerEmail: session.user.email,
      verified: false, // Default to unverified until customer confirms
      helpful: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('testimonials').insertOne(newTestimonial)

    console.log(`✅ Created testimonial for provider ${session.user.email}: ${newTestimonial.id}`)

    return NextResponse.json({
      ...newTestimonial,
      _id: result.insertedId
    })

  } catch (error) {
    console.error('Error adding testimonial:', error)
    return NextResponse.json(
      { error: 'Failed to add testimonial' },
      { status: 500 }
    )
  }
} 