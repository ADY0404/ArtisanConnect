"use client"
import React, { useState, useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { X, AlertTriangle, Upload, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

function RegistrationAlert() {
  const { data: session } = useSession()
  const [registrationStatus, setRegistrationStatus] = useState(null)
  const [isVisible, setIsVisible] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.email) {
      fetchRegistrationStatus()
    }
  }, [session])

  const fetchRegistrationStatus = async () => {
    try {
      const response = await fetch('/api/provider/registration-status')
      const data = await response.json()
      
      if (data.success) {
        setRegistrationStatus(data.status)
      }
    } catch (error) {
      console.error('Error fetching registration status:', error)
    } finally {
      setLoading(false)
    }
  }

  // Only show alert for urgent statuses
  const shouldShowAlert = () => {
    if (!registrationStatus) return false
    
    const urgentStatuses = ['NOT_REGISTERED', 'NEEDS_DOCUMENTS', 'REJECTED']
    return urgentStatuses.includes(registrationStatus.approvalStatus)
  }

  const getAlertConfig = (status) => {
    const configs = {
      'NOT_REGISTERED': {
        variant: 'default',
        icon: <AlertTriangle className="w-4 h-4" />,
        title: 'Complete Your Business Registration',
        description: 'Register your business to start receiving bookings from customers.',
        action: 'Register Now',
        actionVariant: 'default'
      },
      'NEEDS_DOCUMENTS': {
        variant: 'destructive',
        icon: <Upload className="w-4 h-4" />,
        title: 'Documents Required',
        description: 'Upload the requested documents to continue your registration process.',
        action: 'Upload Documents',
        actionVariant: 'outline'
      },
      'REJECTED': {
        variant: 'destructive',
        icon: <XCircle className="w-4 h-4" />,
        title: 'Registration Rejected',
        description: 'Review the feedback and resubmit your application.',
        action: 'Reapply',
        actionVariant: 'destructive'
      }
    }
    
    return configs[status] || configs['NOT_REGISTERED']
  }

  if (loading || !isVisible || !shouldShowAlert()) {
    return null
  }

  const config = getAlertConfig(registrationStatus.approvalStatus)

  return (
    <Alert className={`mb-6 ${config.variant === 'destructive' ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {config.icon}
          <div className="space-y-1">
            <h4 className="font-medium text-sm">{config.title}</h4>
            <AlertDescription className="text-sm">
              {config.description}
            </AlertDescription>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <Link href="/provider/register">
            <Button 
              size="sm" 
              variant={config.actionVariant}
              className="shrink-0"
            >
              {config.action}
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="p-1 h-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Alert>
  )
}

export default RegistrationAlert 