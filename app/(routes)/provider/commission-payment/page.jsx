"use client"
import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { 
  CreditCard, 
  Banknote, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Receipt,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

function CommissionPaymentPage() {
  const { data: session } = useSession()
  const [commissionData, setCommissionData] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('paystack')
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedTransactions, setSelectedTransactions] = useState([])

  useEffect(() => {
    if (session?.user) {
      loadCommissionData()
    }
  }, [session])

  const loadCommissionData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/provider/commission-summary')
      
      if (response.ok) {
        const data = await response.json()
        setCommissionData(data.summary)
        
        // Auto-select all pending transactions
        if (data.transactions) {
          const pendingTransactions = data.transactions.filter(t => 
            t.paymentMethod === 'CASH' && t.commissionStatus === 'PENDING'
          )
          setSelectedTransactions(pendingTransactions.map(t => t._id))
        }
      } else {
        toast.error('Failed to load commission data')
      }
    } catch (error) {
      console.error('Error loading commission data:', error)
      toast.error('Failed to load commission data')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method)
  }

  const handlePayCommission = async () => {
    if (commissionData.totalOwed === 0) {
      toast.info('No outstanding commission to pay')
      return
    }

    try {
      setIsProcessing(true)

      if (paymentMethod === 'paystack') {
        // Initialize Paystack payment
        const response = await fetch('/api/provider/commission-payment/initialize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: commissionData.totalOwed,
            transactionIds: selectedTransactions
          })
        })

        const result = await response.json()

        if (result.success) {
          // Redirect to Paystack payment page
          window.location.href = result.authorization_url
        } else {
          toast.error(result.error || 'Failed to initialize payment')
        }
      } else {
        // Handle manual payment confirmation
        const response = await fetch('/api/provider/commission-payment/manual', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: commissionData.totalOwed,
            transactionIds: selectedTransactions,
            paymentMethod: 'manual'
          })
        })

        const result = await response.json()

        if (result.success) {
          toast.success('Payment recorded. Awaiting admin verification.')
          loadCommissionData() // Refresh data
        } else {
          toast.error(result.error || 'Failed to record payment')
        }
      }
    } catch (error) {
      console.error('Error processing payment:', error)
      toast.error('Payment processing failed')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/provider/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Commission Payment</h1>
          <p className="text-muted-foreground">
            Pay your outstanding commission to the platform
          </p>
        </div>
      </div>

      {/* Commission Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Commission Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-3xl font-bold text-red-600">
                GHS {commissionData?.totalOwed?.toFixed(2) || '0.00'}
              </p>
              <p className="text-sm text-muted-foreground">Outstanding Commission</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">
                GHS {commissionData?.totalEarned?.toFixed(2) || '0.00'}
              </p>
              <p className="text-sm text-muted-foreground">Total Earned</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">
                {commissionData?.pendingTransactions || 0}
              </p>
              <p className="text-sm text-muted-foreground">Pending Transactions</p>
            </div>
          </div>

          {commissionData?.totalOwed > 0 && (
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <p className="font-medium text-orange-800">
                  Commission Payment Required
                </p>
              </div>
              <p className="text-sm text-orange-600 mt-1">
                You have outstanding commission of GHS {commissionData.totalOwed.toFixed(2)} 
                from cash payments that needs to be paid to the platform.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      {commissionData?.totalOwed > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={paymentMethod} onValueChange={handlePaymentMethodChange}>
              {/* Paystack Payment */}
              <Card className={`cursor-pointer transition-colors ${
                paymentMethod === 'paystack' ? 'ring-2 ring-primary' : ''
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="paystack" id="paystack" />
                    <Label htmlFor="paystack" className="flex items-center gap-3 cursor-pointer flex-1">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Pay with Paystack</p>
                        <p className="text-sm text-muted-foreground">
                          Secure online payment with card, bank transfer, or mobile money
                        </p>
                      </div>
                    </Label>
                    {paymentMethod === 'paystack' && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Manual Payment */}
              <Card className={`cursor-pointer transition-colors ${
                paymentMethod === 'manual' ? 'ring-2 ring-primary' : ''
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="manual" id="manual" />
                    <Label htmlFor="manual" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Banknote className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Manual Payment</p>
                        <p className="text-sm text-muted-foreground">
                          Pay via bank transfer or mobile money and confirm manually
                        </p>
                      </div>
                    </Label>
                    {paymentMethod === 'manual' && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Payment Action */}
      {commissionData?.totalOwed > 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Total Amount to Pay</p>
                <p className="text-2xl font-bold text-primary">
                  GHS {commissionData.totalOwed.toFixed(2)}
                </p>
              </div>
              <Button 
                onClick={handlePayCommission}
                disabled={isProcessing}
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Receipt className="h-4 w-4 mr-2" />
                    Pay Commission
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">All Commissions Paid</h3>
            <p className="text-muted-foreground">
              You have no outstanding commission payments. Great job!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default CommissionPaymentPage
