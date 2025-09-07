"use client"
import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  X, 
  Eye,
  Download,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react'
import { toast } from 'sonner'
import { useDropzone } from 'react-dropzone'

const DOCUMENT_TYPES = {
  'ghana_card': {
    label: 'Ghana Card (National ID)',
    description: 'Front and back of your Ghana Card',
    required: true,
    maxFiles: 2,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.pdf'],
      'application/pdf': ['.pdf']
    }
  },
  'business_license': {
    label: 'Business License',
    description: 'Valid business registration certificate',
    required: true,
    maxFiles: 1,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.pdf'],
      'application/pdf': ['.pdf']
    }
  },
  'tax_certificate': {
    label: 'Tax Certificate',
    description: 'Current tax clearance certificate',
    required: false,
    maxFiles: 1,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.pdf'],
      'application/pdf': ['.pdf']
    }
  },
  'insurance': {
    label: 'Insurance Certificate',
    description: 'Professional liability insurance (if applicable)',
    required: false,
    maxFiles: 1,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.pdf'],
      'application/pdf': ['.pdf']
    }
  },
  'portfolio': {
    label: 'Work Portfolio',
    description: 'Photos of your previous work',
    required: false,
    maxFiles: 5,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png']
    }
  }
}

function DocumentUpload({ 
  businessId, 
  existingDocuments = [], 
  onUploadComplete, 
  allowedTypes = Object.keys(DOCUMENT_TYPES) 
}) {
  const [uploadedDocs, setUploadedDocs] = useState(existingDocuments)
  const [uploading, setUploading] = useState({})
  const [uploadProgress, setUploadProgress] = useState({})

  const uploadToCloudinary = async (file, documentType) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('businessId', businessId || 'temp')
    formData.append('documentType', documentType)

    try {
      const response = await fetch('/api/cloudinary/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Upload failed')
      }

      return {
        url: data.url,
        publicId: data.publicId,
        format: data.format,
        bytes: data.bytes
      }
    } catch (error) {
      console.error('Cloudinary upload error:', error)
      throw error
    }
  }

  const handleFileUpload = async (files, documentType) => {
    const docConfig = DOCUMENT_TYPES[documentType]
    
    if (files.length > docConfig.maxFiles) {
      toast.error(`Maximum ${docConfig.maxFiles} file(s) allowed for ${docConfig.label}`)
      return
    }

    // Check if we already have files for this type
    const existingForType = uploadedDocs.filter(doc => doc.type === documentType)
    if (existingForType.length + files.length > docConfig.maxFiles) {
      toast.error(`Maximum ${docConfig.maxFiles} file(s) allowed for ${docConfig.label}`)
      return
    }

    setUploading(prev => ({ ...prev, [documentType]: true }))
    setUploadProgress(prev => ({ ...prev, [documentType]: 0 }))

    try {
      const uploadPromises = files.map(async (file, index) => {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [documentType]: Math.min(prev[documentType] + 10, 90)
          }))
        }, 200)

        try {
          const uploadResult = await uploadToCloudinary(file, documentType)
          clearInterval(progressInterval)
          
          return {
            type: documentType,
            fileName: file.name,
            fileUrl: uploadResult.url,
            publicId: uploadResult.publicId,
            fileSize: uploadResult.bytes,
            format: uploadResult.format,
            uploadedAt: new Date().toISOString()
          }
        } catch (error) {
          clearInterval(progressInterval)
          throw error
        }
      })

      const uploadedFiles = await Promise.all(uploadPromises)
      
      // Update local state
      setUploadedDocs(prev => [...prev, ...uploadedFiles])
      
      // Update progress to 100%
      setUploadProgress(prev => ({ ...prev, [documentType]: 100 }))
      
      // Save to database only if businessId exists (final submission)
      if (businessId) {
        await saveDocumentsToDatabase(uploadedFiles)
      }
      
      toast.success(`${uploadedFiles.length} document(s) uploaded successfully`)
      
      // Callback to parent component
      if (onUploadComplete) {
        onUploadComplete(uploadedFiles)
      }

    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload documents. Please try again.')
    } finally {
      setUploading(prev => ({ ...prev, [documentType]: false }))
      setTimeout(() => {
        setUploadProgress(prev => ({ ...prev, [documentType]: 0 }))
      }, 2000)
    }
  }

  const saveDocumentsToDatabase = async (documents) => {
    try {
      const response = await fetch('/api/provider/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          businessId,
          documents
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save documents')
      }
    } catch (error) {
      console.error('Error saving documents:', error)
      throw error
    }
  }

  const removeDocument = async (docIndex) => {
    const document = uploadedDocs[docIndex]
    
    try {
      // Remove from Cloudinary (optional - you might want to keep for records)
      // await fetch('/api/cloudinary/delete', { ... })
      
      // Remove from database
      if (businessId) {
        await fetch('/api/provider/documents', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            businessId,
            documentId: document.publicId
          })
        })
      }
      
      // Remove from local state
      setUploadedDocs(prev => prev.filter((_, index) => index !== docIndex))
      toast.success('Document removed successfully')
      
    } catch (error) {
      console.error('Error removing document:', error)
      toast.error('Failed to remove document')
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

  return (
    <div className="space-y-6">
      {allowedTypes.map(type => {
        const config = DOCUMENT_TYPES[type]
        const docsForType = uploadedDocs.filter(doc => doc.type === type)
        const isUploading = uploading[type]
        const progress = uploadProgress[type] || 0

        return (
          <DocumentTypeUploader
            key={type}
            type={type}
            config={config}
            documents={docsForType}
            isUploading={isUploading}
            progress={progress}
            onUpload={(files) => handleFileUpload(files, type)}
            onRemove={(docIndex) => {
              const globalIndex = uploadedDocs.findIndex(doc => 
                doc === docsForType[docIndex]
              )
              removeDocument(globalIndex)
            }}
            getFileIcon={getFileIcon}
            formatFileSize={formatFileSize}
          />
        )
      })}
    </div>
  )
}

