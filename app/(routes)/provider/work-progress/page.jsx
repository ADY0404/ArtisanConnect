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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Clock,
  Camera,
  MapPin,
  User,
  Phone,
  MessageCircle,
  Play,
  Square,
  CheckCircle2,
  Upload,
  X,
  Plus,
  Navigation,
  Timer,
  Wrench,
  FileText,
  PenTool
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

function WorkProgress() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [activeBookings, setActiveBookings] = useState([])
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [workSession, setWorkSession] = useState(null)
  const [photos, setPhotos] = useState({ before: [], during: [], after: [] })
  const [materials, setMaterials] = useState([])
  const [workNotes, setWorkNotes] = useState('')
  const [newMaterial, setNewMaterial] = useState({ name: '', quantity: '', cost: '' })
  const [customerSignature, setCustomerSignature] = useState(null)

  // Load active bookings
  useEffect(() => {
    if (session?.user) {
      loadActiveBookings()
    }
  }, [session])

  const loadActiveBookings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/provider/bookings?status=active')
      
      if (response.ok) {
        const data = await response.json()
        setActiveBookings(data.filter(booking => 
          ['CONFIRMED', 'IN_PROGRESS'].includes(booking.status)
        ))
      }
    } catch (error) {
      console.error('Error loading active bookings:', error)
      toast.error('Failed to load active bookings')
    } finally {
      setIsLoading(false)
    }
  }

  // Start work session
  const startWork = async (booking) => {
    try {
      const response = await fetch('/api/provider/work-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id,
          action: 'start'
        })
      })

      if (response.ok) {
        const session = await response.json()
        setWorkSession(session)
        setSelectedBooking(booking)
        
        // Update booking status to IN_PROGRESS
        await updateBookingStatus(booking.id, 'IN_PROGRESS')
        
        toast.success('Work session started!')
      }
    } catch (error) {
      console.error('Error starting work session:', error)
      toast.error('Failed to start work session')
    }
  }

  // End work session
  const endWork = async () => {
    try {
      const response = await fetch('/api/provider/work-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          action: 'end',
          notes: workNotes,
          materials,
          photos
        })
      })

      if (response.ok) {
        setWorkSession(null)
        toast.success('Work session completed!')
        loadActiveBookings()
      }
    } catch (error) {
      console.error('Error ending work session:', error)
      toast.error('Failed to end work session')
    }
  }

  // Update booking status
  const updateBookingStatus = async (bookingId, status) => {
    try {
      const response = await fetch('/api/provider/bookings/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId, status })
      })

      if (response.ok) {
        loadActiveBookings()
      }
    } catch (error) {
      console.error('Error updating booking status:', error)
    }
  }

  // Handle photo upload
  const handlePhotoUpload = async (event, category) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return

    try {
      const uploadedPhotos = []
      
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', 'unsigned_preset')
        formData.append('cloud_name', 'dbande9tt')

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/dbande9tt/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        )

        if (response.ok) {
          const data = await response.json()
          uploadedPhotos.push({
            url: data.secure_url,
            timestamp: new Date(),
            category
          })
        }
      }

      setPhotos(prev => ({
        ...prev,
        [category]: [...prev[category], ...uploadedPhotos]
      }))

      // Notify customer of photo update
      await fetch('/api/provider/work-updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          type: 'photo_update',
          message: `${category} photos have been uploaded`,
          photos: uploadedPhotos
        })
      })

      toast.success(`${category} photos uploaded successfully!`)
    } catch (error) {
      console.error('Error uploading photos:', error)
      toast.error('Failed to upload photos')
    }
  }

  // Add material
  const addMaterial = () => {
    if (!newMaterial.name.trim()) {
      toast.error('Please enter material name')
      return
    }

    setMaterials(prev => [...prev, {
      id: Date.now(),
      ...newMaterial,
      timestamp: new Date()
    }])

    setNewMaterial({ name: '', quantity: '', cost: '' })
    toast.success('Material added')
  }

  // Remove material
  const removeMaterial = (materialId) => {
    setMaterials(prev => prev.filter(m => m.id !== materialId))
  }

  // Send ETA update
  const sendETAUpdate = async (eta) => {
    try {
      const response = await fetch('/api/provider/work-updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          type: 'eta_update',
          message: `Provider will arrive in ${eta} minutes`,
          eta
        })
      })

      if (response.ok) {
        toast.success('ETA sent to customer')
      }
    } catch (error) {
      console.error('Error sending ETA:', error)
      toast.error('Failed to send ETA')
    }
  }

  // Format duration
  const formatDuration = (startTime) => {
    if (!startTime) return '00:00'
    const now = new Date()
    const start = new Date(startTime)
    const diff = Math.floor((now - start) / 1000)
    const hours = Math.floor(diff / 3600)
    const minutes = Math.floor((diff % 3600) / 60)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading work progress...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Work Progress</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your on-site service delivery</p>
        </div>
        <Link href="/provider/dashboard">
          <Button variant="outline" className="w-full sm:w-auto text-xs sm:text-sm">
            ← Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Active Work Session */}
      {workSession && selectedBooking && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Timer className="w-5 h-5" />
              Active Work Session
            </CardTitle>
            <CardDescription>
              Working on: {selectedBooking.userName}'s {selectedBooking.serviceDetails}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Timer */}
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {formatDuration(workSession.startTime)}
                </div>
                <p className="text-sm text-gray-600">Time Elapsed</p>
                <Button 
                  onClick={endWork}
                  className="mt-2 bg-red-600 hover:bg-red-700"
                  size="sm"
                >
                  <Square className="w-4 h-4 mr-1" />
                  End Work
                </Button>
              </div>

              {/* Customer Info */}
              <div className="space-y-2">
                <h4 className="font-medium">Customer Details</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {selectedBooking.userName}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {selectedBooking.userPhone || 'N/A'}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {selectedBooking.address || 'Address not provided'}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <h4 className="font-medium">Quick Actions</h4>
                <div className="space-y-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => sendETAUpdate(15)}
                  >
                    <Navigation className="w-4 h-4 mr-1" />
                    Send ETA (15 min)
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Message Customer
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Work Session Details */}
      {workSession && selectedBooking && (
        <Tabs defaultValue="photos" className="space-y-4">
          <div className="overflow-x-auto pb-2">
            <TabsList className="flex w-full min-w-[400px] sm:min-w-0 sm:grid sm:grid-cols-4">
              <TabsTrigger value="photos" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">Photos</TabsTrigger>
              <TabsTrigger value="materials" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">Materials</TabsTrigger>
              <TabsTrigger value="notes" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">Work Notes</TabsTrigger>
              <TabsTrigger value="completion" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">Completion</TabsTrigger>
            </TabsList>
          </div>

          {/* Photos Tab */}
          <TabsContent value="photos">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['before', 'during', 'after'].map(category => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="capitalize">{category} Photos</CardTitle>
                    <CardDescription>
                      Document work progress with {category} photos
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handlePhotoUpload(e, category)}
                        className="hidden"
                        id={`${category}-upload`}
                      />
                      <label 
                        htmlFor={`${category}-upload`}
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Camera className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-600">Add {category} photos</span>
                      </label>
                    </div>

                    {/* Photo Grid */}
                    {photos[category].length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {photos[category].map((photo, index) => (
                          <div key={index} className="relative">
                            <Image
                              src={photo.url}
                              alt={`${category} photo ${index + 1}`}
                              width={150}
                              height={150}
                              className="rounded-md object-cover w-full h-24"
                            />
                            <button
                              onClick={() => {
                                setPhotos(prev => ({
                                  ...prev,
                                  [category]: prev[category].filter((_, i) => i !== index)
                                }))
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Materials & Parts Used
                </CardTitle>
                <CardDescription>
                  Track materials and parts used for this job
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Material Form */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                  <Input
                    placeholder="Material/Part name"
                    value={newMaterial.name}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    placeholder="Quantity"
                    value={newMaterial.quantity}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, quantity: e.target.value }))}
                  />
                  <Input
                    placeholder="Cost ($)"
                    type="number"
                    value={newMaterial.cost}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, cost: e.target.value }))}
                  />
                  <Button onClick={addMaterial}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>

                {/* Materials List */}
                {materials.length > 0 && (
                  <div className="space-y-2">
                    {materials.map(material => (
                      <div key={material.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{material.name}</div>
                          <div className="text-sm text-gray-600">
                            Qty: {material.quantity} | Cost: ${material.cost}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeMaterial(material.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="pt-2 border-t">
                      <div className="flex justify-between font-medium">
                        <span>Total Materials Cost:</span>
                        <span>${materials.reduce((sum, m) => sum + (parseFloat(m.cost) || 0), 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Work Notes Tab */}
          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Work Notes & Documentation
                </CardTitle>
                <CardDescription>
                  Document work performed, issues found, and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter detailed work notes, issues found, solutions applied, and any recommendations for the customer..."
                  value={workNotes}
                  onChange={(e) => setWorkNotes(e.target.value)}
                  rows={8}
                  className="w-full"
                />
                <div className="mt-4 text-sm text-gray-500">
                  These notes will be shared with the customer and included in the service report.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Completion Tab */}
          <TabsContent value="completion">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Job Completion
                </CardTitle>
                <CardDescription>
                  Finalize the job and get customer approval
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Work Summary */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Work Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Duration:</span>
                      <span className="ml-2 font-medium">{formatDuration(workSession?.startTime)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Photos Taken:</span>
                      <span className="ml-2 font-medium">
                        {Object.values(photos).flat().length}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Materials Used:</span>
                      <span className="ml-2 font-medium">{materials.length} items</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Materials Cost:</span>
                      <span className="ml-2 font-medium">
                        ${materials.reduce((sum, m) => sum + (parseFloat(m.cost) || 0), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Signature */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Customer Signature (Optional)</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <PenTool className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">Digital signature feature would be implemented here</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Capture Signature
                    </Button>
                  </div>
                </div>

                {/* Complete Job Button */}
                <div className="pt-4 border-t">
                  <Button 
                    onClick={endWork}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Complete Job & Send Report
                  </Button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    This will end the work session and send a completion report to the customer
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Available Bookings */}
      {!workSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Today's Active Bookings
            </CardTitle>
            <CardDescription>
              Select a booking to start work progress tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <h3 className="text-lg font-medium">No active bookings</h3>
                <p className="text-sm">Confirmed bookings will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeBookings.map(booking => (
                  <div key={booking.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{booking.userName}</h3>
                          <Badge className={
                            booking.status === 'CONFIRMED' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }>
                            {booking.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{booking.serviceDetails}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>📅 {booking.date}</span>
                          <span>🕐 {booking.time}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Chat
                        </Button>
                        <Button 
                          onClick={() => startWork(booking)}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Start Work
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default WorkProgress 