import { NextResponse } from 'next/server'
import { User } from '@/models/User'
import { Database } from '@/lib/database'
import { EmailService } from '@/app/_services/EmailService'
import crypto from 'crypto'

/**
 * User Registration API Endpoint
 * POST /api/auth/register
 */
export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json()
    const { name, email, password, role = 'CUSTOMER' } = body

    // Input validation
    const validationError = validateRegistrationInput({ name, email, password, role })
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      )
    }

    // Check database connection
    const isDbHealthy = await Database.healthCheck()
    if (!isDbHealthy) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      )
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const emailVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex')

    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create user
    const result = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role.toUpperCase(),
      emailVerificationToken,
      emailVerificationExpires,
    })

    // Send verification email
    try {
      await EmailService.sendVerificationEmail(result.user.email, verificationToken)
    } catch (emailError) {
      console.error(`❌ Failed to send verification email, but user was created: ${result.user.email}`)
      // Even if email fails, user is created. They can request another verification link later.
      // For now, we continue and return a success response.
    }

    // Log successful registration (without sensitive data)
    console.log(`✅ New user registered (pending verification): ${result.user.email} (${result.user.role})`)

    return NextResponse.json(
      { 
        message: 'User created successfully. Please check your email to verify your account.',
        userId: result.userId,
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('❌ Registration error:', error)

    // Handle specific errors
    if (error.message === 'User already exists with this email') {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Generic error response
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}

/**
 * Validate registration input
 * @param {Object} data - Registration data
 * @returns {string|null} Error message or null if valid
 */
function validateRegistrationInput({ name, email, password, role }) {
  // Name validation
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return 'Name must be at least 2 characters long'
  }

  if (name.trim().length > 50) {
    return 'Name must be less than 50 characters'
  }

  // Email validation
  if (!email || typeof email !== 'string') {
    return 'Valid email is required'
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address'
  }

  if (email.length > 100) {
    return 'Email must be less than 100 characters'
  }

  // Password validation
  if (!password || typeof password !== 'string') {
    return 'Password is required'
  }

  if (password.length < 6) {
    return 'Password must be at least 6 characters long'
  }

  if (password.length > 128) {
    return 'Password must be less than 128 characters'
  }

  // Password strength check
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    return 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  }

  // Role validation
  const validRoles = ['CUSTOMER', 'PROVIDER', 'ADMIN']
  if (role && !validRoles.includes(role.toUpperCase())) {
    return 'Invalid role specified'
  }

  return null
}

/**
 * Health check endpoint
 * GET /api/auth/register
 */
export async function GET() {
  try {
    const isDbHealthy = await Database.healthCheck()
    
    return NextResponse.json({
      status: 'Registration endpoint active',
      database: isDbHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Service unavailable' },
      { status: 503 }
    )
  }
} 