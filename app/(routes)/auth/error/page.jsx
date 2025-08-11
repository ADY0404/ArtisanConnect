"use client"
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Suspense } from 'react'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error) => {
    switch (error) {
      case 'CredentialsSignin':
        return {
          title: 'Invalid Credentials',
          message: 'The email or password you entered is incorrect. Please try again.'
        }
      case 'EmailNotVerified':
        return {
          title: 'Email Not Verified',
          message: 'Please verify your email address before signing in.'
        }
      case 'AccountNotLinked':
        return {
          title: 'Account Not Linked',
          message: 'This email is associated with a different sign-in method.'
        }
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          message: 'You do not have permission to access this resource.'
        }
      case 'Verification':
        return {
          title: 'Verification Error',
          message: 'The verification token has expired or is invalid.'
        }
      default:
        return {
          title: 'Authentication Error',
          message: 'An unexpected error occurred during authentication. Please try again.'
        }
    }
  }

  const { title, message } = getErrorMessage(error)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <Image src='/logo.svg' alt='logo' width={150} height={80} />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {title}
          </h2>
        </div>

        <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <p className="text-gray-600 mb-6">
              {message}
            </p>

            <div className="space-y-4">
              <Button asChild className="w-full">
                <Link href="/auth/signin">
                  Try Again
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link href="/auth/signup">
                  Create New Account
                </Link>
              </Button>
              
              <Button variant="ghost" asChild className="w-full">
                <Link href="/">
                  Back to Home
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 text-center">
            <details className="text-sm text-gray-500">
              <summary className="cursor-pointer">Technical Details</summary>
              <p className="mt-2 font-mono text-xs bg-gray-100 p-2 rounded">
                Error Code: {error}
              </p>
            </details>
          </div>
        )}
      </div>
    </div>
  )
} 

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
} 