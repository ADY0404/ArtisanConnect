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
    
    // Get portfolio items for the provider
    const portfolioItems = await db.collection('portfolioItems')
      .find({ providerId: session.user.id || session.user.email })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ portfolioItems })

  } catch (error) {
    console.error('Error fetching portfolio:', error)
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
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

    const portfolioData = await request.json()
    const { db } = await connectToDatabase()

    // Create new portfolio item
    const newItem = {
      ...portfolioData,
      id: `portfolio_${Date.now()}`,
      providerId: session.user.id || session.user.email,
      providerName: session.user.name,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('portfolioItems').insertOne(newItem)

    return NextResponse.json({
      ...newItem,
      _id: result.insertedId
    })

  } catch (error) {
    console.error('Error adding portfolio item:', error)
    return NextResponse.json(
      { error: 'Failed to add portfolio item' },
      { status: 500 }
    )
  }
} 