import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dbande9tt',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const businessId = formData.get('businessId') || 'temp'
    const documentType = formData.get('documentType') || 'general'

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Determine folder based on document type
    let folder = `business-documents/${businessId}/${documentType}`
    let transformations = []
    
    // Special handling for avatars
    if (documentType === 'avatar') {
      folder = `user-avatars/${session.user.email}`
      transformations = [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' }
      ]
    }

    // Upload to Cloudinary
    const uploadResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'auto', // Handles both images and PDFs
          public_id: `${documentType}_${Date.now()}`,
          transformation: transformations,
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error)
            reject(error)
          } else {
            resolve(result)
          }
        }
      ).end(buffer)
    })

    return NextResponse.json({
      success: true,
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
      format: uploadResponse.format,
      bytes: uploadResponse.bytes
    })

  } catch (error) {
    console.error('❌ Upload API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Upload failed'
    }, { status: 500 })
  }
} 