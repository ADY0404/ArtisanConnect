"use client"
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2,
  Eye,
  User,
  CreditCard,
  RefreshCw,
  Camera,
  Upload,
  Image as ImageIcon
} from 'lucide-react'
import { toast } from 'sonner'

function GhanaCardVerification({ 
  onVerificationComplete, 
  uploadedDocuments = [], 
  crossCheckTin = null,
  initialCardNumber = ''
}) {
  const [cardNumber, setCardNumber] = useState(initialCardNumber)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState(null)
  const [verificationMethod, setVerificationMethod] = useState('manual') // 'manual' or 'ocr'
  const [lastVerificationTime, setLastVerificationTime] = useState(null)

  // Reset verification when card number changes
  useEffect(() => {
    if (cardNumber !== initialCardNumber) {
      setVerificationResult(null)
    }
  }, [cardNumber, initialCardNumber])

  const validateGhanaCardFormat = (number) => {
    const formatRegex = /^GHA-\d{9}-\d$/
    if (!formatRegex.test(number)) {
      return { isValid: false, error: 'Invalid format. Expected: GHA-NNNNNNNNN-N' }
    }

    // Extract components for check digit validation
    const [, mainNumber, checkDigit] = number.match(/^GHA-(\d{9})-(\d)$/)
    
    // Calculate check digit using Luhn-like algorithm
    const calculatedCheckDigit = calculateCheckDigit(mainNumber)
    
    if (parseInt(checkDigit) !== calculatedCheckDigit) {
      return { isValid: false, error: 'Invalid check digit' }
    }

    return { isValid: true }
  }

  const calculateCheckDigit = (numberString) => {
    let sum = 0
    for (let i = 0; i < numberString.length; i++) {
      let digit = parseInt(numberString[i])
      if (i % 2 === 0) digit *= 2
      if (digit > 9) digit = Math.floor(digit / 10) + (digit % 10)
      sum += digit
    }
    return (10 - (sum % 10)) % 10
  }

  const handleManualVerification = async () => {
    const formatValidation = validateGhanaCardFormat(cardNumber)
    if (!formatValidation.isValid) {
      toast.error(formatValidation.error)
      return
    }

    setIsVerifying(true)
    const verificationStartTime = Date.now()
    
    try {
      const response = await fetch('/api/verification/ghana-card/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cardNumber,
          method: 'manual',
          crossCheckTin,
          userAgent: 'Business Registration Form'
        })
      })

      const result = await response.json()
      const verificationTime = Date.now() - verificationStartTime
      setLastVerificationTime(verificationTime)
      setVerificationResult(result)
      
      if (result.success) {
        toast.success(`Ghana Card verified successfully! (${verificationTime}ms)`)
        if (onVerificationComplete) {
          onVerificationComplete(result.cardData)
        }
      } else {
        toast.error(result.message || 'Ghana Card verification failed')
      }
    } catch (error) {
      console.error('Verification error:', error)
      setVerificationResult({
        success: false,
        message: 'Verification service temporarily unavailable'
      })
      toast.error('Verification failed. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null)

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload JPEG, PNG, or WebP images only')
        return
      }
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        toast.error('File too large. Maximum size is 10MB')
        return
      }
      
      setSelectedFile(file)
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setUploadedImageUrl(previewUrl)
      
      toast.success('Image selected successfully')
    }
  }

  const handleCloudinaryOCR = async () => {
    if (!selectedFile) {
      toast.error('Please select a Ghana Card image first')
      return
    }

    setIsVerifying(true)
    const verificationStartTime = Date.now()
    
    try {
      // Create form data for file upload
      const formData = new FormData()
      formData.append('file', selectedFile)
      if (crossCheckTin) {
        formData.append('crossCheckTin', crossCheckTin)
      }

      const response = await fetch('/api/verification/ghana-card/cloudinary-ocr', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      const verificationTime = Date.now() - verificationStartTime
      setLastVerificationTime(verificationTime)
      setVerificationResult(result)
      
      if (result.success) {
        setCardNumber(result.extractedCardNumber)
        setUploadedImageUrl(result.imageUrl) // Use Cloudinary URL instead of local preview
        toast.success(`Ghana Card extracted and verified! (${verificationTime}ms)`)
        if (onVerificationComplete) {
          onVerificationComplete(result.cardData)
        }
      } else {
        toast.error(result.message || 'OCR verification failed')
      }
    } catch (error) {
      console.error('Cloudinary OCR Verification error:', error)
      setVerificationResult({
        success: false,
        message: 'OCR processing failed'
      })
      toast.error('OCR verification failed. Please try manual entry.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleOCRVerification = async () => {
    // Legacy OCR method - kept for backward compatibility
    const ghanaCardDocs = uploadedDocuments.filter(doc => doc.type === 'ghana_card')
    
    if (ghanaCardDocs.length === 0) {
      toast.error('Please upload Ghana Card images first')
      return
    }

    setIsVerifying(true)
    const verificationStartTime = Date.now()
    
    try {
      const response = await fetch('/api/verification/ghana-card/verify-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          documentUrls: ghanaCardDocs.map(doc => doc.fileUrl),
          method: 'ocr',
          crossCheckTin
        })
      })

      const result = await response.json()
      const verificationTime = Date.now() - verificationStartTime
      setLastVerificationTime(verificationTime)
      setVerificationResult(result)
      
      if (result.success) {
        setCardNumber(result.extractedCardNumber)
        toast.success(`Ghana Card extracted and verified! (${verificationTime}ms)`)
        if (onVerificationComplete) {
          onVerificationComplete(result.cardData)
        }
      } else {
        toast.error(result.message || 'OCR verification failed')
      }
    } catch (error) {
      console.error('OCR Verification error:', error)
      setVerificationResult({
        success: false,
        message: 'OCR processing failed'
      })
      toast.error('OCR verification failed. Please try manual entry.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleClearVerification = () => {
    setVerificationResult(null)
    setCardNumber('')
    if (onVerificationComplete) {
      onVerificationComplete(null)
    }
    toast.info('Ghana Card verification cleared')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && validateGhanaCardFormat(cardNumber).isValid && !isVerifying) {
      handleManualVerification()
    }
  }

  const getStatusIcon = () => {
    if (!verificationResult) return <Shield className="w-5 h-5 text-blue-600" />
    
    if (verificationResult.success) {
      return <CheckCircle2 className="w-5 h-5 text-green-600" />
    } else {
      return <XCircle className="w-5 h-5 text-red-600" />
    }
  }

  const getStatusBadge = () => {
    if (!verificationResult) return null
    
    if (verificationResult.success) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">✓ Verified</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800 border-red-200">✗ Failed</Badge>
    }
  }

  return (
    <Card className="w-full border-2 border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-lg text-purple-900">Ghana Card Verification</CardTitle>
              <p className="text-sm text-purple-700 mt-1">National Identification Authority</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Verification Method Selection */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant={verificationMethod === 'manual' ? 'default' : 'outline'}
            onClick={() => setVerificationMethod('manual')}
            className={verificationMethod === 'manual' ? 'bg-purple-600 hover:bg-purple-700' : 'border-purple-200 text-purple-700 hover:bg-purple-50'}
            size="sm"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Manual Entry
          </Button>
          <Button 
            variant={verificationMethod === 'ocr' ? 'default' : 'outline'}
            onClick={() => setVerificationMethod('ocr')}
            className={verificationMethod === 'ocr' ? 'bg-purple-600 hover:bg-purple-700' : 'border-purple-200 text-purple-700 hover:bg-purple-50'}
            size="sm"
          >
            <Camera className="w-4 h-4 mr-2" />
            Auto-Extract (OCR)
          </Button>
        </div>

        {/* Manual Entry Method */}
        {verificationMethod === 'manual' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  placeholder="GHA-123456789-1"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  className="font-mono text-center border-2 border-purple-200 focus:border-purple-400"
                  disabled={isVerifying}
                />
                {cardNumber && validateGhanaCardFormat(cardNumber).isValid && (
                  <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                )}
              </div>
              <Button 
                onClick={handleManualVerification}
                disabled={isVerifying || !validateGhanaCardFormat(cardNumber).isValid}
                className="bg-purple-600 hover:bg-purple-700 text-white min-w-[100px]"
              >
                {isVerifying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                {isVerifying ? 'Verifying...' : 'Verify'}
              </Button>
            </div>
            
            {/* Format Helper */}
            <div className="text-xs text-purple-600 bg-purple-50 p-2 rounded border border-purple-200">
              <strong>Format:</strong> GHA-NNNNNNNNN-N where N are digits and the last digit is a check digit
            </div>
          </div>
        )}

        {/* OCR Method */}
        {verificationMethod === 'ocr' && (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Real OCR Extraction</span>
              </div>
              <p className="text-sm text-purple-700 mb-3">
                Upload a Ghana Card image and we'll automatically extract the card number and name using Cloudinary's OCR technology (powered by Google Vision API).
              </p>
              <div className="text-xs text-purple-600 space-y-1">
                <p>• Supports JPEG, PNG, WebP formats</p>
                <p>• Maximum file size: 10MB</p>
                <p>• Ensure images are clear and well-lit for best results</p>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 bg-purple-25">
              <div className="text-center">
                {!selectedFile ? (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-purple-400 mb-4" />
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-purple-900">Upload Ghana Card Image</h3>
                      <p className="text-xs text-purple-600">
                        Select a clear photo of your Ghana Card (front side preferred)
                      </p>
                    </div>
                    <label className="mt-4 inline-flex items-center px-4 py-2 border border-purple-300 rounded-md shadow-sm text-sm font-medium text-purple-700 bg-white hover:bg-purple-50 cursor-pointer">
                      <Camera className="w-4 h-4 mr-2" />
                      Choose Image
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </>
                ) : (
                  <div className="space-y-3">
                    <ImageIcon className="mx-auto h-8 w-8 text-green-500" />
                    <div>
                      <h3 className="text-sm font-medium text-green-800">Image Selected</h3>
                      <p className="text-xs text-green-600">{selectedFile.name}</p>
                      <p className="text-xs text-green-600">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFile(null)
                        setUploadedImageUrl(null)
                      }}
                      className="text-xs text-purple-600 hover:text-purple-800 underline"
                    >
                      Choose different image
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Image Preview */}
            {uploadedImageUrl && (
              <div className="border border-purple-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Uploaded Image</span>
                </div>
                <div className="relative">
                  <img 
                    src={uploadedImageUrl} 
                    alt="Ghana Card" 
                    className="w-full max-w-md mx-auto rounded border shadow-sm"
                    style={{ maxHeight: '300px', objectFit: 'contain' }}
                  />
                </div>
              </div>
            )}

            {/* Extracted Information Display */}
            {verificationResult?.ocrResults && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">OCR Extraction Results</span>
                </div>
                <div className="space-y-2 text-xs">
                  {verificationResult.extractedCardNumber && (
                    <div>
                      <span className="font-medium text-blue-800">Extracted Card Number:</span>
                      <p className="text-blue-700 font-mono">{verificationResult.extractedCardNumber}</p>
                    </div>
                  )}
                  {verificationResult.extractedName && (
                    <div>
                      <span className="font-medium text-blue-800">Extracted Name:</span>
                      <p className="text-blue-700">{verificationResult.extractedName}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-blue-800">OCR Confidence:</span>
                    <p className="text-blue-700">{(verificationResult.ocrResults.confidence * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Processing Time:</span>
                    <p className="text-blue-700">{verificationResult.ocrResults.processingTime}ms</p>
                  </div>
                  {verificationResult.ocrResults.fullTextExtracted && (
                    <div>
                      <span className="font-medium text-blue-800">Full Extracted Text:</span>
                      <div className="text-blue-700 bg-blue-25 p-2 rounded text-xs font-mono max-h-20 overflow-y-auto">
                        {verificationResult.ocrResults.fullTextExtracted}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <Button 
              onClick={handleCloudinaryOCR}
              disabled={isVerifying || !selectedFile}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isVerifying ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              {isVerifying ? 'Processing Image with OCR...' : 'Extract & Verify with OCR'}
            </Button>

            {/* Legacy OCR Option */}
            {uploadedDocuments.filter(d => d.type === 'ghana_card').length > 0 && (
              <div className="pt-3 border-t border-purple-200">
                <p className="text-xs text-purple-600 mb-2">Or use previously uploaded documents:</p>
                <Button 
                  onClick={handleOCRVerification}
                  disabled={isVerifying}
                  variant="outline"
                  className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                  size="sm"
                >
                  {isVerifying ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Eye className="w-4 h-4 mr-2" />
                  )}
                  Use Previous Uploads ({uploadedDocuments.filter(d => d.type === 'ghana_card').length})
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Verification Results */}
        {verificationResult && (
          <div className={`rounded-lg border-2 p-4 ${
            verificationResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {verificationResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={`font-medium ${
                  verificationResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {verificationResult.success ? 'Verification Successful' : 'Verification Failed'}
                </span>
              </div>
              
              {verificationResult.success && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearVerification}
                  className="text-green-700 border-green-300 hover:bg-green-100"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            
            {verificationResult.success && verificationResult.cardData && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-green-800">Full Name:</span>
                    <p className="text-green-700">{verificationResult.cardData.fullName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-800">Card Number:</span>
                    <p className="text-green-700 font-mono">{verificationResult.cardData.cardNumber}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-800">Gender:</span>
                    <p className="text-green-700">{verificationResult.cardData.gender}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-800">Status:</span>
                    <p className="text-green-700">{verificationResult.cardData.status}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-800">Issue Date:</span>
                    <p className="text-green-700">{new Date(verificationResult.cardData.issuedDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-800">Expiry Date:</span>
                    <p className="text-green-700">{new Date(verificationResult.cardData.expiryDate).toLocaleDateString()}</p>
                  </div>
                  {verificationResult.cardData.address && (
                    <div className="md:col-span-2">
                      <span className="font-medium text-green-800">Address:</span>
                      <p className="text-green-700">
                        {verificationResult.cardData.address.city}, {verificationResult.cardData.address.region}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Cross-check Results */}
                {verificationResult.crossCheck && (
                  <div className={`p-3 rounded border ${
                    verificationResult.crossCheck.match 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      {verificationResult.crossCheck.match ? (
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                      )}
                      <span className={`text-sm font-medium ${
                        verificationResult.crossCheck.match ? 'text-blue-800' : 'text-yellow-800'
                      }`}>
                        TIN Cross-Check: {verificationResult.crossCheck.match ? 'Match' : 'Mismatch'}
                      </span>
                    </div>
                    <p className={`text-xs ${
                      verificationResult.crossCheck.match ? 'text-blue-700' : 'text-yellow-700'
                    }`}>
                      {verificationResult.crossCheck.message}
                    </p>
                  </div>
                )}
                
                {lastVerificationTime && (
                  <div className="text-xs text-green-600 border-t border-green-200 pt-2">
                    <strong>Verified in {lastVerificationTime}ms</strong> via National Identification Authority
                  </div>
                )}
              </div>
            )}
            
            {!verificationResult.success && (
              <div className="space-y-3">
                <p className="text-sm text-red-700">
                  {verificationResult.message || 'Ghana Card verification failed'}
                </p>
                
                {/* Show extracted text for debugging when no card number found */}
                {verificationResult.extractedText && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">Extracted Text (Debug)</span>
                    </div>
                    <div className="text-xs text-yellow-700 space-y-2">
                      <div>
                        <span className="font-medium">Full Text:</span>
                        <div className="bg-yellow-25 p-2 rounded font-mono max-h-32 overflow-y-auto border">
                          {verificationResult.extractedText}
                        </div>
                      </div>
                      {verificationResult.textLines && (
                        <div>
                          <span className="font-medium">Text Lines:</span>
                          <div className="space-y-1">
                            {verificationResult.textLines.map((line, index) => (
                              <div key={index} className="bg-yellow-25 p-1 rounded text-xs">
                                Line {index + 1}: "{line}"
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {verificationResult.debugInfo && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="font-medium">Text Length:</span> {verificationResult.debugInfo.textLength}
                          </div>
                          <div>
                            <span className="font-medium">Line Count:</span> {verificationResult.debugInfo.lineCount}
                          </div>
                          <div>
                            <span className="font-medium">Confidence:</span> {(verificationResult.debugInfo.confidence * 100).toFixed(1)}%
                          </div>
                          <div>
                            <span className="font-medium">Image Quality:</span> {verificationResult.debugInfo.imageQuality}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {verificationResult.suggestions && (
                  <div className="text-xs text-red-600 space-y-1">
                    {verificationResult.suggestions.map((suggestion, index) => (
                      <p key={index}>• {suggestion}</p>
                    ))}
                  </div>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={verificationMethod === 'manual' ? handleManualVerification : handleOCRVerification}
                  className="text-red-700 border-red-300 hover:bg-red-100"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry Verification
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Academic Disclaimer */}
        <div className="bg-purple-50 border border-purple-200 rounded p-3 text-xs text-purple-700">
          <p className="font-medium mb-1">Technology Notice:</p>
          <p>This system uses real OCR technology (Cloudinary + Google Vision API) to extract text from Ghana Card images. The verification database simulates NIA integration for educational purposes. In production, this would connect to official NIA APIs.</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default GhanaCardVerification