function DocumentTypeUploader({ 
  type, 
  config, 
  documents, 
  isUploading, 
  progress, 
  onUpload, 
  onRemove,
  getFileIcon,
  formatFileSize 
}) {
  const onDrop = useCallback((acceptedFiles) => {
    onUpload(acceptedFiles)
  }, [onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: config.accept,
    maxFiles: config.maxFiles,
    disabled: isUploading || documents.length >= config.maxFiles
  })

  const canUploadMore = documents.length < config.maxFiles

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getFileIcon()} 
          {config.label}
          {config.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
        </CardTitle>
        <CardDescription>
          {config.description}
          <br />
          <span className="text-xs text-gray-500">
            Max {config.maxFiles} file(s) • Accepted: {Object.values(config.accept).flat().join(', ')}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        {canUploadMore && (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}
              ${isUploading ? 'pointer-events-none opacity-50' : 'hover:border-primary hover:bg-primary/5'}
            `}
          >
            <input {...getInputProps()} />
            
            {isUploading ? (
              <div className="space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm font-medium">Uploading...</p>
                <Progress value={progress} className="w-full max-w-xs mx-auto" />
                <p className="text-xs text-gray-500">{progress}%</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                <p className="text-sm font-medium">
                  {isDragActive 
                    ? `Drop ${config.label.toLowerCase()} here` 
                    : `Upload ${config.label}`
                  }
                </p>
                <p className="text-xs text-gray-500">
                  Drag & drop or click to browse ({config.maxFiles - documents.length} remaining)
                </p>
              </div>
            )}
          </div>
        )}

        {/* Uploaded Documents */}
        {documents.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Uploaded Documents:</h4>
            {documents.map((doc, index) => (
              <div 
                key={`${doc.publicId}-${index}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
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
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(doc.fileUrl, '_blank')}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemove(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Status */}
        {documents.length >= config.maxFiles && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">
              {config.label} upload complete ({documents.length}/{config.maxFiles})
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default DocumentUpload 