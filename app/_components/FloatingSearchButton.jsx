"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

function FloatingSearchButton() {
  const pathname = usePathname()
  const [isHidden, setIsHidden] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    // Hide button when sheets or dialogs are open
    const handleBodyClassChange = () => {
      const hasOverlay = document.querySelector('[data-state="open"]') || 
                        document.body.classList.contains('overflow-hidden')
      setIsHidden(hasOverlay)
    }

    // Check initially
    handleBodyClassChange()

    // Watch for changes in DOM that indicate modals/sheets are open
    const observer = new MutationObserver(handleBodyClassChange)
    observer.observe(document.body, { 
      attributes: true, 
      attributeFilter: ['class'],
      childList: true,
      subtree: true 
    })

    return () => observer.disconnect()
  }, [])
  
  // Don't show on search page itself (moved after all hooks)
  if (pathname === '/search' || pathname.startsWith('/search/')) {
    return null
  }

  // Don't show for admin or provider users
  if (session?.user?.role === 'ADMIN' || session?.user?.role === 'PROVIDER') {
    return null
  }

  if (isHidden) {
    return null
  }

  return (
    <Link 
      href="/search"
      className="hidden md:flex" // Hide on mobile, show on desktop
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 50, // Reduced from 9999 to avoid interference
        width: '56px', // Slightly smaller
        height: '56px',
        backgroundColor: '#2563eb',
        borderRadius: '50%',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        border: '2px solid white',
        alignItems: 'center',
        justifyContent: 'center',
        textDecoration: 'none',
        transition: 'all 0.3s ease',
        opacity: 0.9
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'scale(1.1)'
        e.target.style.opacity = '1'
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'scale(1)'
        e.target.style.opacity = '0.9'
      }}
    >
      {/* Search Icon using Unicode */}
      <span 
        style={{
          color: 'white',
          fontSize: '20px', // Slightly smaller
          fontWeight: 'bold'
        }}
      >
        🔍
      </span>
    </Link>
  )
}

export default FloatingSearchButton 