"use client"
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Image as ImageIcon, 
  Eye, 
  Upload, 
  CheckCircle2, 
  XCircle,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

const DOCUMENT_TYPES = {
  'ghana_card': { label: 'Ghana Card (National ID)', required: true },
  'business_license': { label: 'Business License', required: true },
  'tax_certificate': { label: 'Tax Certificate', required: false },
  'insurance': { label: 'Insurance Certificate', required: false },
  'portfolio': { label: 'Work Portfolio', required: false }
}

function UploadedDocuments({ businessId, refresh = 0 }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (businessId) {
      fetchDocuments()
    }
  }, [businessId, refresh])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/provider/documents?businessId=${businessId}`)
      const data = await response.json()
      
      if (data.success) {
        setDocuments(data.documents)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      toast.error('Failed to fetch documents')
    } finally {
      setLoading(false)
    }
  }

  const getFileIcon = (format) => {
    if (['pdf'].includes(format?.toLowerCase())) {
      return <FileText className="w-5 h-5 text-red-500" />
    }
    return <ImageIcon className="w-5 h-5 text-blue-500" />
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getDocumentsByType = (type) => {
    return documents.filter(doc => doc.type === type)
  }

  const getCompletionStatus = () => {
    const requiredTypes = Object.keys(DOCUMENT_TYPES).filter(type => DOCUMENT_TYPES[type].required)
    const uploadedRequiredTypes = requiredTypes.filter(type => getDocumentsByType(type).length > 0)
    
    return {
      completed: uploadedRequiredTypes.length,
      total: requiredTypes.length,
      isComplete: uploadedRequiredTypes.length === requiredTypes.length
    }
  }

  const status = getCompletionStatus()

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Uploaded Documents
          <Badge 
            variant={status.isComplete ? "default" : "secondary"}
            className={status.isComplete ? "bg-green-100 text-green-800" : ""}
          >
            {status.completed}/{status.total} Required
          </Badge>
        </CardTitle>
        <CardDescription>
          Your uploaded verification documents. Required documents must be uploaded for approval.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Document Upload Progress</span>
            <span>{Math.round((status.completed / status.total) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                status.isComplete ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${(status.completed / status.total) * 100}%` }}
            />
          </div>
        </div>

        {/* Document Types */}
        <div className="space-y-3">
          {Object.entries(DOCUMENT_TYPES).map(([type, config]) => {
            const docsForType = getDocumentsByType(type)
            const hasDocuments = docsForType.length > 0

            return (
              <div key={type} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {hasDocuments ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : config.required ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <h4 className="font-medium">{config.label}</h4>
                      <div className="flex gap-2">
                        {config.required && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                        {hasDocuments && (
                          <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                            {docsForType.length} uploaded
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Uploaded Documents for this type */}
                {hasDocuments ? (
                  <div className="space-y-2 ml-8">
                    {docsForType.map((doc, index) => (
                      <div 
                        key={`${doc.publicId}-${index}`}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded"
                      >
                        <div className="flex items-center gap-3">
                          {getFileIcon(doc.format)}
                          <div>
                            <p className="text-sm font-medium">{doc.fileName}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(doc.fileSize)} • {doc.format?.toUpperCase()} • 
                              {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(doc.fileUrl, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ml-8 text-sm text-gray-500">
                    {config.required ? '⚠️ Required document not uploaded' : 'Optional document'}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Status Summary */}
        <div className={`p-4 rounded-lg ${
          status.isComplete 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-orange-50 border border-orange-200'
        }`}>
          {status.isComplete ? (
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle2 className="w-5 h-5" />
              <div>
                <p className="font-medium">All required documents uploaded!</p>
                <p className="text-sm">Your business registration is ready for admin review.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="w-5 h-5" />
              <div>
                <p className="font-medium">
                  {status.total - status.completed} required document(s) missing
                </p>
                <p className="text-sm">
                  Please upload all required documents to complete your registration.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Total Documents Count */}
        {documents.length > 0 && (
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-600">
              Total: {documents.length} document(s) uploaded
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default UploadedDocuments 