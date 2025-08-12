"use client"
import { Button } from '@/components/ui/button'
import { signOut, useSession } from 'next-auth/react'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { useAvatarCache } from '@/app/_hooks/useAvatarCache'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from 'next/link'

function Header() {
  const { data: session, status } = useSession()
  const { getAvatarUrl } = useAvatarCache()
  const [avatarRemoved, setAvatarRemoved] = useState(false)

  useEffect(() => {
    if (session) {
      console.log('✅ User session:', session.user)
    }
  }, [session])

  const getUserInitials = (name, email) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email ? email[0].toUpperCase() : 'U'
  }

  const getUserDisplayName = (user) => {
    if (user.name) return user.name
    return user.email.split('@')[0]
  }

  return (
    <div className='p-5 shadow-sm flex justify-between'>
      <div className='flex items-center gap-8'>
        <Link href='/'>
          <Image src='/logo.svg' alt='logo' width={180} height={100} />
        </Link>
        <div className='md:flex items-center gap-6 hidden'>
          <Link href={'/'} className='hover:scale-105 hover:text-primary cursor-pointer'>
            Home
          </Link>
          
          {/* Search - Available to all users */}
          {(!session?.user || session.user.role !== 'ADMIN') && (
            <Link href={'/search'} className='hover:scale-105 hover:text-primary cursor-pointer flex items-center gap-1'>
              <Search className='h-4 w-4' />
              Search
            </Link>
          )}
          
          {/* Services - Available to customers and providers only */}
          {(!session?.user || (session.user.role !== 'ADMIN')) && (
            <Link href={'/search/cleaning'} className='hover:scale-105 hover:text-primary cursor-pointer'>
              Services
            </Link>
          )}
          
          {/* Become a Provider - Only for non-authenticated users and customers */}
          {((status !== 'authenticated') || (session.user.role === 'CUSTOMER')) && (
            <Link href={'/provider/register'} className='hover:scale-105 hover:text-primary cursor-pointer'>
              Become a Provider
            </Link>
          )}
          
          <Link href='/about' className='hover:scale-105 hover:text-primary cursor-pointer'>
            About Us
          </Link>
        </div>
      </div>
      
      <div className='flex items-center gap-4'>
        {/* Mobile Search Button - Hidden for admins */}
        {(!session?.user || session.user.role !== 'ADMIN') && (
          <Button 
            variant="outline" 
            size="sm"
            asChild
            className="md:hidden"
          >
            <Link href="/search">
              <Search className='h-4 w-4' />
            </Link>
          </Button>
        )}
        
        <div>
          {status === 'loading' ? (
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
          ) : session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 p-2">
                  {session.user.image && !avatarRemoved ? (
                    <Image 
                      src={getAvatarUrl(session.user.image) || `${session.user.image}?v=${Date.now()}&cb=${Math.random()}`} 
                      alt='user' 
                      width={40} 
                      height={40} 
                      className='rounded-full' 
                      unoptimized
                      onError={(e) => {
                        // If image fails to load, hide it
                        e.target.style.display = 'none'
                        setAvatarRemoved(true)
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {getUserInitials(session.user.name, session.user.email)}
                    </div>
                  )}
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium">{getUserDisplayName(session.user)}</span>
                    <span className="text-xs text-gray-500 capitalize">{session.user.role?.toLowerCase()}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{getUserDisplayName(session.user)}</p>
                    <p className="text-xs text-gray-500">{session.user.email}</p>
                    <p className="text-xs text-primary capitalize">{session.user.role?.toLowerCase()} Account</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem asChild>
                  <Link href={'/profile'} className="w-full">
                    My Profile
                  </Link>
                </DropdownMenuItem>
                
                {session.user.role === 'CUSTOMER' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href={'/mybooking'} className="w-full">
                        My Bookings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={'/customer/messages'} className="w-full">
                        My Messages
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={'/provider/register'} className="w-full">
                        Become a Provider
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                {session.user.role === 'PROVIDER' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href={'/provider/dashboard'} className="w-full">
                        Provider Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={'/provider/messages'} className="w-full">
                        Provider Messages
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={'/provider/profile'} className="w-full">
                        Business Profile
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                
                {session.user.role === 'ADMIN' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href={'/admin'} className="w-full">
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                   
                  </>
                )}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => signOut({ callbackUrl: window.location.origin })}
                  className="text-red-600 focus:text-red-600"
                >
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Header