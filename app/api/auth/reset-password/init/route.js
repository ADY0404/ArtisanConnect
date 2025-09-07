import { NextResponse } from 'next/server'
import { User } from '@/models/User'
import crypto from 'crypto'
import { EmailService } from '@/app/_services/EmailService'

// Validate token and send OTP
export async function POST(request) {
  try {
    const { token } = await request.json()
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
    const user = await User.findByPasswordResetToken(hashedToken)
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    }

    // Generate 6-digit OTP
    const otp = (Math.floor(100000 + Math.random() * 900000)).toString()
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex')
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await User.setPasswordResetOtp(user._id, otpHash, otpExpires)
    await EmailService.sendPasswordResetOtpEmail(user.email, otp)

    return NextResponse.json({ message: 'OTP sent to email' })
  } catch (error) {
    console.error('❌ Reset init error:', error)
    return NextResponse.json({ error: 'Failed to initialize reset' }, { status: 500 })
  }
}


