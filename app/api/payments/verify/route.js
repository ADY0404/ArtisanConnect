import { NextResponse } from 'next/server'
import PaystackService from '@/app/_services/PaystackService'

export async function POST(request) {
  try {
    console.log('🔍 Payment verification request received')
    
    const body = await request.json()
    const { reference } = body
    
    if (!reference) {
      return NextResponse.json(
        { success: false, error: 'Payment reference is required' },
        { status: 400 }
      )
    }
    
    console.log('📝 Verifying payment reference:', reference)
    
    // Use PaystackService which will automatically choose mock or real mode
    const result = await PaystackService.verifyPayment(reference)
    
    if (result.success) {
      console.log('✅ Payment verification successful:', reference)
      return NextResponse.json({
        success: true,
        data: result.data
      })
    } else {
      console.log('❌ Payment verification failed:', reference)
      return NextResponse.json(
        { success: false, error: 'Payment verification failed' },
        { status: 400 }
      )
    }
    
  } catch (error) {
    console.error('❌ Payment verification error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Payment verification failed' },
      { status: 500 }
    )
  }
}
