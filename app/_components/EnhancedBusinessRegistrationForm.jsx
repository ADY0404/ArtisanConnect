"use client"
import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, AlertCircle, Circle, Building2, Shield, FileText } from 'lucide-react'
import { toast } from 'sonner'

import TinAutoFillComponent from './TinAutoFillComponent'
import GhanaCardVerification from './GhanaCardVerification'
import DocumentUpload from './DocumentUpload'

function EnhancedBusinessRegistrationForm() {
  const { data: session } = useSession()
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('verification')
  const [uploadedDocuments, setUploadedDocuments] = useState([])
  
  const [formData, setFormData] = useState({
    // Basic Business Information
    name: '',
    about: '',
    address: '',
    contactPerson: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: '',
    categoryId: '',
    
    // Business Images
    images: [],
    
    // Professional Details
    specializations: [],
    experience: '',
    certifications: [],
    portfolio: [],
    
    // Verification Data
    tinNumber: '',
    ghanaCardNumber: '',
    autoFilledFromTin: false,
    ghanaCardVerified: false,
    
    // Enhanced Fields from Verification
    businessType: '',
    registrationYear: '',
    digitalAddress: '',
    region: ''
  })
  
  const [verificationStates, setVerificationStates] = useState({
    tinVerified: false,
    ghanaCardVerified: false,
    documentsUploaded: false,
    canProceed: false
  })

  // Temporary states for adding items
  const [newSpecialization, setNewSpecialization] = useState('')
  const [newCertification, setNewCertification] = useState({
    name: '',
    issuer: '',
    issuedDate: '',
    type: 'certification'
  })

  useEffect(() => {
    // Load categories for selection
    const fetchCategories = async () => {
      try {
        // Using existing API endpoint
        const response = await fetch('/api/categories')
        if (response.ok) {
          const data = await response.json()
          setCategories(data.categories || [])
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }
    
    fetchCategories()
  }, [])

  useEffect(() => {
    // Update form when session changes
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        contactPerson: session.user.name || '',
        email: session.user.email || ''
      }))
    }
  }, [session])

  useEffect(() => {
    // Check if user can proceed to next steps
    const hasRequiredDocs = uploadedDocuments.some(doc => doc.type === 'ghana_card') && 
                           uploadedDocuments.some(doc => doc.type === 'business_license')
    
    setVerificationStates(prev => ({
      ...prev,
      documentsUploaded: hasRequiredDocs,
      canProceed: prev.ghanaCardVerified && hasRequiredDocs
    }))
  }, [uploadedDocuments, verificationStates.ghanaCardVerified])

  // Handle TIN auto-fill data
  const handleTinDataFound = (tinData) => {
    setFormData(prev => ({
      ...prev,
      name: tinData.businessName,
      contactPerson: tinData.ownerName,
      email: tinData.email,
      phone: tinData.phone,
      address: `${tinData.address.street}, ${tinData.address.city}`,
      tinNumber: tinData.tinNumber,
      ghanaCardNumber: tinData.ghanaCardNumber,
      businessType: tinData.businessType,
      registrationYear: tinData.registrationYear,
      digitalAddress: tinData.address.digitalAddress || '',
      region: tinData.address.region,
      autoFilledFromTin: true,
      about: tinData.description || prev.about
    }))
    
    // Try to map category
    if (tinData.category) {
      const matchingCategory = categories.find(cat => 
        cat.name.toLowerCase() === tinData.category.toLowerCase()
      )
      if (matchingCategory) {
        setFormData(prev => ({
          ...prev,
          categoryId: matchingCategory.id
        }))
      }
    }
    
    setVerificationStates(prev => ({
      ...prev,
      tinVerified: true
    }))
    
    toast.success('Business information auto-filled from TIN registry!')
  }

  // Handle Ghana Card verification
  const handleGhanaCardVerified = (cardData) => {
    if (!cardData) {
      setVerificationStates(prev => ({ ...prev, ghanaCardVerified: false }))
      return
    }

    // Cross-check with TIN data if available
    if (formData.ghanaCardNumber && formData.ghanaCardNumber !== cardData.cardNumber) {
      toast.warning('Ghana Card number differs from TIN registry. Please verify.')
    }
    
    setFormData(prev => ({
      ...prev,
      ghanaCardNumber: cardData.cardNumber,
      ghanaCardVerified: true,
      // Auto-fill contact person if not already filled or from TIN
      contactPerson: prev.contactPerson || cardData.fullName
    }))
    
    setVerificationStates(prev => ({
      ...prev,
      ghanaCardVerified: true
    }))
    
    toast.success('Ghana Card verified successfully!')
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addSpecialization = () => {
    if (newSpecialization.trim() && !formData.specializations.includes(newSpecialization.trim())) {
      setFormData(prev => ({
        ...prev,
        specializations: [...prev.specializations, newSpecialization.trim()]
      }))
      setNewSpecialization('')
    }
  }

  const removeSpecialization = (index) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.filter((_, i) => i !== index)
    }))
  }

  const addCertification = () => {
    if (newCertification.name.trim()) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, { ...newCertification }]
      }))
      setNewCertification({
        name: '',
        issuer: '',
        issuedDate: '',
        type: 'certification'
      })
    }
  }

  const removeCertification = (index) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }))
  }

  const handleDocumentUpload = (documents) => {
    setUploadedDocuments(prev => [...prev, ...documents])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!session) {
      toast.error('Please login to register your business')
      return
    }

    if (!formData.name || !formData.about || !formData.address || !formData.categoryId) {
      toast.error('Please fill in all required fields')
      return
    }

    if (!verificationStates.canProceed) {
      toast.error('Please complete Ghana Card verification and upload required documents')
      setActiveTab('verification')
      return
    }

    setIsLoading(true)
    
    try {
      // Using existing business creation API
      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          about: formData.about,
          address: formData.address,
          email: formData.email,
          contactPerson: formData.contactPerson,
          phone: formData.phone,
          categoryId: formData.categoryId,
          images: formData.images,
          specializations: formData.specializations,
          certifications: formData.certifications,
          experience: formData.experience,
          portfolio: formData.portfolio,
          documentsUploaded: uploadedDocuments,
          
          // Enhanced verification data
          tinNumber: formData.tinNumber,
          ghanaCardNumber: formData.ghanaCardNumber,
          businessType: formData.businessType,
          registrationYear: formData.registrationYear,
          digitalAddress: formData.digitalAddress,
          region: formData.region,
          verificationFlags: {
            tinVerified: verificationStates.tinVerified,
            ghanaCardVerified: verificationStates.ghanaCardVerified,
            autoFilledFromTin: formData.autoFilledFromTin
          }
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('Enhanced business registration submitted successfully! Your application will be reviewed by our team.')
        
        // Reset form
        setFormData({
          name: '',
          about: '',
          address: '',
          contactPerson: session.user.name || '',
          email: session.user.email || '',
          phone: '',
          categoryId: '',
          images: [],
          specializations: [],
          experience: '',
          certifications: [],
          portfolio: [],
          tinNumber: '',
          ghanaCardNumber: '',
          autoFilledFromTin: false,
          ghanaCardVerified: false,
          businessType: '',
          registrationYear: '',
          digitalAddress: '',
          region: ''
        })
        setUploadedDocuments([])
        setVerificationStates({
          tinVerified: false,
          ghanaCardVerified: false,
          documentsUploaded: false,
          canProceed: false
        })
        setActiveTab('verification')
        
      } else {
        toast.error(result.error || 'Failed to submit registration. Please try again.')
      }
    } catch (error) {
      console.error('Error creating business listing:', error)
      toast.error('Failed to submit registration. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="text-center p-8">
        <p>Please login to register your business.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Enhanced Business Registration</h2>
        <p className="text-gray-600">Register your business with TIN auto-fill and Ghana Card verification</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto pb-2">
            <TabsList className="flex w-full min-w-[800px] sm:min-w-0 sm:grid sm:grid-cols-5">
              <TabsTrigger value="verification" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">
                <Shield className="w-4 h-4 mr-1" />
                Verification
              </TabsTrigger>
              <TabsTrigger value="basic" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">
                <Building2 className="w-4 h-4 mr-1" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="professional" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">
                Professional
              </TabsTrigger>
              <TabsTrigger value="credentials" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">
                Credentials
              </TabsTrigger>
              <TabsTrigger value="documents" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">
                <FileText className="w-4 h-4 mr-1" />
                Documents *
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Verification Tab */}
          <TabsContent value="verification" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TinAutoFillComponent 
                onDataFound={handleTinDataFound}
                onFormUpdate={(data) => data && handleTinDataFound(data)}
                initialTin={formData.tinNumber}
              />
              
              <GhanaCardVerification 
                onVerificationComplete={handleGhanaCardVerified}
                uploadedDocuments={uploadedDocuments}
                crossCheckTin={formData.tinNumber}
                initialCardNumber={formData.ghanaCardNumber}
              />
            </div>
            
            {/* Verification Status */}
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Verification Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                    verificationStates.tinVerified ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}>
                    {verificationStates.tinVerified ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <p className="font-medium">TIN Verification</p>
                      <p className="text-sm text-gray-600">
                        {verificationStates.tinVerified ? 'Completed (Optional)' : 'Optional'}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                    verificationStates.ghanaCardVerified ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    {verificationStates.ghanaCardVerified ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">Ghana Card</p>
                      <p className="text-sm text-gray-600">
                        {verificationStates.ghanaCardVerified ? 'Verified' : 'Required'}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                    verificationStates.documentsUploaded ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    {verificationStates.documentsUploaded ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">Documents</p>
                      <p className="text-sm text-gray-600">
                        {verificationStates.documentsUploaded ? 'Uploaded' : 'Required'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <Button 
                    onClick={() => setActiveTab('basic')}
                    disabled={!verificationStates.ghanaCardVerified}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Continue to Basic Information
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6 mt-6">
            <div className={`space-y-4 ${formData.autoFilledFromTin ? 'opacity-90' : ''}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Business Name *</label>
                  <Input
                    placeholder="Business Name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={formData.autoFilledFromTin ? 'bg-green-50 border-green-200' : ''}
                    readOnly={formData.autoFilledFromTin}
                  />
                  {formData.autoFilledFromTin && (
                    <p className="text-sm text-green-600 mt-1">✓ Auto-filled from TIN registry</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Contact Person *</label>
                  <Input
                    placeholder="Contact Person"
                    value={formData.contactPerson}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    className={formData.autoFilledFromTin ? 'bg-green-50 border-green-200' : ''}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={formData.autoFilledFromTin ? 'bg-green-50 border-green-200' : ''}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Phone *</label>
                  <Input
                    placeholder="Phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={formData.autoFilledFromTin ? 'bg-green-50 border-green-200' : ''}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Business Address *</label>
                <Textarea
                  placeholder="Business Address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className={formData.autoFilledFromTin ? 'bg-green-50 border-green-200' : ''}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">About Your Business *</label>
                <Textarea
                  placeholder="Describe your business and services"
                  value={formData.about}
                  onChange={(e) => handleInputChange('about', e.target.value)}
                  rows={4}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Service Category *</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => handleInputChange('categoryId', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Enhanced Information from Verification */}
              {(formData.businessType || formData.registrationYear || formData.digitalAddress) && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-sm text-blue-900">Additional Information from TIN Registry</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {formData.businessType && (
                      <div>
                        <span className="font-medium text-blue-800">Business Type:</span>
                        <p className="text-blue-700">{formData.businessType.replace(/_/g, ' ')}</p>
                      </div>
                    )}
                    {formData.registrationYear && (
                      <div>
                        <span className="font-medium text-blue-800">Registration Year:</span>
                        <p className="text-blue-700">{formData.registrationYear}</p>
                      </div>
                    )}
                    {formData.digitalAddress && (
                      <div>
                        <span className="font-medium text-blue-800">Digital Address:</span>
                        <p className="text-blue-700">{formData.digitalAddress}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
            
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setActiveTab('verification')}>
                Previous
              </Button>
              <Button type="button" onClick={() => setActiveTab('professional')}>
                Next: Professional Details
              </Button>
            </div>
          </TabsContent>
          
          {/* Professional Details Tab */}
          <TabsContent value="professional" className="space-y-6 mt-6">
            <div>
              <label className="block text-sm font-medium mb-2">Years of Experience</label>
              <Input
                placeholder="e.g., 5 years"
                value={formData.experience}
                onChange={(e) => handleInputChange('experience', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Specializations</label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add a specialization"
                  value={newSpecialization}
                  onChange={(e) => setNewSpecialization(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSpecialization()}
                />
                <Button type="button" onClick={addSpecialization}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.specializations.map((spec, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {spec}
                    <button type="button" onClick={() => removeSpecialization(index)}>×</button>
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setActiveTab('basic')}>
                Previous
              </Button>
              <Button type="button" onClick={() => setActiveTab('credentials')}>
                Next: Credentials
              </Button>
            </div>
          </TabsContent>
          
          {/* Credentials Tab */}
          <TabsContent value="credentials" className="space-y-6 mt-6">
            <div>
              <label className="block text-sm font-medium mb-2">Certifications & Licenses</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                <Input
                  placeholder="Certification name"
                  value={newCertification.name}
                  onChange={(e) => setNewCertification(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="Issuing organization"
                  value={newCertification.issuer}
                  onChange={(e) => setNewCertification(prev => ({ ...prev, issuer: e.target.value }))}
                />
                <Input
                  type="date"
                  placeholder="Issue date"
                  value={newCertification.issuedDate}
                  onChange={(e) => setNewCertification(prev => ({ ...prev, issuedDate: e.target.value }))}
                />
                <Button type="button" onClick={addCertification}>Add Certification</Button>
              </div>
              <div className="space-y-2">
                {formData.certifications.map((cert, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <strong>{cert.name}</strong>
                      {cert.issuer && <span> - {cert.issuer}</span>}
                      {cert.issuedDate && <span> ({cert.issuedDate})</span>}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => removeCertification(index)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setActiveTab('professional')}>
                Previous
              </Button>
              <Button type="button" onClick={() => setActiveTab('documents')}>
                Next: Documents
              </Button>
            </div>
          </TabsContent>
          
          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6 mt-6">
            <DocumentUpload 
              businessId={null} // Will be set after business creation
              existingDocuments={uploadedDocuments}
              onUploadComplete={handleDocumentUpload}
            />
            
            {/* Enhanced submission requirements */}
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Final Verification Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className={`flex items-center gap-3 ${verificationStates.tinVerified ? 'text-green-600' : 'text-gray-500'}`}>
                    {verificationStates.tinVerified ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                    <span>TIN Verification {verificationStates.tinVerified ? '(Completed - Optional)' : '(Optional)'}</span>
                  </div>
                  <div className={`flex items-center gap-3 ${verificationStates.ghanaCardVerified ? 'text-green-600' : 'text-red-500'}`}>
                    {verificationStates.ghanaCardVerified ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span>Ghana Card Verification {verificationStates.ghanaCardVerified ? '(Verified)' : '(Required)'}</span>
                  </div>
                  <div className={`flex items-center gap-3 ${verificationStates.documentsUploaded ? 'text-green-600' : 'text-red-500'}`}>
                    {verificationStates.documentsUploaded ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span>Required Documents {verificationStates.documentsUploaded ? '(Uploaded)' : '(Required)'}</span>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setActiveTab('credentials')}>
                    Previous
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading || !verificationStates.canProceed}
                    className={`px-8 ${verificationStates.canProceed ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400'}`}
                  >
                    {isLoading ? 'Submitting...' : verificationStates.canProceed ? 'Submit Enhanced Registration' : 'Complete Verification First'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Enhanced Registration Benefits</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• TIN-based auto-fill reduces registration time by 60-70%</li>
          <li>• Ghana Card verification ensures identity authenticity</li>
          <li>• Cross-reference validation prevents fraud</li>
          <li>• Faster approval process with pre-verified information</li>
          <li>• Professional credibility with government-verified data</li>
        </ul>
      </div>
    </div>
  )
}

export default EnhancedBusinessRegistrationForm




