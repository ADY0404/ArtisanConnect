"use client"
import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  DollarSign,
  Calendar,
  MapPin,
  Tag,
  TrendingUp,
  Clock,
  Users,
  Star,
  Gift,
  Target,
  Settings
} from 'lucide-react'

function ServiceManagement() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('packages')
  const [showCreatePackage, setShowCreatePackage] = useState(false)
  const [showCreatePromo, setShowCreatePromo] = useState(false)
  const [editingPackage, setEditingPackage] = useState(null)

  // Service packages state
  const [servicePackages, setServicePackages] = useState([])
  const [newPackage, setNewPackage] = useState({
    name: '',
    description: '',
    category: '',
    services: [],
    pricing: {
      base: 0,
      premium: 0,
      enterprise: 0
    },
    duration: '',
    features: [],
    isActive: true
  })

  // Seasonal pricing state
  const [seasonalPricing, setSeasonalPricing] = useState([])
  const [newSeasonalRate, setNewSeasonalRate] = useState({
    name: '',
    startDate: '',
    endDate: '',
    adjustmentType: 'percentage', // percentage or fixed
    adjustmentValue: 0,
    applicableServices: [],
    isActive: true
  })

  // Promotional packages state
  const [promotionalPackages, setPromotionalPackages] = useState([])
  const [newPromotion, setNewPromotion] = useState({
    title: '',
    description: '',
    discountType: 'percentage', // percentage or fixed
    discountValue: 0,
    validFrom: '',
    validUntil: '',
    maxUses: 0,
    currentUses: 0,
    applicablePackages: [],
    isActive: true
  })

  // Service areas state
  const [serviceAreas, setServiceAreas] = useState([])
  const [newServiceArea, setNewServiceArea] = useState({
    name: '',
    radius: 10,
    coordinates: { lat: 0, lng: 0 },
    travelFee: 0,
    isActive: true
  })

  useEffect(() => {
    if (session?.user) {
      loadServiceData()
    }
  }, [session])

  const loadServiceData = async () => {
    try {
      setIsLoading(true)
      
      // Load service packages
      const packagesResponse = await fetch('/api/provider/service-packages')
      if (packagesResponse.ok) {
        const packages = await packagesResponse.json()
        setServicePackages(packages)
      } else {
        // Mock data for development
        setServicePackages([
          {
            id: 'pkg1',
            name: 'Basic Plumbing Service',
            description: 'Essential plumbing repairs and maintenance',
            category: 'plumbing',
            services: ['Leak Repair', 'Faucet Installation', 'Basic Inspection'],
            pricing: {
              base: 80,
              premium: 120,
              enterprise: 180
            },
            duration: '2-3 hours',
            features: ['Same-day service', '30-day warranty', 'Free consultation'],
            isActive: true,
            bookingCount: 15,
            averageRating: 4.8
          },
          {
            id: 'pkg2',
            name: 'Complete Kitchen Renovation',
            description: 'Full kitchen plumbing installation and renovation',
            category: 'plumbing',
            services: ['Pipe Installation', 'Appliance Connection', 'Water Line Setup'],
            pricing: {
              base: 500,
              premium: 750,
              enterprise: 1200
            },
            duration: '1-2 days',
            features: ['Professional design', '1-year warranty', 'Premium materials'],
            isActive: true,
            bookingCount: 8,
            averageRating: 4.9
          }
        ])
      }

      // Load seasonal pricing
      setSeasonalPricing([
        {
          id: 'season1',
          name: 'Winter Emergency Rate',
          startDate: '2024-12-01',
          endDate: '2024-02-28',
          adjustmentType: 'percentage',
          adjustmentValue: 25,
          applicableServices: ['Emergency Repair', 'Heating Installation'],
          isActive: true
        },
        {
          id: 'season2',
          name: 'Summer Maintenance Special',
          startDate: '2024-06-01',
          endDate: '2024-08-31',
          adjustmentType: 'percentage',
          adjustmentValue: -15,
          applicableServices: ['AC Installation', 'Cooling System Maintenance'],
          isActive: true
        }
      ])

      // Load promotional packages
      setPromotionalPackages([
        {
          id: 'promo1',
          title: 'New Customer Special',
          description: '20% off first service for new customers',
          discountType: 'percentage',
          discountValue: 20,
          validFrom: '2024-01-01',
          validUntil: '2024-12-31',
          maxUses: 100,
          currentUses: 23,
          applicablePackages: ['pkg1'],
          isActive: true
        },
        {
          id: 'promo2',
          title: 'Bundle Deal - Kitchen & Bathroom',
          description: 'Save $100 when booking both kitchen and bathroom services',
          discountType: 'fixed',
          discountValue: 100,
          validFrom: '2024-01-15',
          validUntil: '2024-03-15',
          maxUses: 50,
          currentUses: 12,
          applicablePackages: ['pkg1', 'pkg2'],
          isActive: true
        }
      ])

      // Load service areas
      setServiceAreas([
        {
          id: 'area1',
          name: 'Downtown Core',
          radius: 5,
          coordinates: { lat: 40.7128, lng: -74.0060 },
          travelFee: 0,
          isActive: true,
          serviceCount: 45
        },
        {
          id: 'area2',
          name: 'Suburban Districts',
          radius: 15,
          coordinates: { lat: 40.7589, lng: -73.9851 },
          travelFee: 25,
          isActive: true,
          serviceCount: 28
        }
      ])

    } catch (error) {
      console.error('Error loading service data:', error)
      toast.error('Failed to load service data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreatePackage = async () => {
    try {
      const response = await fetch('/api/provider/service-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPackage)
      })

      if (response.ok) {
        toast.success('Service package created successfully!')
        setShowCreatePackage(false)
        setNewPackage({
          name: '',
          description: '',
          category: '',
          services: [],
          pricing: { base: 0, premium: 0, enterprise: 0 },
          duration: '',
          features: [],
          isActive: true
        })
        loadServiceData()
      } else {
        toast.error('Failed to create service package')
      }
    } catch (error) {
      console.error('Error creating package:', error)
      toast.error('Failed to create service package')
    }
  }

  const handleCreatePromotion = async () => {
    try {
      const response = await fetch('/api/provider/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPromotion)
      })

      if (response.ok) {
        toast.success('Promotion created successfully!')
        setShowCreatePromo(false)
        setNewPromotion({
          title: '',
          description: '',
          discountType: 'percentage',
          discountValue: 0,
          validFrom: '',
          validUntil: '',
          maxUses: 0,
          currentUses: 0,
          applicablePackages: [],
          isActive: true
        })
        loadServiceData()
      } else {
        toast.error('Failed to create promotion')
      }
    } catch (error) {
      console.error('Error creating promotion:', error)
      toast.error('Failed to create promotion')
    }
  }

  const addServiceToPackage = (service) => {
    if (!newPackage.services.includes(service)) {
      setNewPackage(prev => ({
        ...prev,
        services: [...prev.services, service]
      }))
    }
  }

  const removeServiceFromPackage = (service) => {
    setNewPackage(prev => ({
      ...prev,
      services: prev.services.filter(s => s !== service)
    }))
  }

  const addFeatureToPackage = (feature) => {
    if (feature.trim() && !newPackage.features.includes(feature.trim())) {
      setNewPackage(prev => ({
        ...prev,
        features: [...prev.features, feature.trim()]
      }))
    }
  }

  const removeFeatureFromPackage = (feature) => {
    setNewPackage(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature)
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading service management...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Service Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your service packages, pricing, and coverage areas</p>
        </div>
        <Link href="/provider/dashboard">
          <Button variant="outline" className="w-full sm:w-auto text-xs sm:text-sm">
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <div className="overflow-x-auto pb-2">
          <TabsList className="flex w-full min-w-[600px] sm:min-w-0 sm:grid sm:grid-cols-4">
            <TabsTrigger value="packages" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0 flex items-center gap-1 sm:gap-2">
              <Package className="w-3 h-3 sm:w-4 sm:h-4" />
              Service Packages
            </TabsTrigger>
            <TabsTrigger value="pricing" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0 flex items-center gap-1 sm:gap-2">
              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
              Seasonal Pricing
            </TabsTrigger>
            <TabsTrigger value="promotions" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0 flex items-center gap-1 sm:gap-2">
              <Gift className="w-3 h-3 sm:w-4 sm:h-4" />
              Promotions
            </TabsTrigger>
            <TabsTrigger value="areas" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0 flex items-center gap-1 sm:gap-2">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
              Service Areas
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Service Packages Tab */}
        <TabsContent value="packages" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Service Packages & Bundles</h2>
            <Dialog open={showCreatePackage} onOpenChange={setShowCreatePackage}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Package
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Service Package</DialogTitle>
                  <DialogDescription>
                    Create a new service package with multiple tiers and features
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Package Name</label>
                      <Input
                        placeholder="e.g., Complete Kitchen Service"
                        value={newPackage.name}
                        onChange={(e) => setNewPackage(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={newPackage.category}
                        onChange={(e) => setNewPackage(prev => ({ ...prev, category: e.target.value }))}
                      >
                        <option value="">Select Category</option>
                        <option value="plumbing">Plumbing</option>
                        <option value="electrical">Electrical</option>
                        <option value="cleaning">Cleaning</option>
                        <option value="repair">Repair</option>
                        <option value="painting">Painting</option>
                        <option value="shifting">Shifting</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      placeholder="Describe what's included in this package..."
                      value={newPackage.description}
                      onChange={(e) => setNewPackage(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Estimated Duration</label>
                    <Input
                      placeholder="e.g., 2-3 hours, 1-2 days"
                      value={newPackage.duration}
                      onChange={(e) => setNewPackage(prev => ({ ...prev, duration: e.target.value }))}
                    />
                  </div>

                  {/* Pricing Tiers */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Pricing Tiers</label>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-600">Basic ($)</label>
                        <Input
                          type="number"
                          placeholder="80"
                          value={newPackage.pricing.base}
                          onChange={(e) => setNewPackage(prev => ({
                            ...prev,
                            pricing: { ...prev.pricing, base: Number(e.target.value) }
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-600">Premium ($)</label>
                        <Input
                          type="number"
                          placeholder="120"
                          value={newPackage.pricing.premium}
                          onChange={(e) => setNewPackage(prev => ({
                            ...prev,
                            pricing: { ...prev.pricing, premium: Number(e.target.value) }
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-600">Enterprise ($)</label>
                        <Input
                          type="number"
                          placeholder="180"
                          value={newPackage.pricing.enterprise}
                          onChange={(e) => setNewPackage(prev => ({
                            ...prev,
                            pricing: { ...prev.pricing, enterprise: Number(e.target.value) }
                          }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Services Included */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Services Included</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {newPackage.services.map((service, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {service}
                          <button
                            onClick={() => removeServiceFromPackage(service)}
                            className="ml-1 text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a service..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addServiceToPackage(e.target.value)
                            e.target.value = ''
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={(e) => {
                          const input = e.target.parentElement.querySelector('input')
                          addServiceToPackage(input.value)
                          input.value = ''
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Package Features</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {newPackage.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          {feature}
                          <button
                            onClick={() => removeFeatureFromPackage(feature)}
                            className="ml-1 text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a feature..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addFeatureToPackage(e.target.value)
                            e.target.value = ''
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={(e) => {
                          const input = e.target.parentElement.querySelector('input')
                          addFeatureToPackage(input.value)
                          input.value = ''
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setShowCreatePackage(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreatePackage} className="bg-blue-600 hover:bg-blue-700">
                      Create Package
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Service Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicePackages.map((pkg) => (
              <Card key={pkg.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{pkg.name}</CardTitle>
                      <CardDescription className="mt-1">{pkg.description}</CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditingPackage(pkg)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Pricing Tiers */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Pricing Tiers</h4>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center">
                        <div className="font-medium">Basic</div>
                        <div className="text-green-600">${pkg.pricing.base}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">Premium</div>
                        <div className="text-blue-600">${pkg.pricing.premium}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">Enterprise</div>
                        <div className="text-purple-600">${pkg.pricing.enterprise}</div>
                      </div>
                    </div>
                  </div>

                  {/* Services */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Services Included</h4>
                    <div className="flex flex-wrap gap-1">
                      {pkg.services.slice(0, 3).map((service, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                      {pkg.services.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{pkg.services.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {pkg.bookingCount} bookings
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      {pkg.averageRating}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {pkg.duration}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex justify-between items-center">
                    <Badge variant={pkg.isActive ? "default" : "secondary"}>
                      {pkg.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Seasonal Pricing Tab */}
        <TabsContent value="pricing" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Seasonal Pricing Adjustments</h2>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Seasonal Rate
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {seasonalPricing.map((season) => (
              <Card key={season.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{season.name}</CardTitle>
                      <CardDescription>
                        {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge variant={season.isActive ? "default" : "secondary"}>
                      {season.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Price Adjustment</span>
                    <div className={`text-lg font-bold ${season.adjustmentValue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {season.adjustmentValue > 0 ? '+' : ''}{season.adjustmentValue}
                      {season.adjustmentType === 'percentage' ? '%' : '$'}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Applicable Services</span>
                    <div className="flex flex-wrap gap-1">
                      {season.applicableServices.map((service, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Promotions Tab */}
        <TabsContent value="promotions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Promotional Packages</h2>
            <Dialog open={showCreatePromo} onOpenChange={setShowCreatePromo}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Promotion
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Promotion</DialogTitle>
                  <DialogDescription>
                    Create a promotional offer to attract customers
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Promotion Title</label>
                    <Input
                      placeholder="e.g., New Customer Special"
                      value={newPromotion.title}
                      onChange={(e) => setNewPromotion(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      placeholder="Describe the promotional offer..."
                      value={newPromotion.description}
                      onChange={(e) => setNewPromotion(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Discount Type</label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={newPromotion.discountType}
                        onChange={(e) => setNewPromotion(prev => ({ ...prev, discountType: e.target.value }))}
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Discount Value ({newPromotion.discountType === 'percentage' ? '%' : '$'})
                      </label>
                      <Input
                        type="number"
                        placeholder="20"
                        value={newPromotion.discountValue}
                        onChange={(e) => setNewPromotion(prev => ({ ...prev, discountValue: Number(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Valid From</label>
                      <Input
                        type="date"
                        value={newPromotion.validFrom}
                        onChange={(e) => setNewPromotion(prev => ({ ...prev, validFrom: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Valid Until</label>
                      <Input
                        type="date"
                        value={newPromotion.validUntil}
                        onChange={(e) => setNewPromotion(prev => ({ ...prev, validUntil: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Maximum Uses</label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={newPromotion.maxUses}
                      onChange={(e) => setNewPromotion(prev => ({ ...prev, maxUses: Number(e.target.value) }))}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setShowCreatePromo(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreatePromotion} className="bg-purple-600 hover:bg-purple-700">
                      Create Promotion
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {promotionalPackages.map((promo) => (
              <Card key={promo.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{promo.title}</CardTitle>
                      <CardDescription>{promo.description}</CardDescription>
                    </div>
                    <Badge variant={promo.isActive ? "default" : "secondary"}>
                      {promo.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Discount</span>
                    <div className="text-lg font-bold text-green-600">
                      {promo.discountType === 'percentage' ? `${promo.discountValue}%` : `$${promo.discountValue}`} OFF
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Valid Period</span>
                    <span className="text-gray-600">
                      {new Date(promo.validFrom).toLocaleDateString()} - {new Date(promo.validUntil).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span>Usage</span>
                    <span className="text-gray-600">
                      {promo.currentUses} / {promo.maxUses} used
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(promo.currentUses / promo.maxUses) * 100}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Service Areas Tab */}
        <TabsContent value="areas" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Service Area Coverage</h2>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Service Area
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serviceAreas.map((area) => (
              <Card key={area.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{area.name}</CardTitle>
                      <CardDescription>
                        {area.radius} mile radius
                      </CardDescription>
                    </div>
                    <Badge variant={area.isActive ? "default" : "secondary"}>
                      {area.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Travel Fee</span>
                    <div className="text-lg font-bold">
                      {area.travelFee === 0 ? 'Free' : `$${area.travelFee}`}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Services Completed</span>
                    <span className="text-gray-600">{area.serviceCount}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span>Coordinates</span>
                    <span className="text-gray-600 text-xs">
                      {area.coordinates.lat.toFixed(4)}, {area.coordinates.lng.toFixed(4)}
                    </span>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <MapPin className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ServiceManagement 