"use client"
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Receipt,
  CreditCard,
  Banknote
} from 'lucide-react'

function CommissionTracker({ providerEmail }) {
  const [commissionData, setCommissionData] = useState({
    totalOwed: 0,
    totalEarned: 0,
    pendingTransactions: 0,
    lastPayment: null,
    breakdown: {
      cash: { count: 0, amount: 0, commission: 0 },
      paystack: { count: 0, amount: 0, commission: 0 }
    }
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (providerEmail) {
      loadCommissionData()
    }
  }, [providerEmail])

  const loadCommissionData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/provider/commission-summary')
      
      if (response.ok) {
        const data = await response.json()
        setCommissionData(data.summary || commissionData)
      } else {
        // Mock data for demonstration
        setCommissionData({
          totalOwed: 285.50,
          totalEarned: 1240.00,
          pendingTransactions: 3,
          lastPayment: {
            date: '2024-01-15',
            amount: 125.00,
            method: 'Bank Transfer'
          },
          breakdown: {
            cash: { count: 8, amount: 1586.00, commission: 285.50 },
            paystack: { count: 12, amount: 2890.00, commission: 520.20 }
          }
        })
      }
    } catch (error) {
      console.error('Error loading commission data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getCommissionStatus = () => {
    if (commissionData.totalOwed === 0) {
      return {
        status: 'good',
        message: 'All commissions up to date',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        icon: <CheckCircle className="h-4 w-4" />
      }
    } else if (commissionData.totalOwed < 500) {
      return {
        status: 'warning',
        message: 'Commission payment due soon',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        icon: <Clock className="h-4 w-4" />
      }
    } else {
      return {
        status: 'urgent',
        message: 'Commission payment overdue',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        icon: <AlertTriangle className="h-4 w-4" />
      }
    }
  }

  const statusInfo = getCommissionStatus()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Commission Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Commission Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Commission Status Alert */}
        <div className={`flex items-center gap-3 p-3 rounded-lg ${statusInfo.bgColor}`}>
          <div className={statusInfo.color}>
            {statusInfo.icon}
          </div>
          <div className="flex-1">
            <p className={`font-medium ${statusInfo.color}`}>
              {statusInfo.message}
            </p>
            {commissionData.totalOwed > 0 && (
              <p className="text-sm text-muted-foreground">
                Amount owed: GHS {commissionData.totalOwed.toFixed(2)}
              </p>
            )}
          </div>
        </div>

        {/* Commission Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">
              GHS {commissionData.totalOwed.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">Amount Owed</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              GHS {commissionData.totalEarned.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">Total Earned</p>
          </div>
        </div>

        <Separator />

        {/* Payment Method Breakdown */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Payment Method Breakdown</h4>
          
          {/* Cash Payments */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Banknote className="h-4 w-4 text-green-600" />
              <div>
                <p className="font-medium">Cash Payments</p>
                <p className="text-sm text-muted-foreground">
                  {commissionData.breakdown.cash.count} transactions
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">
                GHS {commissionData.breakdown.cash.amount.toFixed(2)}
              </p>
              <p className="text-sm text-red-600">
                Commission: GHS {commissionData.breakdown.cash.commission.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Paystack Payments */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <div>
                <p className="font-medium">Paystack Payments</p>
                <p className="text-sm text-muted-foreground">
                  {commissionData.breakdown.paystack.count} transactions
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">
                GHS {commissionData.breakdown.paystack.amount.toFixed(2)}
              </p>
              <p className="text-sm text-green-600">
                Commission: GHS {commissionData.breakdown.paystack.commission.toFixed(2)} (Auto-deducted)
              </p>
            </div>
          </div>
        </div>

        {/* Last Payment Info */}
        {commissionData.lastPayment && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Last Commission Payment</h4>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Date:</span>
                <span>{new Date(commissionData.lastPayment.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">GHS {commissionData.lastPayment.amount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Method:</span>
                <span>{commissionData.lastPayment.method}</span>
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        {commissionData.totalOwed > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => window.open('/provider/commission-payment', '_blank')}
              >
                <Receipt className="h-4 w-4 mr-2" />
                Pay Commission Online
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                You can also pay commission via mobile money or bank transfer
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default CommissionTracker
