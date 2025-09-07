"use client"
import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import SearchFilters from '@/app/_components/SearchFilters'
import BusinessList from '@/app/_components/BusinessList'
import CategorySideBar from './_components/CategorySideBar'
import ApiService from '@/app/_services/ApiService'
import { Loader2, MapPin, SlidersHorizontal, Grid3X3, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

function SearchPageContent({ params }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // State management
  const [businesses, setBusinesses] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [viewMode, setViewMode] = useState('grid') // grid or list
  const [sortBy, setSortBy] = useState('rating') // rating, distance, price, reviews
  const [filters, setFilters] = useState({
    searchQuery: searchParams.get('q') || '',
    location: searchParams.get('location') || '',
    category: params?.category || searchParams.get('category') || '',
    minRating: parseInt(searchParams.get('rating')) || 0,
    priceRange: { 
      min: parseInt(searchParams.get('minPrice')) || 0, 
      max: parseInt(searchParams.get('maxPrice')) || 1000 
    },
    radius: parseInt(searchParams.get('radius')) || 10,
    coordinates: null
  })

  // Memoize search filters to prevent recreation on every render
  const searchFilters = useMemo(() => ({
    ...filters,
    sortBy,
    page: pagination.page,
    limit: pagination.limit
  }), [
    filters.searchQuery,
    filters.location, 
    filters.category,
    filters.minRating,
    filters.priceRange.min,
    filters.priceRange.max,
    filters.radius,
    filters.coordinates,
    sortBy,
    pagination.page,
    pagination.limit
  ])

  // Load businesses when search parameters change
  useEffect(() => {
    searchBusinesses()
  }, [searchFilters])

  // Update URL when core filters change
  useEffect(() => {
    updateURL()
  }, [
    filters.searchQuery,
    filters.location,
    filters.category,
    filters.minRating,
    filters.priceRange.min,
    filters.priceRange.max,
    filters.radius
  ])

  const searchBusinesses = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await ApiService.searchBusinessesWithFilters(searchFilters)
      
      setBusinesses(result.businesses || [])
      setPagination(prev => ({
        ...prev,
        total: result.total || 0,
        totalPages: result.totalPages || 0
      }))

      if (filters.coordinates && result.businesses.length > 0) {
        const nearbyCount = result.businesses.filter(b => b.distance && b.distance <= filters.radius).length
        if (nearbyCount > 0) {
          toast.success(`Found ${nearbyCount} services within ${filters.radius}km of your location`)
        }
      }

    } catch (error) {
      console.error('Error searching businesses:', error)
      toast.error('Failed to search businesses')
      setBusinesses([])
    } finally {
      setIsLoading(false)
    }
  }, [searchFilters, filters.coordinates, filters.radius])

  const updateURL = useCallback(() => {
    const params = new URLSearchParams()
    
    if (filters.searchQuery) params.set('q', filters.searchQuery)
    if (filters.location) params.set('location', filters.location)
    if (filters.category && filters.category !== 'All') params.set('category', filters.category)
    if (filters.minRating > 0) params.set('rating', filters.minRating.toString())
    if (filters.priceRange.min > 0) params.set('minPrice', filters.priceRange.min.toString())
    if (filters.priceRange.max < 1000) params.set('maxPrice', filters.priceRange.max.toString())
    if (filters.radius !== 10) params.set('radius', filters.radius.toString())

    const newURL = `/search${params.toString() ? `?${params.toString()}` : ''}`
    window.history.replaceState({}, '', newURL)
  }, [filters])

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters)
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  const handleSortChange = useCallback((newSortBy) => {
    setSortBy(newSortBy)
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  const handlePageChange = useCallback((newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const ResultsHeader = () => (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
      <div className="flex-grow">
        <h1 className="text-2xl font-bold">
          {filters.category && filters.category !== 'All' 
            ? filters.category 
            : filters.searchQuery 
              ? `Results for "${filters.searchQuery}"` 
              : 'All Services'}
        </h1>
        {pagination.total > 0 && (
          <Badge variant="secondary" className="text-sm mt-1">
            {pagination.total} results
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
          {filters.coordinates && <option value="distance">Nearest</option>}
          <option value="reviews">Most Reviewed</option>
          <option value="price">Price</option>
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
      <div className="text-gray-400 mb-4">
        <SlidersHorizontal size={48} className="mx-auto" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
      <p className="text-gray-600 mb-4">Try adjusting your filters or search terms.</p>
    </div>
  )

  const PaginationComponent = () => {
    if (pagination.totalPages <= 1) return null
    return (
      <div className="flex justify-center mt-8">
        <Button
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
          variant="outline"
        >
          Previous
        </Button>
        <span className="px-4 py-2">
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <Button
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages}
          variant="outline"
        >
          Next
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      <aside className="hidden md:block md:col-span-1">
        <div className="sticky top-24 space-y-4">
            <CategorySideBar />
        </div>
      </aside>

             <div className="md:col-span-3">
         <header className="bg-white dark:bg-slate-900 p-2 md:p-4 rounded-lg shadow-sm border mb-4 md:mb-6">
           <SearchFilters 
             initialFilters={filters} 
             onFiltersChange={handleFiltersChange}
           />
         </header>
        
        <main>
            <ResultsHeader />
            
            {isLoading
              ? <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>
              : businesses.length > 0 
                ? (
                  <div className="space-y-6">
                    <BusinessList 
                      businessList={businesses}
                      viewMode={viewMode}
                    />
                    <PaginationComponent />
                  </div>
                ) 
                : <NoResults />
            }
        </main>
      </div>
    </div>
  )
}

export default function SearchPage({ params }) {
  return (
    <Suspense fallback={<div className="text-center p-20"><Loader2 className="animate-spin mx-auto" /></div>}>
      <SearchPageContent params={params} />
    </Suspense>
  )
} 