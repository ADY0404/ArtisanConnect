import { NextResponse } from 'next/server'
import { User } from '@/models/User'

export async function POST(request) {
  try {
    const { email, name, action } = await request.json()

    if (action === 'makeAdmin') {
      console.log(' Making user admin:', email)
      
      const result = await User.updateRole(null, 'ADMIN', email)
      
      if (result) {
        return NextResponse.json({
          success: true,
          message: 'User role updated to ADMIN',
          user: result
        })
      } else {
        return NextResponse.json({
          success: false,
          error: 'User not found'
        }, { status: 404 })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })

  } catch (error) {
    console.error(' Admin setup error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to setup admin user',
      details: error.message
    }, { status: 500 })
  }
}
