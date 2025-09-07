"use client"
import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import ApiService from '@/app/_services/ApiService'
import { toast } from 'sonner'
import { X, Plus, Upload, Trash2, CheckCircle2, AlertCircle, Camera, ImageIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DocumentUpload from './DocumentUpload'
import Image from 'next/image'

function ProviderRegistrationForm() {
  const { data: session } = useSession()
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [registeredBusinessId, setRegisteredBusinessId] = useState(null)
  const [uploadedDocuments, setUploadedDocuments] = useState([])
  const [canSubmit, setCanSubmit] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  
  const [formData, setFormData] = useState({
    // Basic Info
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
    
    // Certifications
    certifications: [],
    
    // Portfolio (basic for now - will be enhanced later)
    portfolio: []
  })

  // Temporary states for adding specializations and certifications
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
        const result = await ApiService.getCategory()
        setCategories(result.categories || [])
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

    if (!canSubmit) {
      toast.error('Please upload required documents (Ghana Card and Business License) before submitting')
      setActiveTab('documents')
      return
    }

    setIsLoading(true)
    
    try {
      const result = await ApiService.createBusinessListing({
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
        documentsUploaded: uploadedDocuments
      })
      
      if (result.success) {
        toast.success('Business registration submitted successfully! Your application will be reviewed by our team.')
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
          portfolio: []
        })
        setUploadedDocuments([])
        setActiveTab('basic')
        // Redirect to provider dashboard or show success message
      }
    } catch (error) {
      console.error('Error creating business listing:', error)
      toast.error('Failed to submit registration. Please try again.')
    } finally {
      setIsLoading(false)
    }
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

  // Check if required documents are uploaded
  const checkDocumentRequirements = () => {
    const requiredTypes = ['ghana_card', 'business_license']
    const hasAllRequired = requiredTypes.every(type => 
      uploadedDocuments.some(doc => doc.type === type)
    )
    setCanSubmit(hasAllRequired)
  }

  // Update canSubmit when documents change
  useEffect(() => {
    checkDocumentRequirements()
  }, [uploadedDocuments])

  // Handle document upload completion
  const handleDocumentUpload = (newDocuments) => {
    setUploadedDocuments(prev => [...prev, ...newDocuments])
    toast.success(`${newDocuments.length} document(s) uploaded successfully`)
  }

  // Handle business image upload
  const handleBusinessImageUpload = async (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return

    if (formData.images.length + files.length > 5) {
      toast.error('Maximum 5 business images allowed')
      return
    }

    setUploadingImage(true)
    const uploadedImages = []

    try {
      for (const file of files) {
        // Create FormData for Cloudinary upload
        const formData = new FormData()
        formData.append('file', file)
        formData.append('documentType', 'business_image')
        formData.append('businessId', session?.user?.email || 'temp')

        const response = await fetch('/api/cloudinary/upload', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          uploadedImages.push(data.url)
        } else {
          console.error('Failed to upload image:', file.name)
          toast.error(`Failed to upload ${file.name}`)
        }
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedImages]
      }))
      
      toast.success(`${uploadedImages.length} business image(s) uploaded successfully`)
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error('Failed to upload images')
    } finally {
      setUploadingImage(false)
    }
  }

  // Remove business image
  const removeBusinessImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }))
    toast.success('Image removed successfully')
  }

  if (!session) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold mb-4">Login Required</h2>
        <p>Please login to register your business.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Register Your Business</h2>
      
      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto pb-2">
            <TabsList className="flex w-full min-w-[600px] sm:min-w-0 sm:grid sm:grid-cols-4">
              <TabsTrigger value="basic" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">Basic Information</TabsTrigger>
              <TabsTrigger value="professional" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">Professional Details</TabsTrigger>
              <TabsTrigger value="credentials" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">Credentials</TabsTrigger>
              <TabsTrigger value="documents" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">Documents *</TabsTrigger>
            </TabsList>
          </div>
          
          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            <div>
              <label className="block text-sm font-medium mb-2">Business Name *</label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your business name"
                className="text-sm sm:text-base"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Business Description *</label>
              <textarea
                className="w-full min-h-[80px] sm:min-h-[100px] p-3 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.about}
                onChange={(e) => handleInputChange('about', e.target.value)}
                placeholder="Describe your business and services in detail"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Business Address *</label>
              <Input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter your business address"
                className="text-sm sm:text-base"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <select
                className="w-full p-3 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.categoryId}
                onChange={(e) => handleInputChange('categoryId', e.target.value)}
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Contact Person</label>
                <Input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                  placeholder="Contact person name"
                  className="text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Business phone number"
                  className="text-sm sm:text-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Business email"
                className="text-sm sm:text-base"
              />
            </div>

            {/* Business Images Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Business Images</label>
              <p className="text-sm text-gray-600 mb-3">
                Upload photos of your business, workspace, or completed work (Max 5 images)
              </p>
              
              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center mb-4">
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleBusinessImageUpload}
                  className="hidden"
                  id="business-image-upload"
                  disabled={uploadingImage || formData.images.length >= 5}
                />
                <label
                  htmlFor="business-image-upload"
                  className={`cursor-pointer flex flex-col items-center gap-2 ${
                    uploadingImage || formData.images.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {uploadingImage ? (
                    <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                  )}
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {uploadingImage ? 'Uploading...' : 'Click to upload business images'}
                    </p>
                    <p className="text-xs text-gray-500">
                      JPG, PNG up to 10MB each (Max 5 images)
                    </p>
                  </div>
                </label>
              </div>

              {/* Image Preview Grid */}
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {formData.images.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={imageUrl}
                        alt={`Business image ${index + 1}`}
                        width={150}
                        height={100}
                        className="w-full h-20 sm:h-24 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeBusinessImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} className="sm:w-3 sm:h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {formData.images.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-xs sm:text-sm">
                  No business images uploaded yet. Add some photos to showcase your business!
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={() => setActiveTab('professional')}>
                Next: Professional Details
              </Button>
            </div>
          </TabsContent>

          {/* Professional Details Tab */}
          <TabsContent value="professional" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            <div>
              <label className="block text-sm font-medium mb-2">Years of Experience</label>
              <Input
                type="text"
                value={formData.experience}
                onChange={(e) => handleInputChange('experience', e.target.value)}
                placeholder="e.g., 5 years, 10+ years"
                className="text-sm sm:text-base"
              />
            </div>

            {/* Specializations */}
            <div>
              <label className="block text-sm font-medium mb-2">Specializations</label>
              <p className="text-sm text-gray-600 mb-3">
                Add your areas of expertise and specialization
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <Input
                  type="text"
                  value={newSpecialization}
                  onChange={(e) => setNewSpecialization(e.target.value)}
                  placeholder="e.g., Electrical Repairs, Home Automation"
                  className="text-sm sm:text-base"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
                />
                <Button type="button" onClick={addSpecialization} variant="outline" className="flex-shrink-0">
                  <Plus size={16} />
                </Button>
              </div>

              {formData.specializations.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.specializations.map((spec, index) => (
                    <Badge key={index} variant="secondary" className="px-2 sm:px-3 py-1 text-xs sm:text-sm">
                      {spec}
                      <button
                        type="button"
                        onClick={() => removeSpecialization(index)}
                        className="ml-1 sm:ml-2 hover:text-red-600"
                      >
                        <X size={10} className="sm:w-3 sm:h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setActiveTab('basic')} className="w-full sm:w-auto">
                Previous
              </Button>
              <Button type="button" onClick={() => setActiveTab('credentials')} className="w-full sm:w-auto">
                Next: Credentials
              </Button>
            </div>
          </TabsContent>

          {/* Credentials Tab */}
          <TabsContent value="credentials" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Certifications & Licenses</h3>
              <p className="text-sm text-gray-600 mb-4">
                Add your professional certifications, licenses, and credentials
              </p>

              {/* Add New Certification */}
              <div className="p-3 sm:p-4 border rounded-lg mb-4">
                <h4 className="font-medium mb-3">Add Certification</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Certification Name</label>
                    <Input
                      type="text"
                      value={newCertification.name}
                      onChange={(e) => setNewCertification(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Licensed Electrician"
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Issuing Authority</label>
                    <Input
                      type="text"
                      value={newCertification.issuer}
                      onChange={(e) => setNewCertification(prev => ({ ...prev, issuer: e.target.value }))}
                      placeholder="e.g., State Licensing Board"
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Issue Date</label>
                    <Input
                      type="date"
                      value={newCertification.issuedDate}
                      onChange={(e) => setNewCertification(prev => ({ ...prev, issuedDate: e.target.value }))}
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select
                      className="w-full p-2 text-sm sm:text-base border border-gray-300 rounded-md"
                      value={newCertification.type}
                      onChange={(e) => setNewCertification(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="certification">Certification</option>
                      <option value="license">License</option>
                      <option value="insurance">Insurance</option>
                    </select>
                  </div>
                </div>
                <Button type="button" onClick={addCertification} variant="outline" size="sm">
                  <Plus size={16} className="mr-2" />
                  Add Certification
                </Button>
              </div>

              {/* Certifications List */}
              {formData.certifications.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Added Certifications:</h4>
                  {formData.certifications.map((cert, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-gray-50">
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <h5 className="font-medium text-sm sm:text-base">{cert.name}</h5>
                          {cert.issuer && <p className="text-xs sm:text-sm text-gray-600">Issued by: {cert.issuer}</p>}
                          <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-gray-500 mt-1">
                            {cert.issuedDate && <span>Issued: {new Date(cert.issuedDate).getFullYear()}</span>}
                            <Badge variant="outline" className="text-xs">{cert.type}</Badge>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeCertification(index)}
                          className="text-red-600 hover:text-red-700 flex-shrink-0"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setActiveTab('professional')} className="w-full sm:w-auto">
                Previous
              </Button>
              <Button type="button" onClick={() => setActiveTab('documents')} className="w-full sm:w-auto">
                Next: Upload Documents
              </Button>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Upload Required Documents</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please upload the required documents for business verification. These documents will be reviewed by our team before approving your business.
              </p>

              {/* Document Upload Status */}
              <div className={`p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 ${canSubmit ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
                <div className="flex items-center gap-2">
                  {canSubmit ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      <span className="font-medium text-green-800 text-sm sm:text-base">All required documents uploaded!</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                      <span className="font-medium text-orange-800 text-sm sm:text-base">Required documents missing</span>
                    </>
                  )}
                </div>
                <p className="text-xs sm:text-sm mt-1 text-gray-600">
                  {canSubmit 
                    ? 'You can now submit your complete business registration.'
                    : 'Please upload Ghana Card and Business License to proceed with registration.'
                  }
                </p>
              </div>

              {/* Document Upload without needing business ID */}
              <DocumentUpload
                businessId={null} // Will be handled during final submission
                existingDocuments={uploadedDocuments}
                onUploadComplete={handleDocumentUpload}
                allowedTypes={['ghana_card', 'business_license', 'tax_certificate', 'insurance', 'portfolio']}
              />

              <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2 text-sm sm:text-base">Document Requirements:</h4>
                <ul className="text-xs sm:text-sm text-green-800 space-y-1">
                  <li>• <strong>Ghana Card (Required):</strong> Front and back of your national ID</li>
                  <li>• <strong>Business License (Required):</strong> Valid business registration certificate</li>
                  <li>• <strong>Tax Certificate:</strong> Current tax clearance certificate (optional)</li>
                  <li>• <strong>Insurance Certificate:</strong> Professional liability insurance (optional)</li>
                  <li>• <strong>Portfolio:</strong> Photos of your previous work (optional)</li>
                </ul>
              </div>

              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">What happens next?</h4>
                <ol className="text-xs sm:text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Upload all required documents (Ghana Card + Business License minimum)</li>
                  <li>Our verification team will review your documents</li>
                  <li>You'll receive an email notification about approval status</li>
                  <li>Once approved, your business will be visible to customers</li>
                  <li>You can start receiving booking requests!</li>
                </ol>
              </div>

               {/* Final Submission */}
               <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 pt-4 sm:pt-6 border-t">
                 <Button type="button" variant="outline" onClick={() => setActiveTab('credentials')} className="w-full sm:w-auto">
                   Previous
                 </Button>
                 <Button 
                   type="submit" 
                   disabled={isLoading || !canSubmit}
                   className={`w-full sm:w-auto px-4 sm:px-8 text-sm sm:text-base ${canSubmit ? 'bg-green-600 hover:bg-green-700' : ''}`}
                   onClick={handleSubmit}
                 >
                   {isLoading ? 'Submitting...' : canSubmit ? 'Submit Complete Registration' : 'Upload Required Documents First'}
                 </Button>
               </div>
            </div>
          </TabsContent>
        </Tabs>
      </form>

      <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">What happens next?</h3>
        <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
          <li>• Your business registration will be reviewed by our team</li>
          <li>• We'll verify your certifications and credentials</li>
          <li>• Once approved, your business will appear in search results</li>
          <li>• You'll be notified via email about the status</li>
          <li>• You can add portfolio projects after approval</li>
        </ul>
      </div>
    </div>
  )
}

export default ProviderRegistrationForm 