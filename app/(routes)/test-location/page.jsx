"use client"
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, MapPin, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

function TestLocationPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [locationStats, setLocationStats] = useState(null)
  const [testResults, setTestResults] = useState(null)

  // Load initial stats
  useEffect(() => {
    loadLocationStats()
  }, [])

  const loadLocationStats = async () => {
    try {
      const response = await fetch('/api/admin/migrate-location-data')
      const data = await response.json()
      setLocationStats(data.stats)
    } catch (error) {
      console.error('Failed to load location stats:', error)
    }
  }

  const runLocationMigration = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/migrate-location-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'migrate' })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success(result.message)
        setTestResults(result)
        loadLocationStats() // Refresh stats
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Migration failed: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const checkLocationData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/migrate-location-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check' })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setTestResults(result)
        toast.success('Location data check completed')
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Check failed: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const testLocationFilter = async (location) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search',
          filters: {
            location,
            limit: 10
          }
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success(`Found ${result.businesses.length} businesses in ${location}`)
        setTestResults({
          ...testResults,
          filterTest: {
            location,
            found: result.businesses.length,
            businesses: result.businesses.slice(0, 3) // Show first 3
          }
        })
      } else {
        toast.error('Filter test failed')
      }
    } catch (error) {
      toast.error('Filter test error: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🧪 Location Filter Test</h1>
        <p className="text-gray-600">
          Test and debug the location filtering functionality
        </p>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Total Businesses</h3>
          <div className="text-2xl font-bold text-blue-600">
            {locationStats?.totalBusinesses || '...'}
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">With Coordinates</h3>
          <div className="text-2xl font-bold text-green-600">
            {locationStats?.withCoordinates || '...'}
          </div>
          <div className="text-sm text-gray-500">
            {locationStats?.percentageComplete || 0}% complete
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Need Migration</h3>
          <div className="text-2xl font-bold text-orange-600">
            {locationStats?.needsMigration || '...'}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">🛠️ Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={runLocationMigration}
            disabled={isLoading}
            className="h-20 text-left flex-col items-start"
          >
            {isLoading ? <Loader2 className="animate-spin mb-2" size={20} /> : <MapPin className="mb-2" size={20} />}
            <span className="font-semibold">Migrate Location Data</span>
            <span className="text-xs opacity-80">Add coordinates to businesses</span>
          </Button>
          
          <Button 
            onClick={checkLocationData}
            disabled={isLoading}
            variant="outline"
            className="h-20 text-left flex-col items-start"
          >
            {isLoading ? <Loader2 className="animate-spin mb-2" size={20} /> : <CheckCircle2 className="mb-2" size={20} />}
            <span className="font-semibold">Check Data Status</span>
            <span className="text-xs opacity-80">Verify location data quality</span>
          </Button>
        </div>
      </div>

      {/* Test Location Filters */}
      <div className="bg-white border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">🎯 Test Location Filters</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {['Accra', 'Kumasi', 'Tamale', 'Cape Coast', 'Takoradi', 'Ho'].map(city => (
            <Button
              key={city}
              onClick={() => testLocationFilter(city)}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              Test {city}
            </Button>
          ))}
        </div>
        <p className="text-sm text-gray-600">
          Click a city to test how many businesses are found in that location
        </p>
      </div>

      {/* Results Display */}
      {testResults && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">📊 Results</h2>
          
          {testResults.success !== undefined && (
            <div className="mb-4">
              <Badge variant={testResults.success ? "default" : "destructive"} className="mb-2">
                {testResults.success ? "Success" : "Error"}
              </Badge>
              <p className="text-sm">{testResults.message}</p>
            </div>
          )}

          {testResults.stats && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">📈 Statistics</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Total Businesses: {testResults.stats.totalBusinesses}</div>
                <div>With Coordinates: {testResults.stats.withCoordinates}</div>
                <div>With City: {testResults.stats.withCity}</div>
                <div>Completion: {testResults.stats.percentageWithCoordinates}%</div>
              </div>
            </div>
          )}

          {testResults.sampleData && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">📋 Sample Data</h3>
              <div className="space-y-2 text-sm">
                {testResults.sampleData.map((business, index) => (
                  <div key={index} className="bg-gray-50 p-2 rounded">
                    <div className="font-medium">{business.name}</div>
                    <div className="text-gray-600">
                      {business.city}, {business.state} 
                      {business.latitude && ` (${business.latitude.toFixed(4)}, ${business.longitude.toFixed(4)})`}
                    </div>
                    <div className="text-xs text-gray-500">{business.address}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {testResults.filterTest && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">🔍 Filter Test Results</h3>
              <div className="bg-blue-50 p-3 rounded">
                <div>Location: <strong>{testResults.filterTest.location}</strong></div>
                <div>Found: <strong>{testResults.filterTest.found} businesses</strong></div>
                {testResults.filterTest.businesses.length > 0 && (
                  <div className="mt-2">
                    <div className="text-sm font-medium">Sample Results:</div>
                    {testResults.filterTest.businesses.map((business, index) => (
                      <div key={index} className="text-xs text-gray-600 ml-2">
                        • {business.name} - {business.address}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {testResults.details && (
            <div>
              <h3 className="font-medium mb-2">🔧 Details</h3>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                {JSON.stringify(testResults.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
        <h3 className="font-semibold text-yellow-900 mb-2">📝 Instructions</h3>
        <ol className="text-sm text-yellow-800 space-y-1">
          <li>1. First, run "Migrate Location Data" to add coordinates to existing businesses</li>
          <li>2. Use "Check Data Status" to verify the migration worked</li>
          <li>3. Test location filters with different cities</li>
          <li>4. Go to the main search page and try searching by location</li>
          <li>5. The location filter should now show businesses only in that area</li>
        </ol>
      </div>
    </div>
  )
}

export default TestLocationPage 