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

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    console.log('🔍 Users API session check:', session?.user?.email, session?.user?.role)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      console.log('❌ Users API unauthorized:', { 
        hasSession: !!session, 
        userRole: session?.user?.role 
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    const role = searchParams.get('role') || ''
    const search = searchParams.get('search') || ''

    console.log(' Fetching users for admin dashboard')

    const users = await User.getAllWithPagination(page, limit, { role, search })

    const response = NextResponse.json({
      success: true,
      users: users.users.map(user => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        avatar: user.avatar,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      })),
      pagination: users.pagination,
      timestamp: new Date().toISOString()
    })

    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response

  } catch (error) {
    console.error(' Admin users error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch users'
    }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions)
    console.log('🔍 Users PATCH API session check:', session?.user?.email, session?.user?.role)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      console.log('❌ Users PATCH API unauthorized:', { 
        hasSession: !!session, 
        userRole: session?.user?.role 
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, action, data } = await request.json()

    console.log(' Admin user action:', action, 'for user:', userId)

    let result
    switch (action) {
      case 'activate':
        result = await User.updateStatus(userId, true)
        break
      case 'deactivate':
        result = await User.updateStatus(userId, false)
        break
      case 'changeRole':
        result = await User.updateRole(userId, data.role)
        break
      case 'removeAvatar':
        // Get user data to find avatar URL
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
            const fullPublicId = `user-avatars/${user.email}/${publicId}`
            
            // Delete from Cloudinary
            await cloudinary.uploader.destroy(fullPublicId)
            console.log(`✅ Admin deleted avatar from Cloudinary: ${fullPublicId}`)
          } catch (cloudinaryError) {
            console.error('⚠️ Failed to delete from Cloudinary:', cloudinaryError)
            // Continue with database update even if Cloudinary deletion fails
          }
        }
        
        // Remove avatar from user profile
        result = await User.updateProfile(userId, { avatar: null })
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const response = NextResponse.json({
      success: true,
      message: 'User updated successfully',
      result
    })

    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response

  } catch (error) {
    console.error(' Admin user update error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update user'
    }, { status: 500 })
  }
}
