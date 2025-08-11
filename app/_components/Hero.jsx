"use client"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import React from 'react'

function Hero() {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Navigate to search page with query
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      // Navigate to search page without query
      router.push('/search')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e)
    }
  }

  return (
    <div className='flex items-center gap-3 flex-col justify-center pt-14 pb-7 px-4 sm:px-6 lg:px-8'>
        <h2 className='font-bold text-3xl md:text-4xl lg:text-[46px] text-center'>
            Find Home 
            <span className='text-primary'> Service/Repair</span>
            <br></br> Near You</h2>
        <h2 className='text-lg md:text-xl text-gray-400 text-center'>Explore Best Home Service & Repair near you</h2>
        <div className='mt-4 flex flex-col sm:flex-row gap-4 items-center w-full max-w-lg'>
            <Input 
              placeholder='Search for services...'
              className="rounded-full flex-grow"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button 
              className="rounded-full h-[46px] w-full sm:w-auto"
              onClick={handleSearch}
              title="Search for services"
            >
                <Search className='h-4 w-4'/>
            </Button>
        </div>
    </div>
  )
}

export default Hero