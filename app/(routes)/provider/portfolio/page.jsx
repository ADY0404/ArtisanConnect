"use client"
import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Camera, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Upload,
  Image as ImageIcon,
  Calendar,
  DollarSign,
  Star,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

function ProviderPortfolio() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [portfolioItems, setPortfolioItems] = useState([])
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    category: '',
    images: [],
    completionDate: '',
    projectCost: '',
    clientName: '',
    location: '',
    tags: []
  })

  // Load portfolio data
  useEffect(() => {
    if (session?.user) {
      loadPortfolio()
    }
  }, [session])

  const loadPortfolio = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/provider/portfolio')
      
      if (response.ok) {
        const data = await response.json()
        setPortfolioItems(data.portfolioItems || [])
      } else {
        // Set mock data for demonstration
        setPortfolioItems([
          {
            id: '1',
            title: 'Kitchen Renovation',
            description: 'Complete kitchen makeover including new cabinets, countertops, and appliances.',
            category: 'Repair',
            images: ['/api/placeholder/400/300'],
            completionDate: '2024-01-15',
            projectCost: '5000',
            clientName: 'John Smith',
            location: 'Downtown Area',
            tags: ['Kitchen', 'Renovation', 'Cabinets'],
            rating: 5,
            clientReview: 'Excellent work! Very professional and completed on time.'
          },
          {
            id: '2',
            title: 'Bathroom Plumbing Fix',
            description: 'Fixed major plumbing issues and installed new fixtures.',
            category: 'Plumbing',
            images: ['/api/placeholder/400/300'],
            completionDate: '2024-01-10',
            projectCost: '800',
            clientName: 'Sarah Johnson',
            location: 'Suburban Area',
            tags: ['Plumbing', 'Bathroom', 'Fixtures'],
            rating: 5,
            clientReview: 'Quick response and quality work. Highly recommended!'
          }
        ])
      }
    } catch (error) {
      console.error('Error loading portfolio:', error)
      toast.error('Failed to load portfolio')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddItem = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/provider/portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem)
      })

      if (response.ok) {
        const addedItem = await response.json()
        setPortfolioItems(prev => [addedItem, ...prev])
        setNewItem({
          title: '',
          description: '',
          category: '',
          images: [],
          completionDate: '',
          projectCost: '',
          clientName: '',
          location: '',
          tags: []
        })
        setIsAddingItem(false)
        toast.success('Portfolio item added successfully!')
      } else {
        throw new Error('Failed to add portfolio item')
      }
    } catch (error) {
      console.error('Error adding portfolio item:', error)
      toast.error('Failed to add portfolio item')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this portfolio item?')) return

    try {
      const response = await fetch(`/api/provider/portfolio/${itemId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setPortfolioItems(prev => prev.filter(item => item.id !== itemId))
        toast.success('Portfolio item deleted successfully!')
      } else {
        throw new Error('Failed to delete portfolio item')
      }
    } catch (error) {
      console.error('Error deleting portfolio item:', error)
      toast.error('Failed to delete portfolio item')
    }
  }

  const categories = ['Cleaning', 'Repair', 'Painting', 'Shifting', 'Plumbing', 'Electric']

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your portfolio...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Portfolio</h1>
              <p className="mt-1 text-gray-600">
                Showcase your best work to attract more customers
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/provider/dashboard">
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </Button>
              </Link>
              <Button 
                onClick={() => setIsAddingItem(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Project
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{portfolioItems.length}</p>
                  <p className="text-sm text-gray-600">Total Projects</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {portfolioItems.length > 0 
                      ? (portfolioItems.reduce((acc, item) => acc + (item.rating || 0), 0) / portfolioItems.length).toFixed(1)
                      : '0.0'
                    }
                  </p>
                  <p className="text-sm text-gray-600">Avg Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    ${portfolioItems.reduce((acc, item) => acc + (parseInt(item.projectCost) || 0), 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Total Value</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {portfolioItems.filter(item => {
                      const completionDate = new Date(item.completionDate)
                      const threeMonthsAgo = new Date()
                      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
                      return completionDate > threeMonthsAgo
                    }).length}
                  </p>
                  <p className="text-sm text-gray-600">Recent Projects</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Grid */}
        {portfolioItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolioItems.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48 bg-gray-200">
                  {item.images && item.images.length > 0 ? (
                    <Image
                      src={item.images[0]}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Actions Overlay */}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button size="sm" variant="secondary" className="w-8 h-8 p-0">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="w-8 h-8 p-0"
                      onClick={() => setEditingItem(item)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      className="w-8 h-8 p-0"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <Badge variant="outline">{item.category}</Badge>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {item.description}
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Completed:</span>
                      <span>{new Date(item.completionDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Value:</span>
                      <span className="font-medium">${parseInt(item.projectCost).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Location:</span>
                      <span>{item.location}</span>
                    </div>
                    {item.rating && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Rating:</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{item.rating}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {item.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {item.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{item.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {item.clientReview && (
                    <div className="mt-3 p-2 bg-gray-50 rounded text-xs italic">
                      "{item.clientReview}"
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Camera className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold mb-2">No Portfolio Items Yet</h3>
              <p className="text-gray-600 mb-6">
                Start building your portfolio by adding your completed projects
              </p>
              <Button onClick={() => setIsAddingItem(true)} className="flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" />
                Add Your First Project
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Item Dialog */}
      <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Portfolio Item</DialogTitle>
            <DialogDescription>
              Showcase a completed project to attract more customers
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Title</label>
                <Input
                  value={newItem.title}
                  onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Kitchen Renovation"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={newItem.category}
                  onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={newItem.description}
                onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the project, challenges solved, and results achieved..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Completion Date</label>
                <Input
                  type="date"
                  value={newItem.completionDate}
                  onChange={(e) => setNewItem(prev => ({ ...prev, completionDate: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Cost ($)</label>
                <Input
                  type="number"
                  value={newItem.projectCost}
                  onChange={(e) => setNewItem(prev => ({ ...prev, projectCost: e.target.value }))}
                  placeholder="1500"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Input
                  value={newItem.location}
                  onChange={(e) => setNewItem(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Downtown Area"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Client Name (Optional)</label>
              <Input
                value={newItem.clientName}
                onChange={(e) => setNewItem(prev => ({ ...prev, clientName: e.target.value }))}
                placeholder="John Smith"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Project Images</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">Upload project photos</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Choose Files
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsAddingItem(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddItem} disabled={!newItem.title || !newItem.description}>
                Add Portfolio Item
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProviderPortfolio 