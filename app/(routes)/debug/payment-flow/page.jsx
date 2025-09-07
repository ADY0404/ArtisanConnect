"use client"
import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  CreditCard, 
  Receipt, 
  DollarSign,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Play,
  RefreshCw
} from 'lucide-react'

function PaymentFlowDebugPage() {
  const { data: session } = useSession()
  const [commissionData, setCommissionData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (session) {
      testCommissionAPI()
    }
  }, [session])

  const testCommissionAPI = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('🧪 Testing commission API with session:', session.user)
      
      const response = await fetch('/api/provider/commission-summary')
      console.log('📡 API Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Commission data received:', data)
        setCommissionData(data.summary)
      } else {
        const errorData = await response.json()
        console.error('❌ API Error:', errorData)
        setError(`API Error: ${response.status} - ${errorData.error}`)
      }
    } catch (error) {
      console.error('❌ Network Error:', error)
      setError(`Network Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const paymentStoryline = [
    {
      step: 1,
      title: "Service Completion",
      description: "Provider completes a service for a customer",
      details: "Customer books a service (e.g., plumbing repair), provider arrives and completes the work",
      status: "✅ Available in app",
      component: "BookingRequests.jsx"
    },
    {
      step: 2,
      title: "Invoice Generation",
      description: "Provider generates an invoice with service price",
      details: "Provider clicks 'Generate Invoice' button, enters service price, system calculates commission",
      status: "✅ Implemented",
      component: "InvoiceGenerator.jsx"
    },
    {
      step: 3,
      title: "Payment Method Selection",
      description: "Provider specifies how customer paid (Cash or Paystack)",
      details: "If Cash: Provider receives full amount, owes commission to platform. If Paystack: Commission auto-deducted",
      status: "✅ Implemented",
      component: "PaymentMethodSelector.jsx"
    },
    {
      step: 4,
      title: "Commission Tracking",
      description: "System tracks commission owed by provider",
      details: "For cash payments, commission is added to provider's outstanding balance",
      status: "✅ Implemented",
      component: "CommissionTracker.jsx"
    },
    {
      step: 5,
      title: "Commission Payment",
      description: "Provider pays outstanding commission to platform",
      details: "Provider can pay via Paystack online or record manual payment for admin verification",
      status: "✅ Implemented",
      component: "CommissionPaymentPage.jsx"
    },
    {
      step: 6,
      title: "Admin Oversight",
      description: "Admin monitors and manages all commission payments",
      details: "Admin dashboard shows all provider commission status, can send reminders, verify payments",
      status: "✅ Implemented",
      component: "AdminCommissionManagement.jsx"
    }
  ]

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Payment Flow Debug & Storyline</h1>
        <p className="text-muted-foreground">
          Complete payment storyline from service completion to commission payment
        </p>
      </div>

      {/* Session Debug */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Current Session Debug
          </CardTitle>
        </CardHeader>
        <CardContent>
          {session ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Email:</strong> {session.user.email}
                </div>
                <div>
                  <strong>Name:</strong> {session.user.name || 'Not set'}
                </div>
                <div>
                  <strong>Role:</strong> 
                  <Badge className="ml-2">
                    {session.user.role || 'No role set'}
                  </Badge>
                </div>
                <div>
                  <strong>ID:</strong> {session.user.id || 'Not set'}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <strong>Full Session Object:</strong>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(session, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <AlertCircle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <p>No active session. Please sign in to test payment features.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commission API Test */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Commission API Test
            <Button 
              size="sm" 
              variant="outline" 
              onClick={testCommissionAPI}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Test API
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p>Testing commission API...</p>
            </div>
          )}
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <strong className="text-red-800">API Error:</strong>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}
          
          {commissionData && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <strong className="text-green-800">API Working!</strong>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Total Owed:</strong> GHS {commissionData.totalOwed?.toFixed(2) || '0.00'}
                </div>
                <div>
                  <strong>Total Earned:</strong> GHS {commissionData.totalEarned?.toFixed(2) || '0.00'}
                </div>
                <div>
                  <strong>Pending Transactions:</strong> {commissionData.pendingTransactions || 0}
                </div>
                <div>
                  <strong>Provider Tier:</strong> {commissionData.providerTier || 'Not set'}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Storyline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Complete Payment Storyline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {paymentStoryline.map((step, index) => (
              <div key={step.step} className="relative">
                {/* Step Content */}
                <div className="flex items-start gap-4">
                  {/* Step Number */}
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                  
                  {/* Step Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{step.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        {step.status}
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground mb-2">{step.description}</p>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm">{step.details}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <strong>Component:</strong> {step.component}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Arrow to next step */}
                {index < paymentStoryline.length - 1 && (
                  <div className="flex justify-center my-4">
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <Separator className="my-6" />
          
          {/* Quick Access Links */}
          <div className="space-y-3">
            <h4 className="font-semibold">Quick Access to Payment Features:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button variant="outline" asChild>
                <a href="/provider/dashboard">Provider Dashboard</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/provider/commission-payment">Commission Payment</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/admin/commission-management">Admin Dashboard</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PaymentFlowDebugPage
