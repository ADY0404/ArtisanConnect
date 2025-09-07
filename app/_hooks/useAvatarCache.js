import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

/**
 * Custom hook to handle avatar cache busting
 * Forces re-render when avatar changes and adds cache-busting parameters
 */
export function useAvatarCache() {
  const { data: session } = useSession()
  const [avatarKey, setAvatarKey] = useState(Date.now())

  // Force re-render when session changes
  useEffect(() => {
    setAvatarKey(Date.now())
  }, [session?.user?.image])

  // Listen for custom avatar update events
  useEffect(() => {
    const handleAvatarUpdate = () => {
      setAvatarKey(Date.now())
    }

    window.addEventListener('avatarUpdated', handleAvatarUpdate)
    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate)
    }
  }, [])

  const getAvatarUrl = (imageUrl) => {
    if (!imageUrl) return null
    // Add multiple cache-busting parameters
    const separator = imageUrl.includes('?') ? '&' : '?'
    return `${imageUrl}${separator}t=${avatarKey}&cb=${Math.random()}`
  }

  const forceRefresh = () => {
    setAvatarKey(Date.now())
  }

  return {
    avatarKey,
    getAvatarUrl,
    forceRefresh
  }
} 