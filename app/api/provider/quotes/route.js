import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is a provider
    if (session.user.role !== 'PROVIDER') {
      return NextResponse.json(
        { error: 'Provider access required' },
        { status: 403 }
      )
    }

    const { db } = await connectToDatabase()
    const providerEmail = session.user.email

    // Get all quotes for this provider
    const quotes = await db.collection('quotes')
      .find({ providerEmail })
      .sort({ createdAt: -1 })
      .toArray()

    // Format quotes for frontend
    const formattedQuotes = quotes.map(quote => ({
      id: quote._id.toString(),
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      customerPhone: quote.customerPhone,
      serviceTitle: quote.serviceTitle,
      description: quote.description,
      items: quote.items,
      photos: quote.photos,
      total: quote.total,
      status: quote.status,
      validUntil: quote.validUntil,
      notes: quote.notes,
      createdAt: quote.createdAt,
      sentAt: quote.sentAt,
      viewedAt: quote.viewedAt,
      respondedAt: quote.respondedAt
    }))

    return NextResponse.json(formattedQuotes)

  } catch (error) {
    console.error('Error fetching quotes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is a provider
    if (session.user.role !== 'PROVIDER') {
      return NextResponse.json(
        { error: 'Provider access required' },
        { status: 403 }
      )
    }

    const { db } = await connectToDatabase()
    const providerEmail = session.user.email
    const quoteData = await request.json()

    // Validate required fields
    if (!quoteData.customerName || !quoteData.serviceTitle || !quoteData.items || quoteData.items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: customerName, serviceTitle, items' },
        { status: 400 }
      )
    }

    // Calculate total if not provided
    const total = quoteData.items.reduce((sum, item) => sum + (item.total || 0), 0)

    // Create quote
    const quote = {
      providerEmail,
      providerName: session.user.name,
      customerName: quoteData.customerName,
      customerEmail: quoteData.customerEmail || '',
      customerPhone: quoteData.customerPhone || '',
      serviceTitle: quoteData.serviceTitle,
      description: quoteData.description || '',
      items: quoteData.items,
      photos: quoteData.photos || [],
      total,
      status: 'draft', // draft, sent, viewed, approved, rejected, expired
      validUntil: quoteData.validUntil ? new Date(quoteData.validUntil) : null,
      notes: quoteData.notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('quotes')
      .insertOne(quote)

    return NextResponse.json({
      id: result.insertedId.toString(),
      ...quote
    })

  } catch (error) {
    console.error('Error creating quote:', error)
    return NextResponse.json(
      { error: 'Failed to create quote' },
      { status: 500 }
    )
  }
} 