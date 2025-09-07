import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { User } from '@/models/User'

export async function POST(request) {
  try {
    const { token, otp, newPassword } = await request.json()
    if (!token || !otp || !newPassword) {
      return NextResponse.json({ error: 'Token, OTP, and new password are required' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex')

    const result = await User.completePasswordReset(hashedToken, hashedOtp, newPassword)
    if (!result.success) {
      return NextResponse.json({ error: 'Failed to reset password' }, { status: 400 })
    }

    return NextResponse.json({ message: 'Password reset successful' })
  } catch (error) {
    console.error('❌ Reset complete error:', error)
    return NextResponse.json({ error: 'Failed to complete reset' }, { status: 500 })
  }
}


