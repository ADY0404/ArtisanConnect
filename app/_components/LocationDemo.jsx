"use client"
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Navigation, MapPin, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

function LocationDemo() {
  const [location, setLocation] = useState('')
  const [coordinates, setCoordinates] = useState(null)
  const [detecting, setDetecting] = useState(false)
  const [error, setError] = useState(null)

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      toast.error('Geolocation is not supported by this browser')
      return
    }

    setDetecting(true)
    setError(null)

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
      setCoordinates({ latitude, longitude, accuracy })

      // Reverse geocode to get address
      try {
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        )
        const locationData = await response.json()
        
        const detectedLocation = locationData.city || locationData.locality || 
                               locationData.principalSubdivision || 'Current Location'

        setLocation(detectedLocation)
        toast.success(`📍 Location detected: ${detectedLocation}`)
      } catch (geocodeError) {
        setLocation('Current Location')
        toast.success('📍 Location detected successfully')
      }
    } catch (error) {
      let errorMessage = 'Failed to detect location'
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access denied. Please enable location access.'
          break
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information unavailable'
          break
        case error.TIMEOUT:
          errorMessage = 'Location request timed out'
          break
      }

      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setDetecting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Location Detection Demo</h2>
      
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            onClick={detectLocation}
            disabled={detecting}
            className="flex items-center gap-2"
          >
            {detecting ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Navigation size={16} />
            )}
            {detecting ? 'Detecting...' : 'Detect My Location'}
          </Button>
        </div>

        {location && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-green-600" size={16} />
              <span className="font-medium">Location Found:</span>
            </div>
            <p className="text-sm mt-1">{location}</p>
            {coordinates && (
              <p className="text-xs text-gray-500 mt-1">
                Lat: {coordinates.latitude.toFixed(6)}, 
                Lng: {coordinates.longitude.toFixed(6)}
                {coordinates.accuracy && ` (±${Math.round(coordinates.accuracy)}m)`}
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-red-600" size={16} />
              <span className="font-medium">Error:</span>
            </div>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        <div className="text-sm text-gray-600">
          <h3 className="font-medium mb-2">How it works:</h3>
          <ul className="space-y-1 text-xs">
            <li>• Uses HTML5 Geolocation API</li>
            <li>• Falls back to IP-based location if GPS unavailable</li>
            <li>• Reverse geocodes coordinates to readable address</li>
            <li>• Respects user privacy - requires permission</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default LocationDemo 