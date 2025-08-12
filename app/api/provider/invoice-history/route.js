import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    // Only allow providers to access their own invoice history
    if (session.user.role !== 'PROVIDER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        error: 'Provider access required'
      }, { status: 403 })
    }

    const { db } = await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const providerEmail = searchParams.get('providerEmail') || session.user.email

    // For non-admin users, ensure they can only access their own invoices
    const targetEmail = session.user.role === 'ADMIN' ? providerEmail : session.user.email

    console.log(`📋 Fetching invoice history for provider: ${targetEmail}`)

    // Get provider's business listings first
    const businessLists = await db.collection('businesslists')
      .find({ providerEmail: targetEmail })
      .toArray()

    if (businessLists.length === 0) {
      console.log(`⚠️ No business listings found for provider: ${targetEmail}`)
      return NextResponse.json({
        success: true,
        invoices: [],
        summary: {
          totalInvoices: 0,
          totalRevenue: 0,
          totalCommission: 0,
          totalNetAmount: 0,
          paidInvoices: 0,
          pendingInvoices: 0
        },
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      })
    }

    const businessIds = businessLists.map(b => b._id)

    // Build query conditions for bookings with invoices
    const queryConditions = {
      businessId: { $in: businessIds },
      invoiceGenerated: true,
      invoiceId: { $exists: true, $ne: null }
    }

    if (status && status !== 'all') {
      // Map status to booking fields
      if (status === 'PAID') {
        queryConditions.paymentStatus = 'COMPLETED'
      } else if (status === 'PENDING') {
        queryConditions.paymentStatus = { $in: ['PENDING', 'PROCESSING'] }
      } else if (status === 'OVERDUE') {
        queryConditions.paymentStatus = 'OVERDUE'
      }
    }

    if (startDate || endDate) {
      queryConditions.serviceCompletionDate = {}
      if (startDate) queryConditions.serviceCompletionDate.$gte = new Date(startDate)
      if (endDate) queryConditions.serviceCompletionDate.$lte = new Date(endDate)
    }

    // Add search functionality
    if (search) {
      queryConditions.$or = [
        { invoiceId: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { serviceDetails: { $regex: search, $options: 'i' } }
      ]
    }

    const skip = (page - 1) * limit

    // Get bookings with invoices (these are our invoices)
    const invoiceBookings = await db.collection('bookings').find(queryConditions)
      .sort({ serviceCompletionDate: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const totalInvoices = await db.collection('bookings').countDocuments(queryConditions)

    console.log(`📋 Found ${invoiceBookings.length} invoice bookings for provider: ${targetEmail}`)

    // Calculate summary statistics from the invoice bookings
    const allInvoiceBookings = await db.collection('bookings').find({
      businessId: { $in: businessIds },
      invoiceGenerated: true,
      invoiceId: { $exists: true, $ne: null }
    }).toArray()

    const summary = {
      totalInvoices: allInvoiceBookings.length,
      totalRevenue: allInvoiceBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
      totalCommission: allInvoiceBookings.reduce((sum, b) => sum + (b.platformCommission || 0), 0),
      totalNetAmount: allInvoiceBookings.reduce((sum, b) => sum + (b.providerPayout || 0), 0),
      paidInvoices: allInvoiceBookings.filter(b => b.paymentStatus === 'COMPLETED').length,
      pendingInvoices: allInvoiceBookings.filter(b => b.paymentStatus === 'PENDING' || b.paymentStatus === 'PROCESSING').length
    }

    // Format invoice bookings for response
    const formattedInvoices = invoiceBookings.map(booking => ({
      id: booking._id,
      invoiceNumber: booking.invoiceId, // The invoiceId is our invoice number
      customerName: booking.userName,
      customerEmail: booking.userEmail,
      serviceDescription: booking.serviceDetails || booking.note || 'Service',
      serviceDate: booking.date,
      totalAmount: booking.totalAmount || 0,
      commissionAmount: booking.platformCommission || 0,
      netAmount: booking.providerPayout || 0,
      paymentMethod: booking.paymentMethod || 'CASH',
      paymentStatus: booking.paymentStatus || 'PENDING',
      generatedAt: booking.serviceCompletionDate || booking.updatedAt,
      emailSent: booking.emailSent || false,
      emailSentAt: booking.emailSentAt,
      dueDate: booking.dueDate,
      additionalNotes: booking.additionalNotes || booking.note
    }))

    console.log(`✅ Retrieved ${formattedInvoices.length} invoices for ${targetEmail}`)

    return NextResponse.json({
      success: true,
      invoices: formattedInvoices,
      summary,
      pagination: {
        page,
        limit,
        total: totalInvoices,
        totalPages: Math.ceil(totalInvoices / limit),
        hasNext: page * limit < totalInvoices,
        hasPrev: page > 1
      },
      filters: {
        search,
        status,
        startDate,
        endDate
      }
    })

  } catch (error) {
    console.error('❌ Error fetching invoice history:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch invoice history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

// POST endpoint for bulk operations (mark as paid, resend emails, etc.)
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const { action, invoiceIds, data } = await request.json()

    if (!action || !invoiceIds || !Array.isArray(invoiceIds)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data'
      }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const results = []

    switch (action) {
      case 'mark_paid':
        // Mark bookings/invoices as paid
        for (const invoiceId of invoiceIds) {
          try {
            // Get provider's business IDs for security
            const businessLists = await db.collection('businesslists')
              .find({ providerEmail: session.user.email })
              .toArray()
            const businessIds = businessLists.map(b => b._id)

            const result = await db.collection('bookings').updateOne(
              {
                _id: new ObjectId(invoiceId),
                businessId: { $in: businessIds }, // Ensure provider can only update their own bookings
                invoiceGenerated: true
              },
              {
                $set: {
                  paymentStatus: 'COMPLETED',
                  paidAt: new Date(),
                  paidBy: session.user.email,
                  updatedAt: new Date()
                }
              }
            )

            results.push({
              invoiceId,
              success: result.modifiedCount > 0,
              message: result.modifiedCount > 0 ? 'Marked as paid' : 'Invoice not found or already updated'
            })
          } catch (error) {
            results.push({
              invoiceId,
              success: false,
              message: error.message
            })
          }
        }
        break

      case 'resend_email':
        // Resend invoice emails
        const { InvoiceEmailService } = await import('@/app/_services/InvoiceEmailService')
        
        for (const invoiceId of invoiceIds) {
          try {
            const result = await InvoiceEmailService.resendInvoiceEmail(invoiceId)
            results.push({
              invoiceId,
              success: result.success,
              message: result.success ? 'Email resent successfully' : result.error
            })
          } catch (error) {
            results.push({
              invoiceId,
              success: false,
              message: error.message
            })
          }
        }
        break

      case 'update_notes':
        // Update invoice notes
        const { notes } = data || {}
        if (!notes) {
          return NextResponse.json({
            success: false,
            error: 'Notes are required for update_notes action'
          }, { status: 400 })
        }

        for (const invoiceId of invoiceIds) {
          try {
            // Get provider's business IDs for security
            const businessLists = await db.collection('businesslists')
              .find({ providerEmail: session.user.email })
              .toArray()
            const businessIds = businessLists.map(b => b._id)

            const result = await db.collection('bookings').updateOne(
              {
                _id: new ObjectId(invoiceId),
                businessId: { $in: businessIds },
                invoiceGenerated: true
              },
              {
                $set: {
                  additionalNotes: notes,
                  updatedAt: new Date(),
                  updatedBy: session.user.email
                }
              }
            )
            
            results.push({
              invoiceId,
              success: result.modifiedCount > 0,
              message: result.modifiedCount > 0 ? 'Notes updated' : 'Invoice not found'
            })
          } catch (error) {
            results.push({
              invoiceId,
              success: false,
              message: error.message
            })
          }
        }
        break

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`
        }, { status: 400 })
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    console.log(`✅ Bulk operation ${action} completed: ${successCount} success, ${failureCount} failures`)

    return NextResponse.json({
      success: true,
      message: `Bulk operation completed: ${successCount} success, ${failureCount} failures`,
      results,
      summary: {
        total: results.length,
        success: successCount,
        failures: failureCount
      }
    })

  } catch (error) {
    console.error('❌ Error performing bulk operation:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to perform bulk operation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
