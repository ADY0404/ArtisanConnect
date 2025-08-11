import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { ensureConnection } from '@/lib/mongodb'
import BusinessList from '@/models/BusinessList'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    await ensureConnection()

    const { businessId, documents } = await request.json()

    if (!businessId || !documents || !Array.isArray(documents)) {
      return NextResponse.json({
        success: false,
        error: 'Business ID and documents array are required'
      }, { status: 400 })
    }

    console.log(`📄 Saving ${documents.length} document(s) for business ${businessId}`)

    // Find the business and verify ownership
    const business = await BusinessList.findOne({
      _id: businessId,
      providerEmail: session.user.email
    })

    if (!business) {
      return NextResponse.json({
        success: false,
        error: 'Business not found or access denied'
      }, { status: 404 })
    }

    // Add documents to the business
    const newDocuments = documents.map(doc => ({
      type: doc.type,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      publicId: doc.publicId,
      fileSize: doc.fileSize,
      format: doc.format,
      uploadedAt: new Date(doc.uploadedAt)
    }))

    // Add to existing documents array
    business.documentsUploaded.push(...newDocuments)
    
    // Save the business
    await business.save()

    console.log(`✅ Saved ${newDocuments.length} documents to business ${business.name}`)

    return NextResponse.json({
      success: true,
      message: 'Documents saved successfully',
      documentsCount: business.documentsUploaded.length
    })
    
  } catch (error) {
    console.error('❌ Error saving documents:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to save documents'
    }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    await ensureConnection()

    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: 'Business ID is required'
      }, { status: 400 })
    }

    // Find the business and verify ownership
    const business = await BusinessList.findOne({
      _id: businessId,
      providerEmail: session.user.email
    })

    if (!business) {
      return NextResponse.json({
        success: false,
        error: 'Business not found or access denied'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      documents: business.documentsUploaded || []
    })
    
  } catch (error) {
    console.error('❌ Error fetching documents:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch documents'
    }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    await ensureConnection()

    const { businessId, documentId } = await request.json()

    if (!businessId || !documentId) {
      return NextResponse.json({
        success: false,
        error: 'Business ID and document ID are required'
      }, { status: 400 })
    }

    // Find the business and verify ownership
    const business = await BusinessList.findOne({
      _id: businessId,
      providerEmail: session.user.email
    })

    if (!business) {
      return NextResponse.json({
        success: false,
        error: 'Business not found or access denied'
      }, { status: 404 })
    }

    // Remove the document from the array
    const initialCount = business.documentsUploaded.length
    business.documentsUploaded = business.documentsUploaded.filter(
      doc => doc.publicId !== documentId
    )

    if (business.documentsUploaded.length === initialCount) {
      return NextResponse.json({
        success: false,
        error: 'Document not found'
      }, { status: 404 })
    }

    await business.save()

    console.log(`🗑️ Removed document ${documentId} from business ${business.name}`)

    return NextResponse.json({
      success: true,
      message: 'Document removed successfully'
    })
    
  } catch (error) {
    console.error('❌ Error removing document:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to remove document'
    }, { status: 500 })
  }
} 