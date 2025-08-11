"use client"
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import StarRating from './StarRating'
import { 
  MapPin, 
  Search, 
  SlidersHorizontal, 
  X, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Navigation
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { toast } from 'sonner'

function SearchFilters({ onFiltersChange, categories = [], className = "" }) {
  // Filter state
  const [filters, setFilters] = useState({
    searchQuery: '',
    location: '',
    category: '',
    minRating: 0,
    priceRange: { min: 0, max: 1000 },
    radius: 10, // km
    coordinates: null
  })

  // Location detection state
  const [locationState, setLocationState] = useState({
    detecting: false,
    detected: false,
    error: null,
    accuracy: null
  })

  // Active filters for display
  const [activeFilters, setActiveFilters] = useState([])
  
  // Ref to track if initial load
  const isInitialLoad = useRef(true)

  // Update active filters for badge display
  useEffect(() => {
    const active = []
    
    if (filters.searchQuery) {
      active.push({ key: 'search', label: `"${filters.searchQuery}"`, value: filters.searchQuery })
    }
    if (filters.location) {
      active.push({ key: 'location', label: `📍 ${filters.location}`, value: filters.location })
    }
    if (filters.category) {
      active.push({ key: 'category', label: filters.category, value: filters.category })
    }
    if (filters.minRating > 0) {
      active.push({ key: 'rating', label: `${filters.minRating}+ stars`, value: filters.minRating })
    }
    if (filters.priceRange.min > 0 || filters.priceRange.max < 1000) {
      active.push({ 
        key: 'price', 
        label: `$${filters.priceRange.min}-${filters.priceRange.max}`, 
        value: filters.priceRange 
      })
    }
    
    setActiveFilters(active)
  }, [filters])

  // Notify parent of filter changes (skip initial empty call)
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false
      return
    }
    
    if (onFiltersChange) {
      onFiltersChange(filters)
    }
  }, [filters, onFiltersChange])

  // Handle filter updates
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }, [])

  // Remove specific filter
  const removeFilter = (filterKey) => {
    const resetValues = {
      search: '',
      location: '',
      category: '',
      rating: 0,
      price: { min: 0, max: 1000 }
    }
    
    if (resetValues[filterKey] !== undefined) {
      if (filterKey === 'search') updateFilter('searchQuery', '')
      else if (filterKey === 'location') updateFilter('location', '')
      else if (filterKey === 'category') updateFilter('category', '')
      else if (filterKey === 'rating') updateFilter('minRating', 0)
      else if (filterKey === 'price') updateFilter('priceRange', { min: 0, max: 1000 })
    }
  }

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      searchQuery: '',
      location: '',
      category: '',
      minRating: 0,
      priceRange: { min: 0, max: 1000 },
      radius: 10,
      coordinates: null
    })
  }

  // Get user's current location
  const detectLocation = async () => {
    if (!navigator.geolocation) {
      setLocationState(prev => ({ 
        ...prev, 
        error: 'Geolocation is not supported by this browser' 
      }))
      toast.error('Geolocation is not supported by this browser')
      return
    }

    setLocationState(prev => ({ ...prev, detecting: true, error: null }))

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes cache
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options)
      })

      const { latitude, longitude, accuracy } = position.coords

      // Reverse geocode to get address
      try {
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        )
        const locationData = await response.json()
        
        const detectedLocation = locationData.city || locationData.locality || 
                               locationData.principalSubdivision || 'Current Location'

        updateFilter('location', detectedLocation)
        updateFilter('coordinates', { latitude, longitude })
        
        setLocationState({
          detecting: false,
          detected: true,
          error: null,
          accuracy: Math.round(accuracy)
        })

        toast.success(`📍 Location detected: ${detectedLocation}`)
      } catch (geocodeError) {
        // Fallback to coordinates if reverse geocoding fails
        updateFilter('location', 'Current Location')
        updateFilter('coordinates', { latitude, longitude })
        
        setLocationState({
          detecting: false,
          detected: true,
          error: null,
          accuracy: Math.round(accuracy)
        })

        toast.success('📍 Location detected successfully')
      }
    } catch (error) {
      let errorMessage = 'Failed to detect location'
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access denied. Please enter your location manually.'
          break
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information unavailable'
          break
        case error.TIMEOUT:
          errorMessage = 'Location request timed out'
          break
      }

      setLocationState({
        detecting: false,
        detected: false,
        error: errorMessage,
        accuracy: null
      })

      toast.error(errorMessage)
    }
  }

  return (
    <div className={`space-y-2 md:space-y-4 mb-2 md:mb-6 ${className}`}>
      {/* Compact Mobile Search Bar */}
      <div className="flex flex-col gap-2 md:gap-2">
        {/* Search Input - More compact on mobile */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Search services..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter('searchQuery', e.target.value)}
            className="pl-9 h-10 md:h-10 text-sm md:text-sm"
          />
        </div>
        
        {/* Location Input - More compact on mobile */}
        <div className="relative w-full">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Location..."
            value={filters.location}
            onChange={(e) => updateFilter('location', e.target.value)}
            className="pl-9 pr-10 h-10 md:h-10 text-sm md:text-sm"
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={detectLocation}
            disabled={locationState.detecting}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 md:h-8 md:w-8 p-0 touch-manipulation"
            title="Detect my location"
          >
            {locationState.detecting ? (
              <Loader2 className="animate-spin" size={14} />
            ) : locationState.detected ? (
              <CheckCircle2 className="text-green-600" size={14} />
            ) : locationState.error ? (
              <AlertCircle className="text-red-500" size={14} />
            ) : (
              <Navigation size={14} />
            )}
          </Button>
        </div>

        {/* Compact Filters Button */}
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex-1 h-10 md:h-10 touch-manipulation">
                <SlidersHorizontal className="mr-2" size={16} />
                <span className="text-sm">Filters</span>
                {activeFilters.length > 0 && (
                  <Badge className="ml-2 text-xs">{activeFilters.length}</Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle className="text-lg">Search Filters</SheetTitle>
                <SheetDescription className="text-sm">
                  Find exactly what you're looking for
                </SheetDescription>
              </SheetHeader>
              <div className="py-4 space-y-6 pb-20">
                {/* Rating Filter */}
                <div>
                  <label className="block text-base font-medium mb-3">Minimum Rating</label>
                  <StarRating
                    rating={filters.minRating}
                    onRatingChange={(r) => updateFilter('minRating', r)}
                    size="large"
                  />
                </div>

                {/* Price Range Filter */}
                <div>
                  <label className="block text-base font-medium mb-3">
                    Price Range ($)
                  </label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.priceRange.min}
                      onChange={(e) =>
                        updateFilter('priceRange', { ...filters.priceRange, min: parseInt(e.target.value) || 0 })
                      }
                      className="h-12 text-base"
                    />
                    <span className="text-gray-500">to</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.priceRange.max}
                      onChange={(e) =>
                        updateFilter('priceRange', { ...filters.priceRange, max: parseInt(e.target.value) || 1000 })
                      }
                      className="h-12 text-base"
                    />
                  </div>
                </div>

                {/* Search Radius */}
                <div>
                  <label className="block text-base font-medium mb-3">
                    Search Radius: {filters.radius} km
                  </label>
                  <div className="px-2">
                    <Input
                      type="range"
                      min="1"
                      max="50"
                      value={filters.radius}
                      onChange={(e) => updateFilter('radius', parseInt(e.target.value))}
                      className="w-full h-8 accent-primary"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1km</span>
                      <span>25km</span>
                      <span>50km</span>
                    </div>
                  </div>
                </div>

                {/* Category Filter */}
                {categories.length > 0 && (
                  <div>
                    <label className="block text-base font-medium mb-3">Category</label>
                    <select
                      value={filters.category}
                      onChange={(e) => updateFilter('category', e.target.value)}
                      className="w-full p-3 border rounded-md h-12 text-base bg-white"
                    >
                      <option value="">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="absolute bottom-4 right-4 left-4 flex gap-3 bg-white pt-4 border-t">
                <Button variant="outline" onClick={clearAllFilters} className="flex-1 h-12 text-base touch-manipulation">
                  Clear All
                </Button>
                <Button onClick={() => {}} className="flex-1 h-12 text-base touch-manipulation">
                  Apply Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          
          {/* Active Filters - Compact on Mobile */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 md:gap-2">
              {activeFilters.map(filter => (
                <Badge 
                  key={filter.key} 
                  variant="secondary"
                  className="flex items-center gap-1 text-xs py-1 px-2 touch-manipulation"
                >
                  <span className="truncate max-w-[80px] md:max-w-none">{filter.label}</span>
                  <button 
                    onClick={() => removeFilter(filter.key)} 
                    className="ml-1 rounded-full hover:bg-gray-300 p-0.5 touch-manipulation"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              ))}
              {activeFilters.length > 1 && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-primary hover:text-primary/80 h-auto p-0 text-xs touch-manipulation"
                >
                  Clear All
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Location Status */}
      {locationState.error && (
        <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded-md">
          ⚠️ {locationState.error}
        </div>
      )}

      {/* Smart Location Prompt - Compact on Mobile */}
      {!filters.location && !locationState.detected && !locationState.error && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 md:p-4">
          <div className="flex items-start gap-2 md:gap-3">
            <Navigation className="text-blue-600 mt-0.5" size={16} />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-1 text-sm md:text-base">
                Find services near you
              </h4>
              <p className="text-xs md:text-sm text-blue-700 mb-2 md:mb-3">
                Enable location to see nearby service providers
              </p>
              <div className="flex gap-1 md:gap-2 flex-wrap">
                <Button 
                  size="sm" 
                  onClick={detectLocation}
                  disabled={locationState.detecting}
                  className="text-xs h-8 md:h-9"
                >
                  {locationState.detecting ? (
                    <>
                      <Loader2 className="animate-spin mr-1" size={12} />
                      Detecting...
                    </>
                  ) : (
                    'Use My Location'
                  )}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => document.querySelector('input[placeholder*="location"]')?.focus()}
                  className="text-xs h-8 md:h-9"
                >
                  Enter Manually
                </Button>
                {/* Quick test locations */}
                <div className="text-xs text-blue-600 mt-1 w-full">
                  Quick test: 
                  <button onClick={() => updateFilter('location', 'Accra')} className="underline mx-1">Accra</button>
                  <button onClick={() => updateFilter('location', 'Kumasi')} className="underline mx-1">Kumasi</button>
                  <button onClick={() => updateFilter('location', 'Tamale')} className="underline mx-1">Tamale</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GPS Location Success Message - Compact on Mobile */}
      {filters.coordinates && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-2 md:p-3">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle2 size={14} />
            <span className="font-medium text-sm md:text-base">GPS Location Active</span>
          </div>
          <p className="text-xs md:text-sm text-green-700 mt-1">
            Searching within {filters.radius}km of your location.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-green-600 mt-1">
              Coordinates: {filters.coordinates.latitude.toFixed(4)}, {filters.coordinates.longitude.toFixed(4)}
            </p>
          )}
        </div>
      )}

      {/* Location Debug Info (development mode) */}
      {process.env.NODE_ENV === 'development' && filters.location && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">
          <strong>🔧 Debug Info:</strong>
          <div>Location: "{filters.location}"</div>
          <div>Coordinates: {filters.coordinates ? `${filters.coordinates.latitude.toFixed(4)}, ${filters.coordinates.longitude.toFixed(4)}` : 'None'}</div>
          <div>Radius: {filters.radius}km</div>
          <div>Filter Type: {filters.coordinates ? 'GPS Coordinate-based' : 'Text-based'}</div>
          {filters.coordinates && (
            <div className="mt-2 space-x-2">
              <button 
                onClick={() => window.open(`/api/debug-location?lat=${filters.coordinates.latitude}&lng=${filters.coordinates.longitude}&radius=${filters.radius}`, '_blank')}
                className="text-blue-600 underline"
              >
                Debug Distance Calculation
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchFilters 