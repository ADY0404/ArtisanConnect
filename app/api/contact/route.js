import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

export async function POST(request) {
  try {
    const { name, email, phone, subject, message, category } = await request.json()

    // Validation
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Message length validation
    if (message.trim().length < 10) {
      return NextResponse.json(
        { error: 'Message must be at least 10 characters long' },
        { status: 400 }
      )
    }

    if (message.trim().length > 1000) {
      return NextResponse.json(
        { error: 'Message must be less than 1000 characters' },
        { status: 400 }
      )
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Create contact submission
    const contactSubmission = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      subject: subject?.trim() || null,
      message: message.trim(),
      category: category || 'general',
      status: 'new',
      createdAt: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    }

    // Save to database
    const result = await db.collection('contact_submissions').insertOne(contactSubmission)

    // TODO: Send email notification to admin team
    // This would typically integrate with an email service like SendGrid
    console.log('📧 New contact submission:', {
      id: result.insertedId,
      name: contactSubmission.name,
      email: contactSubmission.email,
      category: contactSubmission.category
    })

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you within 24 hours.',
      submissionId: result.insertedId
    })

  } catch (error) {
    console.error('❌ Contact form submission error:', error)
    
    return NextResponse.json(
      { error: 'Failed to send message. Please try again later.' },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    // This endpoint could be used by admin to view contact submissions
    // For now, return a simple response
    return NextResponse.json({
      message: 'Contact API is working',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Contact API error:', error)
    return NextResponse.json(
      { error: 'API error' },
      { status: 500 }
    )
  }
}
