"use client"
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Upload,
  Building,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { toast } from 'sonner'

function RegistrationStatus() {
  const { data: session } = useSession()
  const [registrationStatus, setRegistrationStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.email) {
      fetchRegistrationStatus()
    }
  }, [session])

  const fetchRegistrationStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/provider/registration-status')
      const data = await response.json()
      
      if (data.success) {
        setRegistrationStatus(data.status)
      } else {
        throw new Error(data.error || 'Failed to fetch status')
      }
    } catch (error) {
      console.error('Error fetching registration status:', error)
      toast.error('Failed to load registration status')
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = (status) => {
    const statusConfig = {
      'NOT_REGISTERED': {
        icon: <Building className="w-5 h-5" />,
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        title: 'Not Registered',
        description: 'Complete your business registration to start receiving bookings',
        action: 'Register Business',
        actionVariant: 'default',
        urgent: false
      },
      'PENDING': {
        icon: <Clock className="w-5 h-5" />,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        title: 'Pending Review',
        description: 'Your business registration is under review by our team',
        action: null,
        urgent: false
      },
      'UNDER_REVIEW': {
        icon: <FileText className="w-5 h-5" />,
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        title: 'Under Review',
        description: 'Our team is currently reviewing your application and documents',
        action: null,
        urgent: false
      },
      'NEEDS_REVIEW': {
        icon: <AlertTriangle className="w-5 h-5" />,
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        title: 'Needs Review',
        description: 'Your application requires review by our admin team',
        action: null,
        urgent: false
      },
      'NEEDS_DOCUMENTS': {
        icon: <Upload className="w-5 h-5" />,
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        title: 'Documents Required',
        description: 'Please upload additional documents requested by our team',
        action: 'Upload Documents',
        actionVariant: 'outline',
        urgent: true
      },
      'APPROVED': {
        icon: <CheckCircle2 className="w-5 h-5" />,
        color: 'bg-green-100 text-green-800 border-green-200',
        title: 'Approved',
        description: 'Your business is approved and visible to customers',
        action: null,
        urgent: false
      },
      'REJECTED': {
        icon: <XCircle className="w-5 h-5" />,
        color: 'bg-red-100 text-red-800 border-red-200',
        title: 'Rejected',
        description: 'Your application was not approved. Please review feedback and reapply',
        action: 'Reapply',
        actionVariant: 'destructive',
        urgent: true
      }
    }

    return statusConfig[status] || statusConfig['NOT_REGISTERED']
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Business Registration Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const statusInfo = getStatusInfo(registrationStatus?.approvalStatus || 'NOT_REGISTERED')

  return (
    <Card className={`${statusInfo.urgent ? 'border-l-4 border-l-orange-500' : ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {statusInfo.icon}
          Business Registration Status
        </CardTitle>
        <CardDescription>
          Your current registration status with our platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status Badge and Description */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Badge className={`${statusInfo.color} border`}>
                {statusInfo.title}
              </Badge>
              <p className="text-sm text-gray-600 max-w-md">
                {statusInfo.description}
              </p>
              
              {/* Additional status details */}
              {registrationStatus && (
                <div className="text-xs text-gray-500 space-y-1">
                  {registrationStatus.documentsUploaded > 0 && (
                    <p>📄 Documents uploaded: {registrationStatus.documentsUploaded}</p>
                  )}
                  {registrationStatus.reviewedAt && (
                    <p>📅 Last reviewed: {new Date(registrationStatus.reviewedAt).toLocaleDateString()}</p>
                  )}
                </div>
              )}
            </div>
            
            {/* Action Button */}
            {statusInfo.action && (
              <Link href="/provider/register">
                <Button 
                  variant={statusInfo.actionVariant || 'outline'} 
                  size="sm"
                  className="shrink-0"
                >
                  {statusInfo.action}
                </Button>
              </Link>
            )}
          </div>

          {/* Admin Notes */}
          {registrationStatus && registrationStatus.adminNotes && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="font-medium text-blue-900 mb-1 flex items-center gap-1">
                <FileText className="w-4 h-4" />
                Admin Notes:
              </h4>
              <p className="text-sm text-blue-800">{registrationStatus.adminNotes}</p>
            </div>
          )}

          {/* Rejection Reason */}
          {registrationStatus?.approvalStatus === 'REJECTED' && registrationStatus.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <h4 className="font-medium text-red-900 mb-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Rejection Reason:
              </h4>
              <p className="text-sm text-red-800">{registrationStatus.rejectionReason}</p>
            </div>
          )}

          {/* Help Text for Status */}
          {registrationStatus?.approvalStatus === 'APPROVED' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                🎉 Congratulations! Your business is now live and customers can book your services.
              </p>
            </div>
          )}

          {(registrationStatus?.approvalStatus === 'PENDING' || registrationStatus?.approvalStatus === 'UNDER_REVIEW' || registrationStatus?.approvalStatus === 'NEEDS_REVIEW') && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⏳ Please be patient while our team reviews your application. This typically takes 1-2 business days.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default RegistrationStatus 