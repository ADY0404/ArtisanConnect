"use client"
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

export default function ProviderDashboardLayout({ children }) {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      toast.error('Please sign in to access provider dashboard')
      redirect('/auth/signin')
      return
    }

    if (session.user.role !== 'PROVIDER') {
      toast.error('Access denied. Provider account required.')
      redirect('/')
      return
    }
  }, [session, status])

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading provider dashboard...</p>
        </div>
      </div>
    )
  }

  // Don't render children until access is verified
  if (!session?.user || session.user.role !== 'PROVIDER') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Provider Dashboard Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Provider Dashboard</h1>
              <p className="mt-1 text-gray-600">
                Welcome back, {session.user.name}. Manage your business and bookings.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  )
} 