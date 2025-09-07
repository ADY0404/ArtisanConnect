"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Check, 
  X, 
  Loader2,
  RefreshCcw,
  RotateCcw
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

export default function CategoryManagement() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [targetCategoryId, setTargetCategoryId] = useState('')
  const [reassignLoading, setReassignLoading] = useState(false)
  const [reactivateLoading, setReactivateLoading] = useState(false)
  const [showInactive, setShowInactive] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    backgroundColor: '#3B82F6',
    icon: '🔧',
    description: ''
  })

  // Fetch categories
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async (forceRefresh = false) => {
    try {
      setLoading(true)
      const url = forceRefresh 
        ? `/api/admin/categories?_t=${Date.now()}`
        : '/api/admin/categories'
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setCategories(data.categories)
      } else {
        toast.error(data.error || 'Failed to fetch categories')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('An error occurred while fetching categories')
    } finally {
      setLoading(false)
    }
  }

  // Add new category
  const handleAddCategory = async () => {
    try {
      if (!formData.name) {
        toast.error('Category name is required')
        return
      }

      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Category added successfully')
        fetchCategories(true) // Force refresh
        setIsAddDialogOpen(false)
        resetForm()
      } else {
        toast.error(data.error || 'Failed to add category')
      }
    } catch (error) {
      console.error('Error adding category:', error)
      toast.error('An error occurred while adding category')
    }
  }

  // Update category
  const handleUpdateCategory = async () => {
    try {
      if (!formData.name) {
        toast.error('Category name is required')
        return
      }

      const response = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCategory.id,
          ...formData
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Category updated successfully')
        fetchCategories(true) // Force refresh
        setIsEditDialogOpen(false)
      } else {
        toast.error(data.error || 'Failed to update category')
      }
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error('An error occurred while updating category')
    }
  }

  // Delete category
  const handleDeleteCategory = async () => {
    try {
      const response = await fetch(`/api/admin/categories?id=${selectedCategory.id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        if (data.hasBusinesses) {
          toast.warning(
            `Category marked as inactive. ${data.businessCount} businesses associated with this category have been deleted.`,
            { duration: 6000 }
          )
        } else {
          toast.success('Category marked as inactive. It will still appear in the list but with an "Inactive" status.')
        }
        
        // Enhanced cache invalidation for production
        window.dispatchEvent(new CustomEvent('categoriesUpdated'))
        localStorage.setItem('categoriesUpdated', Date.now().toString())

        // Force refresh with cache busting
        fetchCategories(true)
        setIsDeleteDialogOpen(false)
      } else {
        toast.error(data.error || 'Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('An error occurred while deleting category')
    }
  }

  // Reactivate category
  const handleReactivateCategory = async (categoryId) => {
    try {
      setReactivateLoading(true)
      
      // Ensure we're using the correct ID format
      const response = await fetch(`/api/admin/categories?id=${categoryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Category reactivated successfully')
        
        // Enhanced cache invalidation for production
        window.dispatchEvent(new CustomEvent('categoriesUpdated'))
        localStorage.setItem('categoriesUpdated', Date.now().toString())

        // Force refresh with cache busting
        fetchCategories(true)
      } else {
        toast.error(data.error || 'Failed to reactivate category')
      }
    } catch (error) {
      console.error('Error reactivating category:', error)
      toast.error('An error occurred while reactivating category')
    } finally {
      setReactivateLoading(false)
    }
  }

  // Reassign businesses from one category to another
  const handleReassignBusinesses = async () => {
    if (!selectedCategory || !targetCategoryId) {
      toast.error('Please select a target category')
      return
    }

    try {
      setReassignLoading(true)
      const response = await fetch('/api/admin/categories/reassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromCategoryId: selectedCategory.id,
          toCategoryId: targetCategoryId
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message)
        setIsReassignDialogOpen(false)
        fetchCategories(true) // Force refresh
      } else {
        toast.error(data.error || 'Failed to reassign businesses')
      }
    } catch (error) {
      console.error('Error reassigning businesses:', error)
      toast.error('An error occurred while reassigning businesses')
    } finally {
      setReassignLoading(false)
    }
  }

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({
      name: '',
      backgroundColor: '#3B82F6',
      icon: '🔧',
      description: ''
    })
  }

  const openEditDialog = (category) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      backgroundColor: category.backgroundColor,
      icon: category.icon,
      description: category.description || ''
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (category) => {
    setSelectedCategory(category)
    setIsDeleteDialogOpen(true)
  }

  // Open reassign dialog for a category
  const openReassignDialog = (category) => {
    setSelectedCategory(category)
    setTargetCategoryId('')
    setIsReassignDialogOpen(true)
  }

  // Function to render icon properly
  const renderIcon = (icon) => {
    if (!icon) return '🔧';
    
    // Check if it's an emoji
    if (icon.length < 3) return icon;
    
    // Check if it's a URL/path
    if (icon.includes('/') || icon.includes('.png') || icon.includes('.jpg') || icon.includes('.svg')) {
      return (
        <div className="relative w-8 h-8 overflow-hidden rounded-full">
          <Image 
            src={icon} 
            alt="Category icon" 
            width={32} 
            height={32} 
            className="object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/placeholder-business.jpg';
            }}
          />
        </div>
      );
    }
    
    return icon;
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CardTitle>Category Management</CardTitle>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input 
              type="checkbox" 
              id="show-inactive" 
              checked={showInactive} 
              onChange={(e) => setShowInactive(e.target.checked)} 
              className="rounded text-primary"
            />
            <label htmlFor="show-inactive" className="text-sm">
              Show inactive categories
            </label>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => fetchCategories(true)} 
              variant="outline" 
              className="w-full sm:w-auto"
              disabled={loading}
            >
              <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> 
              Refresh
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add Category
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Icon</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No categories found
                    </TableCell>
                  </TableRow>
                ) : (
                  categories
                    .filter(category => showInactive || category.isActive)
                    .map((category) => (
                      <TableRow 
                        key={category.id}
                        className={!category.isActive ? "bg-gray-50" : ""}
                      >
                        <TableCell>
                          {category.icon && category.icon.includes('/') ? (
                            <div className={`relative w-8 h-8 overflow-hidden rounded-full bg-gray-100 ${!category.isActive ? "opacity-60" : ""}`}>
                              <Image 
                                src={category.icon} 
                                alt={category.name} 
                                width={32} 
                                height={32} 
                                className="object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/placeholder-business.jpg';
                                }}
                              />
                            </div>
                          ) : (
                            <div 
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${!category.isActive ? "opacity-60" : ""}`}
                              style={{ backgroundColor: category.backgroundColor || '#3B82F6' }}
                            >
                              {category.icon || '🔧'}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className={`font-medium ${!category.isActive ? "text-gray-500" : ""}`}>
                          {category.name}
                          {!category.isActive && <span className="ml-2 text-xs text-gray-500">(inactive)</span>}
                        </TableCell>
                        <TableCell className={`max-w-xs truncate hidden sm:table-cell ${!category.isActive ? "text-gray-500" : ""}`}>
                          {category.description || '-'}
                        </TableCell>
                        <TableCell>
                          {category.isActive ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Check className="mr-1 h-3 w-3" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <X className="mr-1 h-3 w-3" /> Inactive
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => openEditDialog(category)}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openDeleteDialog(category)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                            {!category.isActive ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReactivateCategory(category.id)}
                                title="Reactivate category"
                              >
                                <RotateCcw className="h-4 w-4 text-green-500" />
                              </Button>
                            ) : null}
                            {!category.isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openReassignDialog(category)}
                                title="Reassign businesses from this category"
                              >
                                <RefreshCcw className="h-4 w-4 text-amber-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Add Category Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name">Category Name</label>
              <Input 
                id="name" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                placeholder="e.g., Cleaning, Plumbing" 
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="backgroundColor">Background Color</label>
              <div className="flex gap-2">
                <Input 
                  id="backgroundColor" 
                  name="backgroundColor" 
                  type="color"
                  value={formData.backgroundColor} 
                  onChange={handleInputChange} 
                  className="w-12 h-10 p-1"
                />
                <Input 
                  value={formData.backgroundColor} 
                  onChange={handleInputChange} 
                  name="backgroundColor"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label htmlFor="icon">Icon</label>
              <Input 
                id="icon" 
                name="icon" 
                value={formData.icon} 
                onChange={handleInputChange} 
                placeholder="Emoji (🔧) or image URL" 
              />
              <p className="text-xs text-gray-500">
                You can use an emoji (e.g., 🔧, 🧹, 🔌) or an image URL
              </p>
            </div>
            <div className="grid gap-2">
              <label htmlFor="description">Description</label>
              <Input 
                id="description" 
                name="description" 
                value={formData.description} 
                onChange={handleInputChange} 
                placeholder="Brief description of the category" 
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleAddCategory} className="w-full sm:w-auto">
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="edit-name">Category Name</label>
              <Input 
                id="edit-name" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="edit-backgroundColor">Background Color</label>
              <div className="flex gap-2">
                <Input 
                  id="edit-backgroundColor" 
                  name="backgroundColor" 
                  type="color"
                  value={formData.backgroundColor} 
                  onChange={handleInputChange} 
                  className="w-12 h-10 p-1"
                />
                <Input 
                  value={formData.backgroundColor} 
                  onChange={handleInputChange} 
                  name="backgroundColor"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label htmlFor="edit-icon">Icon</label>
              <Input 
                id="edit-icon" 
                name="icon" 
                value={formData.icon} 
                onChange={handleInputChange} 
                placeholder="Emoji (🔧) or image URL" 
              />
              <p className="text-xs text-gray-500">
                You can use an emoji (e.g., 🔧, 🧹, 🔌) or an image URL
              </p>
            </div>
            <div className="grid gap-2">
              <label htmlFor="edit-description">Description</label>
              <Input 
                id="edit-description" 
                name="description" 
                value={formData.description} 
                onChange={handleInputChange} 
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleUpdateCategory} className="w-full sm:w-auto">
              Update Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete the category "{selectedCategory?.name}"?</p>
            <p className="text-sm text-gray-500 mt-2">
              This will mark the category as inactive. The category will still appear in this admin list with an "Inactive" status, but will not be visible to users.
            </p>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-700 font-medium">Note:</p>
              <p className="text-sm text-amber-700 mt-1">
                Inactive categories can be reactivated later by clicking the <RotateCcw className="inline h-3 w-3 text-green-500" /> icon.
              </p>
            </div>
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700 font-medium">Warning:</p>
              <p className="text-sm text-red-700 mt-1">
                All businesses associated with this category will be permanently deleted from the system.
                This action cannot be undone.
              </p>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory} className="w-full sm:w-auto">
              Delete Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Businesses Dialog */}
      <Dialog open={isReassignDialogOpen} onOpenChange={setIsReassignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reassign Businesses</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Reassign businesses from <span className="font-medium">{selectedCategory?.name}</span> to another active category:
            </p>
            
            <div className="mt-4">
              <label htmlFor="target-category" className="block text-sm font-medium mb-2">
                Target Category
              </label>
              <Select value={targetCategoryId} onValueChange={setTargetCategoryId}>
                <SelectTrigger id="target-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter(cat => cat.isActive && cat.id !== selectedCategory?.id)
                    .map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-700">
                This will move all businesses from <span className="font-medium">{selectedCategory?.name}</span> to the selected category.
                The businesses will then appear on the home page and in search results.
              </p>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsReassignDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              onClick={handleReassignBusinesses} 
              disabled={!targetCategoryId || reassignLoading}
              className="w-full sm:w-auto"
            >
              {reassignLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reassigning...
                </>
              ) : (
                'Reassign Businesses'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
} 