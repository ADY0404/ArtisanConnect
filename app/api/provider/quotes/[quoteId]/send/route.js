import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../auth/[...nextauth]/route'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request, { params }) {
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
    const quoteId = params.quoteId

    // Get the quote
    const quote = await db.collection('quotes')
      .findOne({ 
        _id: new ObjectId(quoteId),
        providerEmail 
      })

    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found or unauthorized' },
        { status: 404 }
      )
    }

    // Check if quote is in draft status
    if (quote.status !== 'draft') {
      return NextResponse.json(
        { error: 'Quote has already been sent' },
        { status: 400 }
      )
    }

    // Update quote status to sent
    await db.collection('quotes')
      .updateOne(
        { _id: new ObjectId(quoteId) },
        { 
          $set: { 
            status: 'sent',
            sentAt: new Date(),
            updatedAt: new Date()
          }
        }
      )

    // Create notification for customer if they have an account
    if (quote.customerEmail) {
      await db.collection('notifications')
        .insertOne({
          userEmail: quote.customerEmail,
          type: 'quote_received',
          title: 'New Quote Received',
          message: `You have received a quote for "${quote.serviceTitle}" from ${session.user.name}`,
          data: {
            quoteId: quoteId,
            providerName: session.user.name,
            serviceTitle: quote.serviceTitle,
            total: quote.total
          },
          isRead: false,
          createdAt: new Date()
        })

      // TODO: Send email notification using SendGrid
      // This would include a link to view/approve the quote
      console.log(`Email notification would be sent to: ${quote.customerEmail}`)
    }

    // Generate quote viewing link (for customer without account)
    const viewingLink = `${process.env.NEXTAUTH_URL}/quote/view/${quoteId}`

    return NextResponse.json({
      success: true,
      message: 'Quote sent successfully',
      viewingLink,
      sentAt: new Date()
    })

  } catch (error) {
    console.error('Error sending quote:', error)
    return NextResponse.json(
      { error: 'Failed to send quote' },
      { status: 500 }
    )
  }
} 