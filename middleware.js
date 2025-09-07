import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth
    const { pathname } = req.nextUrl

    // Log access attempts for debugging
    if (token) {
      console.log(`🔐 Protected route access: ${pathname} by ${token.email} (${token.role})`)
    }

    // Admin routes - only ADMIN role
    if (pathname.startsWith('/admin')) {
      if (token?.role !== 'ADMIN') {
        console.log(`❌ Access denied to ${pathname}: User ${token?.email} has role ${token?.role}, needs ADMIN`)
        return Response.redirect(new URL('/auth/error?error=AccessDenied', req.url))
      }
    }
    
    // Provider dashboard - PROVIDER role only (remove admin access)
    if (pathname.startsWith('/provider/dashboard')) {
      if (token?.role !== 'PROVIDER') {
        console.log(`❌ Access denied to ${pathname}: User ${token?.email} has role ${token?.role}, needs PROVIDER`)
        return Response.redirect(new URL('/auth/error?error=AccessDenied', req.url))
      }
    }

    // Booking routes - only CUSTOMER role
    if (pathname.startsWith('/mybooking')) {
      if (!token) {
        console.log(`❌ Access denied to ${pathname}: No authentication token`)
        return Response.redirect(new URL(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`, req.url))
      }
      if (token?.role !== 'CUSTOMER') {
        console.log(`❌ Access denied to ${pathname}: User ${token?.email} has role ${token?.role}, needs CUSTOMER`)
        return Response.redirect(new URL('/auth/error?error=AccessDenied', req.url))
      }
    }

    // Profile routes - any authenticated user
    if (pathname.startsWith('/profile')) {
      if (!token) {
        console.log(`❌ Access denied to ${pathname}: No authentication token`)
        return Response.redirect(new URL(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`, req.url))
      }
    }

    console.log(`✅ Access granted to ${pathname}`)
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Public routes that don't require authentication
        const publicRoutes = [
          '/',
          '/api/auth/verify-email', // API endpoint for verification
          '/auth/signin',
          '/auth/signup',
          '/auth/error',
          '/auth/verify-email', // Page for verification status
          '/auth/forgot-password',
          '/auth/reset-password',
          '/search',
          '/details',
          '/provider/register', // Allow access to registration form
          '/about', // About Us page
          '/contact', // Contact Us page
          '/terms', // Terms of Service page
          '/privacy', // Privacy Policy page
          '/cookies' // Cookie Policy page
        ]
        
        // Check if it's a public route
        const isPublicRoute = publicRoutes.some(route => 
          pathname === route || pathname.startsWith(route + '/')
        )
        
        if (isPublicRoute) {
          return true
        }
        
        // For protected routes, require authentication
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    // Protect these routes
    '/admin/:path*',
    '/provider/dashboard/:path*',
    '/mybooking/:path*',
    '/profile/:path*',
    // Also run middleware on auth routes for logging
    '/auth/:path*',
    '/api/auth/verify-email/:path*'
  ]
} 