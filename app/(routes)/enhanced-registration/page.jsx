"use client"
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Zap, CheckCircle2, Building2 } from 'lucide-react'
import EnhancedBusinessRegistrationForm from '@/app/_components/EnhancedBusinessRegistrationForm'

function EnhancedRegistrationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Enhanced Business Registration</h1>
            <Badge className="bg-green-100 text-green-800 border-green-200">NEW</Badge>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Register your business with advanced verification features including TIN auto-fill and Ghana Card verification
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Zap className="w-5 h-5" />
                TIN Auto-fill
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-800 text-sm">
                Enter your TIN number and automatically fill business information from Ghana Revenue Authority database
              </p>
              <div className="mt-3 space-y-1 text-xs text-blue-700">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>60-70% faster registration</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Reduced data entry errors</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Official GRA integration</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Shield className="w-5 h-5" />
                Ghana Card Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-purple-800 text-sm">
                Verify your identity with Ghana Card validation including OCR extraction and cross-reference checking
              </p>
              <div className="mt-3 space-y-1 text-xs text-purple-700">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Manual & OCR verification</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Cross-reference with TIN</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>NIA database integration</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Building2 className="w-5 h-5" />
                Enhanced Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-800 text-sm">
                Faster approval with pre-verified information and comprehensive document validation
              </p>
              <div className="mt-3 space-y-1 text-xs text-green-700">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Faster approval process</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Professional credibility</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Fraud prevention</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Registration Form */}
        <Card className="border-2 border-gray-200 shadow-lg">
          <CardContent className="p-0">
            <EnhancedBusinessRegistrationForm />
          </CardContent>
        </Card>

        {/* Academic Notice */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-medium text-yellow-900 mb-2">Academic Implementation Notice</h3>
          <p className="text-sm text-yellow-800">
            This enhanced registration system demonstrates integration with government databases for educational purposes. 
            In a production environment, this would connect to official Ghana Revenue Authority and National Identification Authority APIs.
          </p>
        </div>
      </div>
    </div>
  )
}

export default EnhancedRegistrationPage




