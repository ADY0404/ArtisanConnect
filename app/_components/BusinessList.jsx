import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import StarRating from './StarRating'
import { MapPin, Phone, Mail } from 'lucide-react'

function BusinessList({ 
  businessList, 
  title, 
  viewMode = 'grid', 
  showDistance = false,
  className = ""
}) {

  const GridCard = ({ business, index }) => (
    <Link 
      href={'/details/' + business.id}
      key={index} 
      className='shadow-md rounded-lg hover:shadow-lg cursor-pointer hover:shadow-primary hover:scale-105 transition-all ease-in-out bg-white flex flex-col'
    >
      <div className="relative">
        <Image 
          src={business?.images[0] || '/placeholder-business.jpg'}
          alt={business.name}
          width={500}
          height={200}
          className='h-[150px] md:h-[180px] object-cover rounded-t-lg'
        />
        {showDistance && business.distance && (
          <Badge className="absolute top-2 right-2 bg-primary text-white">
            <MapPin size={12} className="mr-1" />
            {business.distance}km
          </Badge>
        )}
      </div>
      
      <div className='flex flex-col items-baseline p-3 gap-1 flex-grow'>
        <Badge variant="secondary" className='text-[10px] sm:text-[12px]'>
          {business.category?.name || 'Service'}
        </Badge>
        
        <h2 className='font-bold text-base sm:text-lg'>{business.name}</h2>
        <h2 className='text-primary text-sm'>{business.contactPerson}</h2>
        
        {/* Rating Display */}
        <div className='flex items-center gap-2'>
          <StarRating 
            rating={business.rating || 0} 
            size={16} 
            showNumber={true} 
          />
          {business.totalReviews > 0 && (
            <span className='text-xs text-gray-500'>
              ({business.totalReviews})
            </span>
          )}
        </div>
        
        <p className='text-gray-500 text-sm line-clamp-2 mt-auto'>{business.address}</p>
        <Button className="rounded-lg mt-3 w-full">Book Now</Button>
      </div>
    </Link>
  )

  const ListCard = ({ business, index }) => (
    <Link 
      href={'/details/' + business.id}
      key={index}
      className='flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg shadow-md hover:shadow-lg cursor-pointer hover:shadow-primary transition-all ease-in-out'
    >
      <div className="relative flex-shrink-0">
        <Image 
          src={business?.images[0] || '/placeholder-business.jpg'}
          alt={business.name}
          width={200}
          height={150}
          className='w-full h-32 sm:w-32 md:w-48 sm:h-full object-cover rounded-lg'
        />
        {showDistance && business.distance && (
          <Badge className="absolute top-1 right-1 bg-primary text-white text-xs">
            {business.distance}km
          </Badge>
        )}
      </div>
      
      <div className='flex-1 flex flex-col justify-between mt-2 sm:mt-0'>
        <div>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-2 sm:gap-0">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className='text-xs'>
                {business.category?.name || 'Service'}
              </Badge>
              {showDistance && business.distance && (
                <span className="text-xs text-gray-500 flex items-center">
                  <MapPin size={12} className="mr-1" />
                  {business.distance}km away
                </span>
              )}
            </div>
          </div>
          
          <h2 className='font-bold text-lg sm:text-xl mb-1'>{business.name}</h2>
          
          {/* Rating */}
          <div className='flex items-center gap-2 mb-2'>
            <StarRating 
              rating={business.rating || 0} 
              size={16} 
              showNumber={true} 
            />
            {business.totalReviews > 0 && (
              <span className='text-sm text-gray-500'>
                ({business.totalReviews} review{business.totalReviews !== 1 ? 's' : ''})
              </span>
            )}
          </div>

          <p className='text-gray-600 text-sm mb-2 line-clamp-2'>{business.about}</p>
          
          {/* Contact Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin size={14} />
              <span>{business.address}</span>
            </div>
            {business.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Phone size={14} />
                <span>{business.phone}</span>
              </div>
            )}
            {business.email && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Mail size={14} />
                <span>{business.email}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-3">
          <span className='text-primary font-medium'>{business.contactPerson}</span>
          <Button className="rounded-lg">Book Now</Button>
        </div>
      </div>
    </Link>
  )

  if (!businessList || businessList.length === 0) {
    // Loading skeleton
    return (
      <div className={`mt-5 ${className}`}>
        {title && <h2 className='font-bold text-[22px] mb-5'>{title}</h2>}
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6' 
            : 'space-y-4'
        }>
          {[1,2,3,4,5,6,7,8].map((item,index)=>(
            <div 
              key={index} 
              className={
                viewMode === 'grid'
                  ? 'w-full h-[300px] bg-slate-200 rounded-lg animate-pulse'
                  : 'w-full h-[160px] bg-slate-200 rounded-lg animate-pulse'
              }
            >
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`mt-5 px-4 sm:px-0 ${className}`}>
      {title && <h2 className='font-bold text-[22px] mb-5'>{title}</h2>}
      
      {viewMode === 'grid' ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
          {businessList.map((business, index) => (
            <GridCard key={business.id || index} business={business} index={index} />
          ))}
        </div>
      ) : (
        <div className='space-y-4'>
          {businessList.map((business, index) => (
            <ListCard key={business.id || index} business={business} index={index} />
          ))}
        </div>
      )}
    </div>
  )
}

export default BusinessList