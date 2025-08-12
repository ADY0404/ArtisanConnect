"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2, AlertTriangle, Eye, EyeOff } from 'lucide-react'

export default function DeleteAccount() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm account deletion')
      return
    }
    
    if (!password) {
      setError('Password is required to confirm account deletion')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/users/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: session.user.id,
          password: password
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account')
      }
      
      toast.success('Your account has been deleted')
      
      // Sign out the user
      await signOut({ redirect: false })
      
      // Redirect to home page
      router.push('/')
      
    } catch (error) {
      setError(error.message || 'Failed to delete account')
      toast.error(error.message || 'Failed to delete account')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <Link href="/auth/signin">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Delete Account</h1>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              This action cannot be undone
            </p>
          </div>

          {/* Form Content */}
          <div className="px-6 py-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Warning</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      Deleting your account will permanently remove all your data, including:
                    </p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>Profile information</li>
                      <li>Booking history</li>
                      <li>Reviews you've written</li>
                      {session.user.role === 'PROVIDER' && (
                        <>
                          <li>Business listings</li>
                          <li>Service history</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 rounded bg-red-100 text-red-700 border border-red-200">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Enter Your Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password to confirm"
                    className="pr-10"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmText" className="block text-sm font-medium text-gray-700 mb-1">
                  Type "DELETE" to confirm
                </label>
                <Input
                  id="confirmText"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  required
                  disabled={loading}
                />
              </div>

              <div className="flex space-x-3">
                <Button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700 focus:ring-red-500" 
                  disabled={loading || confirmText !== 'DELETE'}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : 'Delete My Account'}
                </Button>
                <Link href="/profile">
                  <Button type="button" variant="outline" className="w-full" disabled={loading}>
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 