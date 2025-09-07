"use client"
import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, CheckCircle2, AlertCircle, Loader2, Building2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

function TinAutoFillComponent({ onDataFound, onFormUpdate, initialTin = '' }) {
  const [tinNumber, setTinNumber] = useState(initialTin)
  const [isValidating, setIsValidating] = useState(false)
  const [validationStatus, setValidationStatus] = useState('idle') // idle, validating, found, not_found, error
  const [businessData, setBusinessData] = useState(null)
  const [lastLookupTime, setLastLookupTime] = useState(null)

  // Reset validation status when TIN changes
  useEffect(() => {
    if (tinNumber !== initialTin) {
      setValidationStatus('idle')
      setBusinessData(null)
    }
  }, [tinNumber, initialTin])

  const validateTinFormat = (tin) => {
    const tinRegex = /^TIN-\d{4}-\d{6}$/
    if (!tinRegex.test(tin)) {
      return { isValid: false, error: 'Invalid TIN format. Expected: TIN-YYYY-NNNNNN' }
    }
    
    const [, year] = tin.match(/^TIN-(\d{4})-\d{6}$/)
    const currentYear = new Date().getFullYear()
    
    if (parseInt(year) < 2010 || parseInt(year) > currentYear) {
      return { isValid: false, error: `Invalid year. Must be between 2010 and ${currentYear}` }
    }
    
    return { isValid: true }
  }

  const handleTinLookup = async () => {
    const formatValidation = validateTinFormat(tinNumber)
    if (!formatValidation.isValid) {
      toast.error(formatValidation.error)
      return
    }

    setIsValidating(true)
    setValidationStatus('validating')
    const lookupStartTime = Date.now()

    try {
      const response = await fetch('/api/verification/tin/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tinNumber })
      })

      const result = await response.json()
      const lookupTime = Date.now() - lookupStartTime
      setLastLookupTime(lookupTime)

      if (result.success && result.businessData) {
        setBusinessData(result.businessData)
        setValidationStatus('found')
        
        // Call parent callbacks
        if (onDataFound) {
          onDataFound(result.businessData)
        }
        if (onFormUpdate) {
          onFormUpdate(result.businessData)
        }
        
        toast.success(`Business information found and auto-filled! (${lookupTime}ms)`)
      } else {
        setValidationStatus('not_found')
        setBusinessData(null)
        
        if (result.code === 'TIN_EXPIRED') {
          toast.error(`TIN registration expired on ${new Date(result.expiryDate).toLocaleDateString()}`)
        } else {
          toast.warning(result.message || 'TIN not found in registry. Please enter details manually.')
        }
      }
    } catch (error) {
      console.error('TIN lookup error:', error)
      setValidationStatus('error')
      setBusinessData(null)
      toast.error('TIN lookup service temporarily unavailable. Please try again.')
    } finally {
      setIsValidating(false)
    }
  }

  const handleClearData = () => {
    setBusinessData(null)
    setValidationStatus('idle')
    setTinNumber('')
    if (onFormUpdate) {
      onFormUpdate(null) // Clear form data
    }
    toast.info('TIN data cleared. Please enter business details manually.')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && validateTinFormat(tinNumber).isValid && !isValidating) {
      handleTinLookup()
    }
  }

  const getStatusIcon = () => {
    switch (validationStatus) {
      case 'validating':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
      case 'found':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'not_found':
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return <Building2 className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusBadge = () => {
    switch (validationStatus) {
      case 'found':
        return <Badge className="bg-green-100 text-green-800 border-green-200">✓ Verified</Badge>
      case 'not_found':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">⚠ Not Found</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-200">✗ Error</Badge>
      case 'validating':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">🔍 Checking...</Badge>
      default:
        return null
    }
  }

  return (
    <Card className="w-full border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-lg text-blue-900">TIN Auto-fill System</CardTitle>
              <p className="text-sm text-blue-700 mt-1">Ghana Revenue Authority Integration</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* TIN Input Section */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder="TIN-YYYY-NNNNNN (e.g., TIN-2024-000123)"
                value={tinNumber}
                onChange={(e) => setTinNumber(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                className="font-mono text-center border-2 border-blue-200 focus:border-blue-400"
                disabled={isValidating}
              />
              {tinNumber && validateTinFormat(tinNumber).isValid && (
                <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
              )}
            </div>
            <Button 
              onClick={handleTinLookup}
              disabled={isValidating || !validateTinFormat(tinNumber).isValid}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
            >
              {isValidating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {isValidating ? 'Checking...' : 'Lookup'}
            </Button>
          </div>
          
          {/* Format Helper */}
          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
            <strong>Format:</strong> TIN-YYYY-NNNNNN where YYYY is registration year (2010-{new Date().getFullYear()}) and NNNNNN is sequence number
          </div>
        </div>

        {/* Business Data Display */}
        {validationStatus === 'found' && businessData && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-green-800 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Business Information Found
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearData}
                className="text-green-700 border-green-300 hover:bg-green-100"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Clear & Enter Manually
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-green-800">Business Name:</span>
                <p className="text-green-700">{businessData.businessName}</p>
              </div>
              <div>
                <span className="font-medium text-green-800">Business Type:</span>
                <p className="text-green-700">{businessData.businessType?.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <span className="font-medium text-green-800">Owner:</span>
                <p className="text-green-700">{businessData.ownerName}</p>
              </div>
              <div>
                <span className="font-medium text-green-800">Category:</span>
                <p className="text-green-700">{businessData.category}</p>
              </div>
              <div>
                <span className="font-medium text-green-800">Phone:</span>
                <p className="text-green-700">{businessData.phone}</p>
              </div>
              <div>
                <span className="font-medium text-green-800">Email:</span>
                <p className="text-green-700">{businessData.email}</p>
              </div>
              <div className="md:col-span-2">
                <span className="font-medium text-green-800">Address:</span>
                <p className="text-green-700">
                  {businessData.address?.street}, {businessData.address?.city}, {businessData.address?.region}
                </p>
              </div>
              {businessData.address?.digitalAddress && (
                <div>
                  <span className="font-medium text-green-800">Digital Address:</span>
                  <p className="text-green-700">{businessData.address.digitalAddress}</p>
                </div>
              )}
              <div>
                <span className="font-medium text-green-800">Registration Year:</span>
                <p className="text-green-700">{businessData.registrationYear}</p>
              </div>
            </div>
            
            {lastLookupTime && (
              <div className="text-xs text-green-600 border-t border-green-200 pt-2">
                <strong>Retrieved in {lastLookupTime}ms</strong> from Ghana Revenue Authority database
              </div>
            )}
          </div>
        )}

        {/* Error/Not Found States */}
        {validationStatus === 'not_found' && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="font-medium text-yellow-800">TIN Not Found</span>
            </div>
            <p className="text-sm text-yellow-700 mb-3">
              This TIN is not registered in our system. Please verify the number or enter business details manually.
            </p>
            <div className="text-xs text-yellow-600 space-y-1">
              <p>• Double-check the TIN number for accuracy</p>
              <p>• Ensure the business is currently registered with GRA</p>
              <p>• Contact Ghana Revenue Authority if issues persist</p>
            </div>
          </div>
        )}

        {validationStatus === 'error' && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-800">Lookup Failed</span>
            </div>
            <p className="text-sm text-red-700 mb-3">
              Unable to connect to Ghana Revenue Authority database. Please try again or enter details manually.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTinLookup}
              className="text-red-700 border-red-300 hover:bg-red-100"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry Lookup
            </Button>
          </div>
        )}

        {/* Academic Disclaimer */}
        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-700">
          <p className="font-medium mb-1">Academic Simulation Notice:</p>
          <p>This TIN lookup system simulates integration with Ghana Revenue Authority for educational purposes. In production, this would connect to official GRA APIs.</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default TinAutoFillComponent




