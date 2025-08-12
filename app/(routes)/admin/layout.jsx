"use client"
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session?.user) {
      toast.error('Please sign in to access admin panel')
      redirect('/auth/signin')
      return
    }
    
    if (session.user.role !== 'ADMIN') {
      toast.error('Access denied. Admin privileges required.')
      redirect('/')
      return
    }
  }, [session, status])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking admin access...</p>
        </div>
      </div>
    )
  }

  if (!session?.user || session.user.role !== 'ADMIN') {
    return null // Will redirect
  }

  return <>{children}</>
}
