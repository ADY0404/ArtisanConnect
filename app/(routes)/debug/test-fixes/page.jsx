"use client"
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Search, 
  MapPin, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Home,
  Settings
} from 'lucide-react'
import { toast } from 'sonner'

function TestFixesPage() {
  const [categories, setCategories] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [testLocation, setTestLocation] = useState('Accra')
  const [testCategory, setTestCategory] = useState('Cleaning')

  // Test 1: Category Cache Fix
  const testCategoryRefresh = async () => {
    try {
      setIsLoading(true)
      console.log('🧪 Testing category cache refresh...')
      
      const response = await fetch('/api/categories?_t=' + Date.now())
      const data = await response.json()
      
      if (data.success) {
        setCategories(data.categories || [])
        toast.success(`✅ Categories loaded: ${data.categories?.length || 0} found`)
        console.log('✅ Categories refreshed:', data.categories?.length)
      } else {
        toast.error('❌ Failed to load categories')
      }
    } catch (error) {
      console.error('❌ Category test error:', error)
      toast.error('❌ Category test failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Test 2: Location Search Fix
  const testLocationSearch = async () => {
    try {
      setIsLoading(true)
      console.log(`🧪 Testing location search for "${testLocation}" in "${testCategory}"...`)
      
      const searchFilters = {
        location: testLocation,
        category: testCategory,
        searchQuery: '',
        minRating: 0,
        priceRange: { min: 0, max: 1000 },
        radius: 10,
        coordinates: null,
        sortBy: 'rating',
        page: 1,
        limit: 20
      }
      
      console.log('📡 Sending search request:', searchFilters)
      
      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'search',
          filters: searchFilters
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.businesses || [])
        
        console.log('✅ Search results:', data)
        
        if (data.businesses && data.businesses.length > 0) {
          toast.success(`✅ Found ${data.businesses.length} results in ${testLocation}`)
        } else {
          toast.warning(`⚠️ No results found for ${testCategory} in ${testLocation}`)
        }
      } else {
        const errorText = await response.text()
        console.error('❌ Search failed:', response.status, errorText)
        toast.error(`❌ Search failed: ${response.status}`)
      }
    } catch (error) {
      console.error('❌ Location search test error:', error)
      toast.error('❌ Location search test failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Test category cache on load
  useEffect(() => {
    testCategoryRefresh()
  }, [])

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Critical Issues Test Page</h1>
        <p className="text-muted-foreground">
          Testing fixes for category cache and location search issues
        </p>
      </div>

      {/* Test 1: Category Management Cache */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Test 1: Category Cache Fix
            <Button 
              size="sm" 
              variant="outline" 
              onClick={testCategoryRefresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh Categories
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Current Categories ({categories.length}):</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {categories.map((category, index) => (
                  <Badge 
                    key={category.id || index} 
                    variant="outline" 
                    className="justify-center p-2"
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
              {categories.length === 0 && (
                <p className="text-muted-foreground">No categories loaded</p>
              )}
            </div>
            
            <Separator />
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Test Instructions:</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Open admin panel in another tab: <code>/admin/category-management</code></li>
                <li>2. Add, edit, or deactivate a category</li>
                <li>3. Come back to this page and click "Refresh Categories"</li>
                <li>4. Changes should appear immediately (cache invalidation working)</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test 2: Location Search Fix */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Test 2: Location Search Fix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Test Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Location:</label>
                <Input
                  value={testLocation}
                  onChange={(e) => setTestLocation(e.target.value)}
                  placeholder="Enter location..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category:</label>
                <Input
                  value={testCategory}
                  onChange={(e) => setTestCategory(e.target.value)}
                  placeholder="Enter category..."
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={testLocationSearch}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Test Search
                </Button>
              </div>
            </div>

            <Separator />

            {/* Quick Test Buttons */}
            <div className="space-y-2">
              <h4 className="font-semibold">Quick Tests:</h4>
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setTestLocation('Accra')
                    setTestCategory('Cleaning')
                  }}
                >
                  Cleaning in Accra
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setTestLocation('Kumasi')
                    setTestCategory('Plumbing')
                  }}
                >
                  Plumbing in Kumasi
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setTestLocation('Tamale')
                    setTestCategory('Electric')
                  }}
                >
                  Electric in Tamale
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setTestLocation('')
                    setTestCategory('Cleaning')
                  }}
                >
                  All Locations
                </Button>
              </div>
            </div>

            <Separator />

            {/* Search Results */}
            <div>
              <h4 className="font-semibold mb-2">
                Search Results ({searchResults.length})
                {testLocation && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {' '}for {testCategory} in {testLocation}
                  </span>
                )}
              </h4>
              
              {searchResults.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((business, index) => (
                    <div key={business.id || index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium">{business.name}</h5>
                          <p className="text-sm text-muted-foreground">
                            📍 {business.address}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Category: {business.category?.name}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          ⭐ {business.rating || 0}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No search results yet</p>
                  <p className="text-sm">Try running a test search above</p>
                </div>
              )}
            </div>

            <Separator />

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">Expected Behavior:</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>✅ Location search should filter results to only show businesses in specified location</li>
                <li>✅ "All Locations" should show all businesses in the category</li>
                <li>✅ Console should show detailed search debugging information</li>
                <li>✅ Results should be relevant to the location specified</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug Console */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Debug Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Check browser console for detailed debugging information:</strong>
            </p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Category refresh events and cache invalidation</li>
              <li>• Location search API calls and filtering logic</li>
              <li>• Match conditions and aggregation pipeline details</li>
              <li>• Search results and location matching</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TestFixesPage
