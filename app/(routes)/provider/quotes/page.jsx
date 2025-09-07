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
  FileText,
  Plus,
  Eye,
  Edit,
  Send,
  CheckCircle2,
  Clock,
  DollarSign,
  Camera,
  Calculator,
  Trash2,
  Copy,
  Download
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

function QuoteManagement() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [quotes, setQuotes] = useState([])
  const [selectedTab, setSelectedTab] = useState('all')
  const [showCreateQuote, setShowCreateQuote] = useState(false)
  const [newQuote, setNewQuote] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    serviceTitle: '',
    description: '',
    items: [],
    photos: [],
    validUntil: '',
    notes: ''
  })
  const [newItem, setNewItem] = useState({
    description: '',
    quantity: 1,
    unitPrice: '',
    total: 0
  })

  // Load quotes
  useEffect(() => {
    if (session?.user) {
      loadQuotes()
    }
  }, [session])

  const loadQuotes = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/provider/quotes')
      
      if (response.ok) {
        const data = await response.json()
        setQuotes(data)
      }
    } catch (error) {
      console.error('Error loading quotes:', error)
      toast.error('Failed to load quotes')
    } finally {
      setIsLoading(false)
    }
  }

  // Create new quote
  const handleCreateQuote = async () => {
    try {
      if (!newQuote.customerName || !newQuote.serviceTitle || newQuote.items.length === 0) {
        toast.error('Please fill in required fields and add at least one item')
        return
      }

      const response = await fetch('/api/provider/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newQuote,
          total: newQuote.items.reduce((sum, item) => sum + item.total, 0)
        })
      })

      if (response.ok) {
        const createdQuote = await response.json()
        setQuotes(prev => [createdQuote, ...prev])
        setShowCreateQuote(false)
        setNewQuote({
          customerName: '',
          customerEmail: '',
          customerPhone: '',
          serviceTitle: '',
          description: '',
          items: [],
          photos: [],
          validUntil: '',
          notes: ''
        })
        toast.success('Quote created successfully!')
      } else {
        throw new Error('Failed to create quote')
      }
    } catch (error) {
      console.error('Error creating quote:', error)
      toast.error('Failed to create quote')
    }
  }

  // Add item to quote
  const addItem = () => {
    if (!newItem.description || !newItem.unitPrice) {
      toast.error('Please enter item description and price')
      return
    }

    const total = newItem.quantity * parseFloat(newItem.unitPrice)
    const item = {
      id: Date.now(),
      ...newItem,
      unitPrice: parseFloat(newItem.unitPrice),
      total
    }

    setNewQuote(prev => ({
      ...prev,
      items: [...prev.items, item]
    }))

    setNewItem({
      description: '',
      quantity: 1,
      unitPrice: '',
      total: 0
    })

    toast.success('Item added to quote')
  }

  // Remove item from quote
  const removeItem = (itemId) => {
    setNewQuote(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }))
  }

  // Send quote to customer
  const sendQuote = async (quoteId) => {
    try {
      const response = await fetch(`/api/provider/quotes/${quoteId}/send`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('Quote sent to customer!')
        loadQuotes()
      } else {
        throw new Error('Failed to send quote')
      }
    } catch (error) {
      console.error('Error sending quote:', error)
      toast.error('Failed to send quote')
    }
  }

  // Convert quote to booking
  const convertToBooking = async (quoteId) => {
    try {
      const response = await fetch(`/api/provider/quotes/${quoteId}/convert`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('Quote converted to booking!')
        loadQuotes()
      } else {
        throw new Error('Failed to convert quote')
      }
    } catch (error) {
      console.error('Error converting quote:', error)
      toast.error('Failed to convert quote')
    }
  }

  // Handle photo upload
  const handlePhotoUpload = async (event) => {
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
          uploadedPhotos.push(data.secure_url)
        }
      }

      setNewQuote(prev => ({
        ...prev,
        photos: [...prev.photos, ...uploadedPhotos]
      }))

      toast.success(`${uploadedPhotos.length} photo(s) uploaded successfully`)
    } catch (error) {
      console.error('Error uploading photos:', error)
      toast.error('Failed to upload photos')
    }
  }

  // Filter quotes by status
  const filteredQuotes = quotes.filter(quote => {
    if (selectedTab === 'all') return true
    return quote.status === selectedTab
  })

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      'draft': 'bg-gray-100 text-gray-800',
      'sent': 'bg-blue-100 text-blue-800',
      'viewed': 'bg-purple-100 text-purple-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'expired': 'bg-orange-100 text-orange-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quotes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Quote Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Create and manage digital quotes and estimates</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Link href="/provider/dashboard">
            <Button variant="outline" className="w-full sm:w-auto text-xs sm:text-sm">
              ← Back to Dashboard
            </Button>
          </Link>
          <Dialog open={showCreateQuote} onOpenChange={setShowCreateQuote}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm w-full sm:w-auto">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Create Quote
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Quote</DialogTitle>
                <DialogDescription>
                  Create a detailed quote for your customer
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Customer Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Customer Name *</label>
                    <Input
                      value={newQuote.customerName}
                      onChange={(e) => setNewQuote(prev => ({ ...prev, customerName: e.target.value }))}
                      placeholder="John Smith"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={newQuote.customerEmail}
                      onChange={(e) => setNewQuote(prev => ({ ...prev, customerEmail: e.target.value }))}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <Input
                      value={newQuote.customerPhone}
                      onChange={(e) => setNewQuote(prev => ({ ...prev, customerPhone: e.target.value }))}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                {/* Service Details */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Service Title *</label>
                    <Input
                      value={newQuote.serviceTitle}
                      onChange={(e) => setNewQuote(prev => ({ ...prev, serviceTitle: e.target.value }))}
                      placeholder="Kitchen Plumbing Repair"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={newQuote.description}
                      onChange={(e) => setNewQuote(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detailed description of the work to be performed..."
                      rows={3}
                    />
                  </div>
                </div>

                {/* Quote Items */}
                <div className="space-y-4">
                  <h3 className="font-medium">Quote Items</h3>
                  
                  {/* Add Item Form */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
                    <div className="md:col-span-2">
                      <Input
                        placeholder="Item description"
                        value={newItem.description}
                        onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem(prev => ({ 
                          ...prev, 
                          quantity: parseInt(e.target.value) || 1 
                        }))}
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Unit Price"
                        value={newItem.unitPrice}
                        onChange={(e) => setNewItem(prev => ({ ...prev, unitPrice: e.target.value }))}
                      />
                    </div>
                    <Button onClick={addItem}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>

                  {/* Items List */}
                  {newQuote.items.length > 0 && (
                    <div className="space-y-2">
                      {newQuote.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{item.description}</div>
                            <div className="text-sm text-gray-600">
                              {item.quantity} × ${item.unitPrice} = ${item.total.toFixed(2)}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="pt-2 border-t">
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total:</span>
                          <span>${newQuote.items.reduce((sum, item) => sum + item.total, 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Photos */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reference Photos</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">Upload reference photos</p>
                    </label>
                  </div>
                  
                  {newQuote.photos.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {newQuote.photos.map((photo, index) => (
                        <div key={index} className="relative">
                          <Image
                            src={photo}
                            alt={`Reference ${index + 1}`}
                            width={100}
                            height={100}
                            className="rounded-md object-cover w-full h-20"
                          />
                          <button
                            onClick={() => {
                              setNewQuote(prev => ({
                                ...prev,
                                photos: prev.photos.filter((_, i) => i !== index)
                              }))
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Valid Until</label>
                    <Input
                      type="date"
                      value={newQuote.validUntil}
                      onChange={(e) => setNewQuote(prev => ({ ...prev, validUntil: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Additional Notes</label>
                    <Textarea
                      value={newQuote.notes}
                      onChange={(e) => setNewQuote(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Terms, conditions, or additional information..."
                      rows={2}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowCreateQuote(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateQuote}
                    disabled={!newQuote.customerName || !newQuote.serviceTitle || newQuote.items.length === 0}
                  >
                    Create Quote
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quote Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{quotes.length}</p>
                <p className="text-sm text-gray-600">Total Quotes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {quotes.filter(q => q.status === 'approved').length}
                </p>
                <p className="text-sm text-gray-600">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {quotes.filter(q => ['sent', 'viewed'].includes(q.status)).length}
                </p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ${quotes
                    .filter(q => q.status === 'approved')
                    .reduce((sum, q) => sum + (q.total || 0), 0)
                    .toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Approved Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quote List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Quotes</CardTitle>
          <CardDescription>
            Manage and track all your quotes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <div className="overflow-x-auto pb-2">
              <TabsList className="flex w-full min-w-[600px] sm:min-w-0 sm:grid sm:grid-cols-6">
                <TabsTrigger value="all" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">All ({quotes.length})</TabsTrigger>
                <TabsTrigger value="draft" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">Draft ({quotes.filter(q => q.status === 'draft').length})</TabsTrigger>
                <TabsTrigger value="sent" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">Sent ({quotes.filter(q => q.status === 'sent').length})</TabsTrigger>
                <TabsTrigger value="viewed" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">Viewed ({quotes.filter(q => q.status === 'viewed').length})</TabsTrigger>
                <TabsTrigger value="approved" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">Approved ({quotes.filter(q => q.status === 'approved').length})</TabsTrigger>
                <TabsTrigger value="rejected" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">Rejected ({quotes.filter(q => q.status === 'rejected').length})</TabsTrigger>
              </TabsList>
            </div>

            <div className="mt-6">
              {filteredQuotes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <h3 className="text-lg font-medium">No quotes found</h3>
                  <p className="text-sm">
                    {selectedTab === 'all' 
                      ? 'Create your first quote to get started' 
                      : `No ${selectedTab} quotes at the moment`
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredQuotes.map(quote => (
                    <div key={quote.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{quote.serviceTitle}</h3>
                            <Badge className={getStatusColor(quote.status)}>
                              {quote.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Customer: {quote.customerName}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Created: {new Date(quote.createdAt).toLocaleDateString()}</span>
                            <span>Total: ${quote.total?.toFixed(2) || '0.00'}</span>
                            {quote.validUntil && (
                              <span>Valid Until: {new Date(quote.validUntil).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          {quote.status === 'draft' && (
                            <Button 
                              size="sm"
                              onClick={() => sendQuote(quote.id)}
                            >
                              <Send className="w-4 h-4 mr-1" />
                              Send
                            </Button>
                          )}
                          {quote.status === 'approved' && (
                            <Button 
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => convertToBooking(quote.id)}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Convert to Booking
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default QuoteManagement 