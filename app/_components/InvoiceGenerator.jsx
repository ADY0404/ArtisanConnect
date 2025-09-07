"use client"
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  Receipt, 
  CreditCard, 
  Banknote, 
  Calculator,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

function InvoiceGenerator({ booking, onInvoiceGenerated, onClose }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [servicePrice, setServicePrice] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [commissionBreakdown, setCommissionBreakdown] = useState(null)
  const [commissionRate, setCommissionRate] = useState(0.18)

  // Load current provider commission rate (decimal) for preview
  useEffect(() => {
    const loadRate = async () => {
      try {
        const resp = await fetch('/api/provider/commission-summary')
        if (resp.ok) {
          const data = await resp.json()
          console.log('🔍 InvoiceGenerator API response:', data)
          const raw = data?.summary?.commissionRate
          const parsed = Number(raw)
          console.log('🔍 Raw rate:', raw, 'Parsed rate:', parsed)
          if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) {
            setCommissionRate(parsed)
            console.log('✅ Set commission rate to:', parsed)
          } else {
            console.log('⚠️ Invalid rate, keeping default:', parsed)
          }
        }
      } catch (e) {
        console.error('❌ Error loading commission rate:', e)
      }
    }
    loadRate()
  }, [])

  // Calculate commission breakdown when price changes
  const calculateCommission = (price) => {
    if (!price || isNaN(price)) return null

    const amount = parseFloat(price)
    const rate = Number.isFinite(commissionRate) ? commissionRate : 0.18
    const platformCommission = amount * rate

    if (paymentMethod === 'PAYSTACK') {
      return {
        totalAmount: amount,
        platformCommission: platformCommission,
        providerPayout: amount - platformCommission,
        commissionOwed: 0,
        paymentMethod: 'PAYSTACK'
      }
    } else {
      return {
        totalAmount: amount,
        platformCommission: 0, // No immediate deduction for cash
        providerPayout: amount,
        commissionOwed: platformCommission,
        paymentMethod: 'CASH'
      }
    }
  }

  // Update commission breakdown when price, payment method, or rate changes
  React.useEffect(() => {
    if (servicePrice) {
      const breakdown = calculateCommission(servicePrice)
      setCommissionBreakdown(breakdown)
    } else {
      setCommissionBreakdown(null)
    }
  }, [servicePrice, paymentMethod, commissionRate])

  const handleGenerateInvoice = async () => {
    if (!servicePrice || parseFloat(servicePrice) <= 0) {
      toast.error('Please enter a valid service price')
      return
    }

    try {
      setIsGenerating(true)

      const invoiceData = {
        bookingId: booking.id || booking._id, // Handle both formats
        servicePrice: parseFloat(servicePrice),
        paymentMethod: paymentMethod,
        additionalNotes: additionalNotes,
        commissionBreakdown: commissionBreakdown
      }

      console.log('🧾 Generating invoice with data:', invoiceData)
      console.log('📋 Booking object:', booking)

      const response = await fetch('/api/provider/generate-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData)
      })

      const result = await response.json()
      console.log('📄 Invoice generation response:', result)

      if (response.ok && result.success) {
        toast.success('Invoice generated successfully!')
        onInvoiceGenerated(result.invoice)
        onClose()
      } else {
        console.error('❌ Invoice generation failed:', result)
        toast.error(result.error || 'Failed to generate invoice')
      }
    } catch (error) {
      console.error('Error generating invoice:', error)
      toast.error('Failed to generate invoice')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Receipt className="h-6 w-6 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">Generate Invoice</h3>
          <p className="text-sm text-muted-foreground">
            Create invoice for completed service
          </p>
        </div>
      </div>

      {/* Booking Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Service Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">Customer</Label>
              <p className="font-medium">{booking.userName}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Date</Label>
              <p className="font-medium">{new Date(booking.date).toLocaleDateString()}</p>
            </div>
            <div className="col-span-2">
              <Label className="text-muted-foreground">Service Description</Label>
              <p className="font-medium">{booking.serviceDetails || 'No description provided'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Input */}
      <div className="space-y-2">
        <Label htmlFor="servicePrice">Service Price (GHS)</Label>
        <Input
          id="servicePrice"
          type="number"
          placeholder="Enter service price"
          value={servicePrice}
          onChange={(e) => setServicePrice(e.target.value)}
          min="0"
          step="0.01"
        />
      </div>

      {/* Payment Method Selection */}
      <div className="space-y-3">
        <Label>Payment Method</Label>
        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="CASH" id="cash" />
            <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer">
              <Banknote className="h-4 w-4" />
              Cash Payment
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="PAYSTACK" id="paystack" />
            <Label htmlFor="paystack" className="flex items-center gap-2 cursor-pointer">
              <CreditCard className="h-4 w-4" />
              Paystack (Digital Payment)
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Commission Breakdown */}
      {commissionBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Commission Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Amount:</span>
                <span className="font-medium">GHS {commissionBreakdown.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Fee ({Number.isFinite(commissionRate) ? (commissionRate * 100).toFixed(1) : '18.0'}%):</span>
                <span className="font-medium">
                  GHS {Number.isFinite(commissionBreakdown.platformCommission || commissionBreakdown.commissionOwed) ? (commissionBreakdown.platformCommission || commissionBreakdown.commissionOwed).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              {paymentMethod === 'PAYSTACK' ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div className="text-sm">
                    <p className="font-medium text-green-800">
                      You'll receive: GHS {commissionBreakdown.providerPayout.toFixed(2)}
                    </p>
                    <p className="text-green-600">Commission automatically deducted</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <div className="text-sm">
                    <p className="font-medium text-orange-800">
                      You'll receive: GHS {commissionBreakdown.providerPayout.toFixed(2)}
                    </p>
                    <p className="text-orange-600">
                      You owe platform: GHS {commissionBreakdown.commissionOwed.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Add any additional notes about the service..."
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          rows={3}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleGenerateInvoice}
          disabled={!servicePrice || isGenerating}
          className="flex-1"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Generate Invoice
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

export default InvoiceGenerator
