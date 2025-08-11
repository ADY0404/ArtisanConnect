import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { User } from '@/models/User'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { userId } = params
    
    // Only allow users to remove their own avatar or admins to remove any avatar
    if (session.user.id !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // Get current user data to find the avatar URL
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // If user has an avatar, try to delete it from Cloudinary
    if (user.avatar) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = user.avatar.split('/')
        const publicIdWithExtension = urlParts[urlParts.length - 1]
        const publicId = publicIdWithExtension.split('.')[0]
        const fullPublicId = `user-avatars/${session.user.email}/${publicId}`
        
        // Delete from Cloudinary
        await cloudinary.uploader.destroy(fullPublicId)
        console.log(`✅ Deleted avatar from Cloudinary: ${fullPublicId}`)
      } catch (cloudinaryError) {
        console.error('⚠️ Failed to delete from Cloudinary:', cloudinaryError)
        // Continue with database update even if Cloudinary deletion fails
      }
    }
    
    // Remove avatar from user profile
    const result = await User.updateProfile(userId, { avatar: null })
    
    if (result.success) {
      // Note: Session update is handled on the client side
      // The session will be updated when the user refreshes or navigates
      console.log('✅ Avatar removed successfully for user:', userId)
      
      const response = NextResponse.json({ 
        success: true, 
        message: 'Profile picture removed successfully',
        timestamp: Date.now()
      })

      // Add cache control headers to prevent caching
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      response.headers.set('Last-Modified', new Date().toUTCString())
      response.headers.set('ETag', `"${Date.now()}"`)
      
      return response
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to remove profile picture' 
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Error removing avatar:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to remove profile picture' 
    }, { status: 500 })
  }
}