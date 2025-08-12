"use client"

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, CreditCard, ArrowLeft } from 'lucide-react'

// Loading component for Suspense boundary
function MockPaymentLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <CardTitle className="text-2xl">Loading Payment Gateway</CardTitle>
          <CardDescription>
            Please wait while we prepare your payment...
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}

// Main payment component that uses search params
function MockPaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [paymentStatus, setPaymentStatus] = useState('pending') // pending, success, failed
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Safely get search parameters with fallbacks
  const reference = searchParams?.get('reference') || ''
  const amount = searchParams?.get('amount') || ''
  const email = searchParams?.get('email') || ''

  useEffect(() => {
    // Mark as loaded after component mounts
    setIsLoaded(true)

    // Only redirect if we're on the client and missing required params
    if (typeof window !== 'undefined' && (!reference || !amount || !email)) {
      router.push('/')
    }
  }, [reference, amount, email, router])

  // Show loading state until component is fully loaded
  if (!isLoaded) {
    return <MockPaymentLoading />
  }

  const handlePaymentSuccess = async () => {
    setIsProcessing(true)
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setPaymentStatus('success')
    setIsProcessing(false)
    
    // Redirect to callback URL after 3 seconds
    setTimeout(() => {
      window.location.href = `/payment/callback?reference=${reference}&status=success`
    }, 3000)
  }

  const handlePaymentFailure = async () => {
    setIsProcessing(true)
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setPaymentStatus('failed')
    setIsProcessing(false)
    
    // Redirect to callback URL after 3 seconds
    setTimeout(() => {
      window.location.href = `/payment/callback?reference=${reference}&status=failed`
    }, 3000)
  }

  const handleGoBack = () => {
    router.back()
  }

  // Handle missing parameters gracefully
  if (!reference || !amount || !email) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-600">Invalid Payment Link</CardTitle>
            <CardDescription>
              Missing required payment parameters. Please check your payment link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  <strong>Missing Parameters:</strong>
                  {!reference && ' Reference'}
                  {!amount && ' Amount'}
                  {!email && ' Email'}
                </p>
              </div>
              <Button onClick={() => router.push('/')} className="w-full">
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Mock Payment Gateway</CardTitle>
          <CardDescription>
            This is a simulated payment page for testing purposes
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Payment Details */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Reference:</span>
              <span className="text-sm font-mono">{reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Amount:</span>
              <span className="text-sm font-semibold">GHS {amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Email:</span>
              <span className="text-sm">{email}</span>
            </div>
          </div>

          {/* Payment Status */}
          {paymentStatus === 'pending' && (
            <div className="space-y-4">
              <div className="text-center">
                <Badge variant="outline" className="mb-4">
                  🧪 Test Mode
                </Badge>
                <p className="text-sm text-gray-600 mb-4">
                  Choose how you want to simulate this payment:
                </p>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={handlePaymentSuccess}
                  disabled={isProcessing}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Simulate Successful Payment
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={handlePaymentFailure}
                  disabled={isProcessing}
                  variant="destructive"
                  className="w-full"
                >
                  {isProcessing ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Simulate Failed Payment
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={handleGoBack}
                  disabled={isProcessing}
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
              </div>
            </div>
          )}

          {paymentStatus === 'success' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-600">Payment Successful!</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Your mock payment has been processed successfully.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Redirecting you back to the application...
                </p>
              </div>
            </div>
          )}

          {paymentStatus === 'failed' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-600">Payment Failed!</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Your mock payment simulation failed as requested.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Redirecting you back to the application...
                </p>
              </div>
            </div>
          )}

          {/* Development Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <strong>Development Mode:</strong> This is a mock payment gateway for testing. 
              No real money will be charged.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

// Main page component with Suspense boundary
export default function MockPaymentPage() {
  return (
    <Suspense fallback={<MockPaymentLoading />}>
      <MockPaymentContent />
    </Suspense>
  )
}
