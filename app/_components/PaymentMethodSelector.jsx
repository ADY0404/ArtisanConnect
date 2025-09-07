"use client"
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  CreditCard, 
  Banknote, 
  CheckCircle,
  AlertCircle,
  Info,
  DollarSign
} from 'lucide-react'

function PaymentMethodSelector({ booking, onPaymentMethodSelected, onClose }) {
  const [selectedMethod, setSelectedMethod] = useState('CASH')
  const [paystackReference, setPaystackReference] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [commissionRate, setCommissionRate] = useState(0.18)

  // Fetch provider commission rate from server summary
  useEffect(() => {
    const loadRate = async () => {
      try {
        const resp = await fetch('/api/provider/commission-summary')
        if (resp.ok) {
          const data = await resp.json()
          console.log('🔍 PaymentMethodSelector API response:', data)
          // data.summary.commissionRate is decimal (e.g., 0.18)
          if (data?.summary?.commissionRate) {
            setCommissionRate(data.summary.commissionRate)
            console.log('✅ PaymentMethodSelector set rate to:', data.summary.commissionRate)
          }
        }
      } catch (e) {
        console.error('❌ PaymentMethodSelector error loading rate:', e)
      }
    }
    loadRate()
  }, [])

  // Calculate commission breakdown
  const calculateCommissionBreakdown = (method) => {
    const amount = booking.totalAmount || 0
    const rate = Number.isFinite(commissionRate) ? commissionRate : 0.18
    const platformCommission = amount * rate

    if (method === 'PAYSTACK') {
      return {
        totalAmount: amount,
        platformCommission: platformCommission,
        providerPayout: amount - platformCommission,
        commissionOwed: 0,
        message: 'Commission automatically deducted from payment'
      }
    } else {
      return {
        totalAmount: amount,
        platformCommission: 0,
        providerPayout: amount,
        commissionOwed: platformCommission,
        message: 'You will owe commission to the platform'
      }
    }
  }

  const breakdown = calculateCommissionBreakdown(selectedMethod)

  const handleUpdatePaymentMethod = async () => {
    if (selectedMethod === 'PAYSTACK' && !paystackReference.trim()) {
      toast.error('Please enter the Paystack transaction reference')
      return
    }

    try {
      setIsUpdating(true)

      const updateData = {
        bookingId: booking._id,
        paymentMethod: selectedMethod,
        paystackReference: selectedMethod === 'PAYSTACK' ? paystackReference : null
      }

      const response = await fetch('/api/provider/update-payment-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Payment method updated successfully!')
        onPaymentMethodSelected(result.booking)
        onClose()
      } else {
        toast.error(result.error || 'Failed to update payment method')
      }
    } catch (error) {
      console.error('Error updating payment method:', error)
      toast.error('Failed to update payment method')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <DollarSign className="h-6 w-6 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">Update Payment Method</h3>
          <p className="text-sm text-muted-foreground">
            Specify how the customer paid for this service
          </p>
        </div>
      </div>

      {/* Service Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Service Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">Customer</Label>
              <p className="font-medium">{booking.userName}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Service Amount</Label>
              <p className="font-medium">GHS {booking.totalAmount?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="col-span-2">
              <Label className="text-muted-foreground">Invoice ID</Label>
              <p className="font-medium font-mono text-xs">{booking.invoiceId}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      <div className="space-y-4">
        <Label className="text-base font-medium">How did the customer pay?</Label>
        
        <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
          {/* Cash Payment Option */}
          <Card className={`cursor-pointer transition-colors ${
            selectedMethod === 'CASH' ? 'ring-2 ring-primary' : ''
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="CASH" id="cash" />
                <Label htmlFor="cash" className="flex items-center gap-3 cursor-pointer flex-1">
                  <Banknote className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Cash Payment</p>
                    <p className="text-sm text-muted-foreground">
                      Customer paid in cash directly to you
                    </p>
                  </div>
                </Label>
                {selectedMethod === 'CASH' && (
                  <CheckCircle className="h-5 w-5 text-primary" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Paystack Payment Option */}
          <Card className={`cursor-pointer transition-colors ${
            selectedMethod === 'PAYSTACK' ? 'ring-2 ring-primary' : ''
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="PAYSTACK" id="paystack" />
                <Label htmlFor="paystack" className="flex items-center gap-3 cursor-pointer flex-1">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Paystack Payment</p>
                    <p className="text-sm text-muted-foreground">
                      Customer paid through the app using Paystack
                    </p>
                  </div>
                </Label>
                {selectedMethod === 'PAYSTACK' && (
                  <CheckCircle className="h-5 w-5 text-primary" />
                )}
              </div>
              
              {selectedMethod === 'PAYSTACK' && (
                <div className="mt-4 pl-8">
                  <Label htmlFor="reference" className="text-sm">
                    Paystack Transaction Reference
                  </Label>
                  <Input
                    id="reference"
                    placeholder="Enter transaction reference (e.g., T123456789)"
                    value={paystackReference}
                    onChange={(e) => setPaystackReference(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    You can find this in your Paystack dashboard or transaction receipt
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </RadioGroup>
      </div>

      {/* Commission Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="h-4 w-4" />
            Commission Impact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service Amount:</span>
              <span className="font-medium">GHS {breakdown.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform Fee ({(commissionRate * 100).toFixed(1)}%):</span>
              <span className="font-medium">
                GHS {(breakdown.platformCommission || breakdown.commissionOwed).toFixed(2)}
              </span>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            {selectedMethod === 'PAYSTACK' ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div className="text-sm">
                  <p className="font-medium text-green-800">
                    You'll receive: GHS {breakdown.providerPayout.toFixed(2)}
                  </p>
                  <p className="text-green-600">{breakdown.message}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <div className="text-sm">
                  <p className="font-medium text-orange-800">
                    You received: GHS {breakdown.providerPayout.toFixed(2)}
                  </p>
                  <p className="text-orange-600">
                    You owe platform: GHS {breakdown.commissionOwed.toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleUpdatePaymentMethod}
          disabled={isUpdating || (selectedMethod === 'PAYSTACK' && !paystackReference.trim())}
          className="flex-1"
        >
          {isUpdating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Updating...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Update Payment Method
            </>
          )}
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

export default PaymentMethodSelector
