"use client"
import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import SearchFilters from '@/app/_components/SearchFilters'
import BusinessList from '@/app/_components/BusinessList'
import CategorySideBar from '../_components/CategorySideBar'
import ApiService from '@/app/_services/ApiService'
import { Loader2, Grid3X3, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

function CategoryPageContent({ params }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const category = params?.category || ''
  
  // State management
  const [businesses, setBusinesses] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // grid or list
  const [sortBy, setSortBy] = useState('rating') // rating, distance, price, reviews
  const [filters, setFilters] = useState({
    searchQuery: searchParams.get('q') || '',
    location: searchParams.get('location') || '',
    category: decodeURIComponent(category || ''),
    minRating: parseInt(searchParams.get('rating')) || 0,
    priceRange: { 
      min: parseInt(searchParams.get('minPrice')) || 0, 
      max: parseInt(searchParams.get('maxPrice')) || 1000 
    },
    radius: parseInt(searchParams.get('radius')) || 10,
    coordinates: null
  })

  // Load data when category changes
  useEffect(() => {
    if (category) {
      setFilters(prev => ({
        ...prev,
        category: decodeURIComponent(category)
      }))
    }
  }, [category])

  // Load businesses when category or filters change
  useEffect(() => {
    if (filters.category) {
      loadBusinessesByCategory()
    }
  }, [filters.category, filters.location, filters.searchQuery, filters.minRating, filters.coordinates, sortBy])

  const loadBusinessesByCategory = async () => {
    if (!filters.category) return

    setIsLoading(true)
    try {
      console.log('Loading businesses with filters:', filters)

      // Check if we have location or other filters that require advanced search
      const hasLocationFilter = filters.location && filters.location.trim() !== ''
      const hasSearchQuery = filters.searchQuery && filters.searchQuery.trim() !== ''
      const hasRatingFilter = filters.minRating > 0
      const hasCoordinates = filters.coordinates && filters.coordinates.latitude

      let result

      if (hasLocationFilter || hasSearchQuery || hasRatingFilter || hasCoordinates) {
        // Use advanced search API for filtered results
        console.log('🔍 Using advanced search with location/filters:', {
          location: filters.location,
          searchQuery: filters.searchQuery,
          coordinates: filters.coordinates
        })

        result = await ApiService.searchBusinessesWithFilters({
          ...filters,
          sortBy: sortBy,
          limit: 50 // Get more results for better filtering
        })

        setBusinesses(result.businesses || [])

        if ((result.businesses || []).length === 0) {
          if (hasLocationFilter) {
            toast.info(`No ${filters.category} services found in "${filters.location}"`)
          } else {
            toast.info(`No businesses found matching your criteria`)
          }
        } else {
          console.log(`✅ Found ${result.businesses.length} businesses with location filter`)
        }

      } else {
        // Use simple category search for no filters
        console.log('📋 Using simple category search (no location filter)')
        result = await ApiService.getBusinessByCategory(filters.category)

        let sortedBusinesses = result.businessLists || []

        // Apply sorting
        switch (sortBy) {
          case 'rating':
            sortedBusinesses = sortedBusinesses.sort((a, b) => (b.rating || 0) - (a.rating || 0))
            break
          case 'reviews':
            sortedBusinesses = sortedBusinesses.sort((a, b) => (b.totalReviews || 0) - (a.totalReviews || 0))
            break
          case 'name':
            sortedBusinesses = sortedBusinesses.sort((a, b) => a.name.localeCompare(b.name))
            break
          default:
            break
        }

        setBusinesses(sortedBusinesses)

        if (sortedBusinesses.length === 0) {
          toast.info(`No businesses found in ${filters.category} category`)
        }
      }

    } catch (error) {
      console.error('Error loading businesses:', error)
      toast.error('Failed to load businesses')
      setBusinesses([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }))
  }, [])

  const handleSortChange = useCallback((newSortBy) => {
    setSortBy(newSortBy)
  }, [])

  const ResultsHeader = () => (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
      <div className="flex-grow">
        <h1 className="text-2xl font-bold">
          {filters.category} Services
          {filters.location && filters.location.trim() !== '' && (
            <span className="text-lg font-normal text-gray-600"> in {filters.location}</span>
          )}
        </h1>
        {businesses.length > 0 && (
          <Badge variant="secondary" className="text-sm mt-1">
            {businesses.length} results
            {filters.location && filters.location.trim() !== '' && (
              <span className="ml-1">• {filters.location}</span>
            )}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2 sm:gap-4 w-full md:w-auto">
        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm flex-grow"
        >
          <option value="rating">Best Rated</option>
          <option value="reviews">Most Reviewed</option>
          <option value="name">Name (A-Z)</option>
        </select>
        <div className="flex border rounded-md overflow-hidden flex-shrink-0">
          <Button
            size="sm"
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            onClick={() => setViewMode('grid')}
            className="rounded-none px-3"
          >
            <Grid3X3 size={16} />
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            onClick={() => setViewMode('list')}
            className="rounded-none px-3"
          >
            <List size={16} />
          </Button>
        </div>
      </div>
    </div>
  )

  const NoResults = () => (
    <div className="text-center py-12">
      <div className="mb-4">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">🔍</span>
        </div>
        <h3 className="text-lg font-semibold mb-2">No businesses found</h3>
        <p className="text-gray-600 mb-4">
          We couldn't find any businesses in the "{filters.category}" category.
        </p>
        <div className="space-y-2 text-sm text-gray-500">
          <p>• Try selecting a different category</p>
          <p>• Check if there are businesses registered in this category</p>
          <p>• Contact support if you're a provider wanting to register</p>
        </div>
      </div>
      <Button onClick={() => router.push('/search')} variant="outline">
        View All Services
      </Button>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="hidden md:block md:col-span-1">
          <div className="sticky top-24 space-y-4">
            <CategorySideBar />
          </div>
        </aside>

        <div className="md:col-span-3">
          <header className="sticky top-[70px] z-10 bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border mb-6">
            <SearchFilters 
              initialFilters={filters} 
              onFiltersChange={handleFiltersChange}
            />
          </header>
          
          <main>
            <ResultsHeader />
            
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin h-12 w-12 text-primary" />
              </div>
            ) : businesses.length > 0 ? (
              <BusinessList 
                businessList={businesses}
                viewMode={viewMode}
              />
            ) : (
              <NoResults />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default function CategoryPage({ params }) {
  return (
    <Suspense fallback={
      <div className="text-center p-20">
        <Loader2 className="animate-spin mx-auto" />
      </div>
    }>
      <CategoryPageContent params={params} />
    </Suspense>
  )
} 