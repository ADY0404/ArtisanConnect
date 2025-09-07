import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { User } from '@/models/User'
import { Database } from '@/lib/database'
import { EmailService } from '@/app/_services/EmailService'

export async function POST(request) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const isDbHealthy = await Database.healthCheck()
    if (!isDbHealthy) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const user = await User.findByEmail(email)
    // Respond generically to avoid account enumeration
    if (!user) {
      return NextResponse.json({ message: 'If an account exists, a reset email has been sent.' })
    }

    // Generate reset token (store hashed)
    const rawToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    await User.setPasswordResetToken(email, hashedToken, expiresAt)

    // Send reset link email with raw token
    await EmailService.sendPasswordResetLinkEmail(email, rawToken)

    return NextResponse.json({ message: 'If an account exists, a reset email has been sent.' })
  } catch (error) {
    console.error('❌ Forgot password error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' })
}


