import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectToDatabase } from '@/lib/mongodb'
import { authOptions } from '../../../auth/[...nextauth]/route'

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { testimonialId } = params
    const updateData = await request.json()
    const { db } = await connectToDatabase()

    // Update the testimonial (only if it belongs to the current provider)
    const result = await db.collection('testimonials').updateOne(
      {
        id: testimonialId,
        providerId: session.user.id || session.user.email
      },
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Testimonial not found or unauthorized' }, { status: 404 })
    }

    console.log(`✅ Updated testimonial ${testimonialId} for provider ${session.user.email}`)

    return NextResponse.json({ 
      success: true,
      message: 'Testimonial updated successfully'
    })

  } catch (error) {
    console.error('Error updating testimonial:', error)
    return NextResponse.json(
      { error: 'Failed to update testimonial' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { testimonialId } = params
    const { db } = await connectToDatabase()

    // Delete the testimonial (only if it belongs to the current provider)
    const result = await db.collection('testimonials').deleteOne({
      id: testimonialId,
      providerId: session.user.id || session.user.email
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Testimonial not found or unauthorized' }, { status: 404 })
    }

    console.log(`🗑️ Deleted testimonial ${testimonialId} for provider ${session.user.email}`)

    return NextResponse.json({ 
      success: true,
      message: 'Testimonial deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting testimonial:', error)
    return NextResponse.json(
      { error: 'Failed to delete testimonial' },
      { status: 500 }
    )
  }
} 