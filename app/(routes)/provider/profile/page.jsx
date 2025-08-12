"use client"
import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User, 
  Building, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  DollarSign,
  Save,
  Camera,
  Star,
  Award,
  Settings,
  Upload,
  X
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

function ProviderProfile() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [uploadingBusinessImage, setUploadingBusinessImage] = useState(false)
  const [uploadingCertifications, setUploadingCertifications] = useState(false)
  const [profileData, setProfileData] = useState({
    // Personal Information
    name: '',
    email: '',
    phone: '',
    profileImage: '',
    
    // Business Information
    businessName: '',
    businessDescription: '',
    businessAddress: '',
    businessPhone: '',
    businessEmail: '',
    businessImages: [],
    
    // Service Information
    category: '',
    services: [],
    serviceArea: '',
    experience: '',
    certifications: [],
    
    // Availability
    workingHours: {
      monday: { start: '09:00', end: '17:00', available: true },
      tuesday: { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: true },
      thursday: { start: '09:00', end: '17:00', available: true },
      friday: { start: '09:00', end: '17:00', available: true },
      saturday: { start: '09:00', end: '15:00', available: true },
      sunday: { start: '10:00', end: '14:00', available: false }
    },
    
    // Pricing
    basePrice: '',
    emergencyRate: '',
    
    // Settings
    autoAcceptBookings: false,
    emailNotifications: true,
    smsNotifications: false
  })

  // Load profile data
  useEffect(() => {
    if (session?.user) {
      loadProfileData()
    }
  }, [session])

  const loadProfileData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/provider/profile')
      
      if (response.ok) {
        const data = await response.json()
        setProfileData(prev => ({ ...prev, ...data }))
      } else {
        // Set default data from session
        setProfileData(prev => ({
          ...prev,
          name: session.user.name || '',
          email: session.user.email || '',
          profileImage: session.user.image || ''
        }))
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
    setHasUnsavedChanges(true)
  }

  const handleWorkingHoursChange = (day, field, value) => {
    setProfileData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day],
          [field]: value
        }
      }
    }))
    setHasUnsavedChanges(true)
  }

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)
      
      // Basic validation
      const requiredFields = ['name', 'businessName', 'businessEmail', 'businessPhone']
      const missingFields = requiredFields.filter(field => !profileData[field]?.trim())
      
      if (missingFields.length > 0) {
        toast.error(`Please fill in the following required fields: ${missingFields.join(', ')}`)
        return
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(profileData.businessEmail)) {
        toast.error('Please enter a valid business email address')
        return
      }

      // Show loading toast
      const loadingToast = toast.loading('Updating your profile...')
      
      const response = await fetch('/api/provider/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData)
      })

      const data = await response.json()

      if (response.ok) {
        toast.dismiss(loadingToast)
        toast.success('✅ Profile updated successfully!', {
          description: 'Your business profile has been saved and updated.',
          duration: 4000
        })
        
        // Reset unsaved changes flag
        setHasUnsavedChanges(false)
        
        // Optional: Reload data to ensure consistency
        setTimeout(() => {
          loadProfileData()
        }, 1000)
      } else {
        toast.dismiss(loadingToast)
        throw new Error(data.error || 'Failed to save profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('❌ Failed to save profile', {
        description: error.message || 'Please check your connection and try again.',
        duration: 5000
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle business image upload
  const handleBusinessImageUpload = async (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return

    if ((profileData.businessImages?.length || 0) + files.length > 5) {
      toast.error('Maximum 5 business images allowed', {
        description: 'Please remove some existing images before uploading new ones.'
      })
      return
    }

    setUploadingBusinessImage(true)
    const uploadedImages = []
    
    // Show progress toast
    const uploadToast = toast.loading(`Uploading ${files.length} image(s)...`)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Update progress
        toast.loading(`Uploading image ${i + 1} of ${files.length}...`, { id: uploadToast })
        
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
          toast.error(`Failed to upload ${file.name}`, {
            description: 'Please try uploading this image again.'
          })
        }
      }

      setProfileData(prev => ({
        ...prev,
        businessImages: [...(prev.businessImages || []), ...uploadedImages]
      }))
      
      toast.dismiss(uploadToast)
      if (uploadedImages.length > 0) {
        toast.success(`✅ ${uploadedImages.length} image(s) uploaded successfully!`, {
          description: 'Your business images have been added to your profile.',
          duration: 3000
        })
      }
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.dismiss(uploadToast)
      toast.error('❌ Failed to upload images', {
        description: 'Please check your internet connection and try again.',
        duration: 5000
      })
    } finally {
      setUploadingBusinessImage(false)
    }
  }

  // Remove business image
  const removeBusinessImage = (indexToRemove) => {
    setProfileData(prev => ({
      ...prev,
      businessImages: (prev.businessImages || []).filter((_, index) => index !== indexToRemove)
    }))
    toast.success('📸 Image removed successfully', {
      description: 'The business image has been removed from your profile.'
    })
  }

  // Handle certification upload
  const handleCertificationUpload = async (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return;

    setUploadingCertifications(true);
    const uploadedCertifications = [];
    
    // Show progress toast
    const certUploadToast = toast.loading(`Uploading ${files.length} certification(s)...`)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Update progress
        toast.loading(`Uploading certification ${i + 1} of ${files.length}: ${file.name}...`, { 
          id: certUploadToast 
        })
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', 'certification');
        formData.append('businessId', session?.user?.email || 'temp');

        const response = await fetch('/api/cloudinary/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          uploadedCertifications.push({
            name: file.name,
            url: data.url,
            uploadedAt: new Date().toISOString(),
          });
        } else {
          toast.error(`Failed to upload ${file.name}`, {
            description: 'Please ensure the file is under 10MB and try again.'
          });
        }
      }

      setProfileData(prev => ({
        ...prev,
        certifications: [...(prev.certifications || []), ...uploadedCertifications]
      }));
      
      toast.dismiss(certUploadToast)
      if (uploadedCertifications.length > 0) {
        toast.success(`✅ ${uploadedCertifications.length} certification(s) uploaded successfully!`, {
          description: 'Your certifications have been added to your professional profile.',
          duration: 4000
        });
      }
    } catch (error) {
      console.error('Error uploading certifications:', error);
      toast.dismiss(certUploadToast)
      toast.error('❌ Failed to upload certifications', {
        description: 'Please check your files and internet connection.',
        duration: 5000
      });
    } finally {
      setUploadingCertifications(false);
    }
  };

  const removeCertification = (indexToRemove) => {
    setProfileData(prev => ({
      ...prev,
      certifications: (prev.certifications || []).filter((_, index) => index !== indexToRemove)
    }));
    toast.success('📄 Certification removed successfully', {
      description: 'The certification has been removed from your profile.'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-4">
            <div className="w-full sm:w-auto">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Provider Profile</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your business information and settings
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
              <Link href="/provider/dashboard">
                <Button variant="outline" className="w-full sm:w-auto text-xs sm:text-sm">Back to Dashboard</Button>
              </Link>
              <Button 
                onClick={handleSaveProfile}
                disabled={isSaving}
                className={`flex items-center gap-2 w-full sm:w-auto text-xs sm:text-sm ${hasUnsavedChanges ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
              >
                <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes*' : 'Save Changes'}
              </Button>
              {hasUnsavedChanges && (
                <span className="text-xs sm:text-sm text-orange-600 font-medium text-center sm:text-left">
                  Unsaved changes
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="personal" className="space-y-6">
          <div className="overflow-x-auto pb-2">
            <TabsList className="flex w-full min-w-[500px] sm:min-w-0 sm:grid sm:grid-cols-5">
              <TabsTrigger value="personal" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">Personal Info</TabsTrigger>
              <TabsTrigger value="business" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">Business</TabsTrigger>
              <TabsTrigger value="services" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">Services</TabsTrigger>
              <TabsTrigger value="availability" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">Availability</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">Settings</TabsTrigger>
            </TabsList>
          </div>

          {/* Personal Information */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <Input
                      value={profileData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <Input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="your.email@example.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone Number</label>
                    <Input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Profile Image URL</label>
                    <Input
                      value={profileData.profileImage}
                      onChange={(e) => handleInputChange('profileImage', e.target.value)}
                      placeholder="https://example.com/your-photo.jpg"
                    />
                  </div>
                </div>

                {/* Business Images Upload */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Business Images</h4>
                  <p className="text-sm text-gray-600">
                    Upload photos of your business, workspace, or completed work to showcase your services (Max 5 images)
                  </p>
                  
                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleBusinessImageUpload}
                      className="hidden"
                      id="business-image-upload-profile"
                      disabled={uploadingBusinessImage || (profileData.businessImages?.length || 0) >= 5}
                    />
                    <label
                      htmlFor="business-image-upload-profile"
                      className={`cursor-pointer flex flex-col items-center gap-2 ${
                        uploadingBusinessImage || (profileData.businessImages?.length || 0) >= 5 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {uploadingBusinessImage ? (
                        <Upload className="w-8 h-8 text-gray-400 animate-spin" />
                      ) : (
                        <Camera className="w-8 h-8 text-gray-400" />
                      )}
                      <div>
                        <p className="text-sm text-gray-600">
                          {uploadingBusinessImage ? 'Uploading...' : 'Click to upload business images'}
                        </p>
                        <p className="text-xs text-gray-500">
                          JPG, PNG up to 10MB each (Max 5 images)
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Image Preview Grid */}
                  {profileData.businessImages && profileData.businessImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {profileData.businessImages.map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <Image
                            src={imageUrl}
                            alt={`Business image ${index + 1}`}
                            width={150}
                            height={100}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removeBusinessImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {(!profileData.businessImages || profileData.businessImages.length === 0) && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No business images uploaded yet. Add some photos to showcase your business!
                    </div>
                  )}
                </div>

                {/* Profile Preview */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium mb-3">Profile Preview</h4>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {profileData.profileImage ? (
                        <img 
                          src={profileData.profileImage} 
                          alt="Profile" 
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        profileData.name?.charAt(0).toUpperCase() || 'P'
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{profileData.name || 'Your Name'}</h3>
                      <p className="text-sm text-gray-600">{profileData.email}</p>
                      <p className="text-sm text-gray-600">{profileData.phone}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Information */}
          <TabsContent value="business">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Business Information
                </CardTitle>
                <CardDescription>
                  Details about your business and services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Business Name</label>
                    <Input
                      value={profileData.businessName}
                      onChange={(e) => handleInputChange('businessName', e.target.value)}
                      placeholder="Your Business Name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Business Email</label>
                    <Input
                      type="email"
                      value={profileData.businessEmail}
                      onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                      placeholder="business@example.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Business Phone</label>
                    <Input
                      type="tel"
                      value={profileData.businessPhone}
                      onChange={(e) => handleInputChange('businessPhone', e.target.value)}
                      placeholder="+1 (555) 987-6543"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Years of Experience</label>
                    <Input
                      type="number"
                      value={profileData.experience}
                      onChange={(e) => handleInputChange('experience', e.target.value)}
                      placeholder="5"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Business Description</label>
                  <Textarea
                    value={profileData.businessDescription}
                    onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                    placeholder="Describe your business, expertise, and what makes you unique..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Service Address</label>
                  <Input
                    value={profileData.businessAddress}
                    onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                    placeholder="123 Main St, City, State, ZIP"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Service Area</label>
                  <Input
                    value={profileData.serviceArea}
                    onChange={(e) => handleInputChange('serviceArea', e.target.value)}
                    placeholder="e.g., 'Within 25 miles of downtown' or 'City and surrounding areas'"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services & Pricing */}
          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle>Services & Pricing</CardTitle>
                <CardDescription>Configure your services and pricing structure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Primary Category</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={profileData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                    >
                      <option value="">Select a category</option>
                      <option value="cleaning">Cleaning</option>
                      <option value="repair">Repair</option>
                      <option value="painting">Painting</option>
                      <option value="shifting">Shifting</option>
                      <option value="plumbing">Plumbing</option>
                      <option value="electric">Electric</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Base Hourly Rate ($)</label>
                    <Input
                      type="number"
                      value={profileData.basePrice}
                      onChange={(e) => handleInputChange('basePrice', e.target.value)}
                      placeholder="50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Emergency Rate ($)</label>
                    <Input
                      type="number"
                      value={profileData.emergencyRate}
                      onChange={(e) => handleInputChange('emergencyRate', e.target.value)}
                      placeholder="75"
                    />
                  </div>
                </div>

                <Card>
                  <CardHeader>
                     <h3 className="text-lg font-semibold text-gray-800">Certifications & Licenses</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Certification Upload */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <label htmlFor="certification-upload" className="mt-2 block text-sm font-medium text-gray-900 cursor-pointer">
                          Upload certification documents
                          <input 
                            id="certification-upload" 
                            name="certification-upload" 
                            type="file" 
                            className="sr-only"
                            multiple
                            onChange={handleCertificationUpload}
                            disabled={uploadingCertifications}
                          />
                        </label>
                        <p className="mt-1 text-xs text-gray-500">
                          {uploadingCertifications ? 'Uploading...' : 'PNG, JPG, PDF up to 10MB'}
                        </p>
                      </div>
                      {/* Display Uploaded Certifications */}
                      <div className="space-y-3">
                        {(profileData.certifications || []).map((cert, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-100 p-3 rounded-md">
                            <div className="flex items-center gap-3">
                              <Award className="h-5 w-5 text-primary" />
                              <a href={cert.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-800 hover:text-primary truncate">
                                {cert.name}
                              </a>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => removeCertification(index)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Availability */}
          <TabsContent value="availability">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Working Hours
                </CardTitle>
                <CardDescription>
                  Set your availability for each day of the week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(profileData.workingHours).map(([day, hours]) => (
                    <div key={day} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg overflow-hidden">
                      <div className="w-full sm:w-20 flex-shrink-0">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={hours.available}
                            onChange={(e) => handleWorkingHoursChange(day, 'available', e.target.checked)}
                          />
                          <span className="font-medium capitalize text-sm">{day}</span>
                        </label>
                      </div>
                      
                      {hours.available && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto min-w-0">
                          <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto min-w-0">
                            <Input
                              type="time"
                              value={hours.start}
                              onChange={(e) => handleWorkingHoursChange(day, 'start', e.target.value)}
                              className="w-24 sm:w-28 text-xs flex-shrink-0"
                            />
                            <span className="text-gray-500 text-xs flex-shrink-0">to</span>
                            <Input
                              type="time"
                              value={hours.end}
                              onChange={(e) => handleWorkingHoursChange(day, 'end', e.target.value)}
                              className="w-24 sm:w-28 text-xs flex-shrink-0"
                            />
                          </div>
                        </div>
                      )}
                      
                      {!hours.available && (
                        <span className="text-gray-500 italic text-sm">Unavailable</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Account Settings
                </CardTitle>
                <CardDescription>
                  Configure your account preferences and notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Booking Settings</h4>
                  
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={profileData.autoAcceptBookings}
                      onChange={(e) => handleInputChange('autoAcceptBookings', e.target.checked)}
                    />
                    <div>
                      <span className="font-medium">Auto-accept bookings</span>
                      <p className="text-sm text-gray-600">Automatically accept booking requests that match your availability</p>
                    </div>
                  </label>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Notification Preferences</h4>
                  
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={profileData.emailNotifications}
                      onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                    />
                    <div>
                      <span className="font-medium">Email notifications</span>
                      <p className="text-sm text-gray-600">Receive booking updates and messages via email</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={profileData.smsNotifications}
                      onChange={(e) => handleInputChange('smsNotifications', e.target.checked)}
                    />
                    <div>
                      <span className="font-medium">SMS notifications</span>
                      <p className="text-sm text-gray-600">Receive urgent notifications via text message</p>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default ProviderProfile 