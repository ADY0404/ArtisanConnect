import { Button } from '@/components/ui/button'
import { Clock, Mail, MapPin, Share, User } from 'lucide-react'
import Image from 'next/image'
import React from 'react'
import StarRating from '@/app/_components/StarRating'
import MessageProviderButton from '@/app/_components/MessageProviderButton'

function BusinessInfo({business, hasBooking}) {
  return business?.name&&(
    <div className='flex flex-col lg:flex-row gap-4 sm:gap-6 items-center'>
      <div className='flex justify-center lg:justify-start'>
        <Image src={business?.images[0]}
          alt={business.name}
          width={120}
          height={120}
          className='rounded-full h-[120px] w-[120px] sm:h-[150px] sm:w-[150px] object-cover'
        />
      </div>
      <div className='flex flex-col lg:flex-row justify-between items-center w-full mt-4 lg:mt-0 gap-4 sm:gap-6'>
        <div className='flex flex-col mt-4 lg:mt-0 items-center lg:items-baseline gap-2 sm:gap-3 text-center lg:text-left'>
          <h2 className='text-primary p-1 px-3 text-xs sm:text-sm bg-purple-100 rounded-full'>{business?.category?.name}</h2>
          <h2 className='text-xl sm:text-2xl md:text-3xl lg:text-[40px] font-bold text-center lg:text-left leading-tight'>{business.name}</h2>
          
          <div className='flex items-center gap-2 sm:gap-3 flex-wrap justify-center lg:justify-start'>
            <StarRating 
              rating={business.rating || 0} 
              size={16} 
              showNumber={true} 
            />
            {business.totalReviews > 0 && (
              <span className='text-gray-600 text-sm'>
                ({business.totalReviews} review{business.totalReviews !== 1 ? 's' : ''})
              </span>
            )}
          </div>
          
          <h2 className='flex gap-2 text-sm sm:text-base lg:text-lg text-gray-500 items-center justify-center lg:justify-start'>
            <MapPin className='flex-shrink-0 w-4 h-4' /> 
            <span className="break-words">{business.address}</span>
          </h2>
          <h2 className='flex gap-2 text-sm sm:text-base lg:text-lg text-gray-500 items-center justify-center lg:justify-start'>
            <Mail className='flex-shrink-0 w-4 h-4' />
            <span className="break-all">{business?.email}</span>
          </h2>
        </div>
        <div className='flex flex-col gap-3 sm:gap-5 items-center lg:items-end mt-4 lg:mt-0'>
          
          {hasBooking &&
            <div className='w-full sm:w-48'>
              <MessageProviderButton business={business} />
            </div>
          }
          
          <h2 className='flex gap-2 text-base sm:text-lg lg:text-xl text-primary items-center justify-center lg:justify-start'>
            <User className="w-4 h-4 sm:w-5 sm:h-5"/> 
            <span>{business.contactPerson}</span>
          </h2>
          <h2 className='flex gap-2 text-sm sm:text-base lg:text-xl text-gray-500 items-center justify-center lg:justify-start'>
            <Clock className="w-4 h-4 sm:w-5 sm:h-5"/> 
            <span>Available 8:00 AM to 10:PM</span>
          </h2>
        </div>
      </div>
    </div>
  )
}

export default BusinessInfo