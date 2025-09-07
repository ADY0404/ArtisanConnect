"use client"
import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Shield, FileText, CheckCircle2, Zap } from 'lucide-react'
import ProviderRegistrationForm from '@/app/_components/ProviderRegistrationForm'
import EnhancedBusinessRegistrationForm from '@/app/_components/EnhancedBusinessRegistrationForm'

// Component that uses useSearchParams - needs to be wrapped in Suspense
function ProviderRegisterContent() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('standard')
  
  // Set initial tab based on URL parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'enhanced') {
      setActiveTab('enhanced')
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-4 sm:py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Business Registration
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Choose your registration method and start building your business presence on ArtisanConnect
            </p>
          </div>

          {/* Registration Options */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-2xl mx-auto mb-8">
              <TabsTrigger value="standard" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Standard Registration
              </TabsTrigger>
              <TabsTrigger value="enhanced" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Enhanced Registration
              </TabsTrigger>
            </TabsList>

            {/* Standard Registration Tab */}
            <TabsContent value="standard" className="space-y-6">
              <Card className="border-2 border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-blue-800">
                    <Building2 className="w-6 h-6" />
                    Standard Business Registration
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Production Ready
                    </Badge>
                    <span className="text-sm text-blue-600">Quick and simple registration process</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-blue-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      Basic business information and category selection
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      Document upload (Ghana Card, Business License)
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      Professional details and portfolio setup
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      Immediate business listing creation
                    </div>
                  </div>
                </CardContent>
              </Card>

              <ProviderRegistrationForm />
            </TabsContent>

            {/* Enhanced Registration Tab */}
            <TabsContent value="enhanced" className="space-y-6">
              <Card className="border-2 border-purple-200 bg-purple-50/50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-purple-800">
                    <Shield className="w-6 h-6" />
                    Enhanced Business Registration
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                      <Zap className="w-3 h-3 mr-1" />
                      Beta Testing
                    </Badge>
                    <span className="text-sm text-purple-600">Advanced verification and auto-fill features</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-purple-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-600" />
                      TIN-based business information auto-fill
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-600" />
                      Real-time Ghana Card OCR verification
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-600" />
                      Cross-reference validation (TIN + Ghana Card)
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-600" />
                      Enhanced security and verification pipeline
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-600" />
                      Advanced document management system
                    </div>
                  </div>
                </CardContent>
              </Card>

              <EnhancedBusinessRegistrationForm />
            </TabsContent>
          </Tabs>

          {/* Information Section */}
          <div className="mt-12 max-w-4xl mx-auto">
            <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-center text-gray-800">
                  Why Choose Enhanced Registration?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800">🚀 Advanced Features</h4>
                    <ul className="space-y-2">
                      <li>• TIN-based auto-fill reduces manual entry</li>
                      <li>• Real-time Ghana Card verification</li>
                      <li>• Cross-reference validation ensures accuracy</li>
                      <li>• Enhanced security protocols</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800">⚡ Benefits</h4>
                    <ul className="space-y-2">
                      <li>• Faster registration process</li>
                      <li>• Reduced data entry errors</li>
                      <li>• Higher verification success rates</li>
                      <li>• Professional-grade security</li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-100 rounded-lg">
                  <p className="text-sm text-blue-800 text-center">
                    <strong>Note:</strong> Enhanced registration is currently in beta testing. 
                    For production use, we recommend the standard registration process.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading fallback component
function RegisterPageLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-4 sm:py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Business Registration
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Loading registration options...
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main page component with Suspense boundary
function ProviderRegisterPage() {
  return (
    <Suspense fallback={<RegisterPageLoading />}>
      <ProviderRegisterContent />
    </Suspense>
  )
}

export default ProviderRegisterPage 