"use client"

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, AlertCircle, ArrowLeft } from 'lucide-react'

// Loading component for Suspense boundary
function PaymentCallbackLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <CardTitle className="text-2xl">Loading Payment Status</CardTitle>
          <CardDescription>
            Please wait while we check your payment...
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}

// Main callback component that uses search params
function PaymentCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [verificationStatus, setVerificationStatus] = useState('verifying') // verifying, success, failed, error
  const [paymentData, setPaymentData] = useState(null)
  const [error, setError] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Safely get search parameters with fallbacks
  const reference = searchParams?.get('reference') || ''
  const status = searchParams?.get('status') || '' // For mock payments

  const verifyPayment = useCallback(async () => {
    try {
      setVerificationStatus('verifying')
      
      // If this is a mock payment with status parameter, handle it directly
      if (status) {
        await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate verification delay
        
        if (status === 'success') {
          setPaymentData({
            reference: reference,
            amount: 'Mock Amount',
            status: 'success',
            gateway_response: 'Mock payment successful',
            paid_at: new Date().toISOString(),
            mock: true
          })
          setVerificationStatus('success')
        } else {
          setVerificationStatus('failed')
        }
        return
      }
      
      // For real payments, verify with the API
      // Check if this is a commission payment (reference starts with COMM_)
      const isCommissionPayment = reference.startsWith('COMM_')
      const verifyEndpoint = isCommissionPayment
        ? '/api/provider/commission-payment/verify'
        : '/api/payments/verify'

      console.log(`🔍 Verifying ${isCommissionPayment ? 'commission' : 'regular'} payment:`, reference)

      const response = await fetch(verifyEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reference })
      })

      const result = await response.json()

      if (result.success) {
        // For commission payments, the data structure is different
        if (isCommissionPayment) {
          setPaymentData({
            reference: result.data.reference,
            amount: `GHS ${result.data.amount.toFixed(2)}`,
            status: 'success',
            gateway_response: 'Commission payment successful',
            paid_at: result.data.paid_at,
            transactionsUpdated: result.data.transactionsUpdated,
            isCommissionPayment: true
          })
        } else {
          setPaymentData(result.data)
        }
        setVerificationStatus('success')
      } else {
        setVerificationStatus('failed')
        setError(result.error || 'Payment verification failed')
      }
      
    } catch (error) {
      console.error('Payment verification error:', error)
      setVerificationStatus('error')
      setError('Failed to verify payment')
    }
  }, [reference, status])

  const handleGoHome = () => {
    router.push('/')
  }

  const handleGoBack = () => {
    router.back()
  }

  const handleRetryPayment = () => {
    // You can implement retry logic here
    router.back()
  }

  useEffect(() => {
    // Mark as loaded after component mounts
    setIsLoaded(true)

    // Only proceed with verification if we have a reference
    if (reference) {
      verifyPayment()
    } else if (typeof window !== 'undefined') {
      // Only set error state on client side
      setVerificationStatus('error')
      setError('Missing payment reference')
    }
  }, [reference, verifyPayment])

  // Show loading state until component is fully loaded
  if (!isLoaded) {
    return <PaymentCallbackLoading />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Payment Status</CardTitle>
          <CardDescription>
            {verificationStatus === 'verifying' && 'Verifying your payment...'}
            {verificationStatus === 'success' && 'Payment completed successfully'}
            {verificationStatus === 'failed' && 'Payment was not successful'}
            {verificationStatus === 'error' && 'An error occurred'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Verifying State */}
          {verificationStatus === 'verifying' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Verifying Payment</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Please wait while we confirm your payment...
                </p>
              </div>
            </div>
          )}

          {/* Success State */}
          {verificationStatus === 'success' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-600">
                  {paymentData?.isCommissionPayment ? 'Commission Payment Successful!' : 'Payment Successful!'}
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  {paymentData?.isCommissionPayment
                    ? 'Your commission payment has been processed and your amount owed has been reset to 0.'
                    : 'Your payment has been processed successfully.'
                  }
                </p>
                {paymentData?.transactionsUpdated && (
                  <p className="text-xs text-green-600 mt-1">
                    ✅ {paymentData.transactionsUpdated} commission transactions updated
                  </p>
                )}
                {paymentData?.mock && (
                  <p className="text-xs text-blue-600 mt-1">
                    (This was a mock payment for testing)
                  </p>
                )}
              </div>
              
              {paymentData && (
                <div className="bg-gray-50 p-4 rounded-lg text-left space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Reference:</span>
                    <span className="text-sm font-mono">{paymentData.reference}</span>
                  </div>
                  {paymentData.amount && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Amount:</span>
                      <span className="text-sm font-semibold">{paymentData.amount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className="text-sm text-green-600 font-semibold">Success</span>
                  </div>
                  {paymentData.paid_at && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Date:</span>
                      <span className="text-sm">{new Date(paymentData.paid_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
              
              <Button onClick={handleGoHome} className="w-full">
                Continue
              </Button>
            </div>
          )}

          {/* Failed State */}
          {verificationStatus === 'failed' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-600">Payment Failed</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Your payment could not be processed.
                </p>
                {error && (
                  <p className="text-xs text-red-600 mt-1">
                    {error}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Button onClick={handleRetryPayment} className="w-full">
                  Try Again
                </Button>
                <Button onClick={handleGoHome} variant="outline" className="w-full">
                  Go Home
                </Button>
              </div>
            </div>
          )}

          {/* Error State */}
          {verificationStatus === 'error' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-yellow-600">Verification Error</h3>
                <p className="text-sm text-gray-600 mt-2">
                  We couldn't verify your payment status.
                </p>
                {error && (
                  <p className="text-xs text-red-600 mt-1">
                    {error}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Button onClick={verifyPayment} className="w-full">
                  Retry Verification
                </Button>
                <Button onClick={handleGoBack} variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
              </div>
            </div>
          )}

          {/* Reference Display */}
          {reference && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Reference:</strong> {reference}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

// Main page component with Suspense boundary
export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<PaymentCallbackLoading />}>
      <PaymentCallbackContent />
    </Suspense>
  )
}
