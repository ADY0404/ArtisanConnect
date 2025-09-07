import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { RefreshCw } from 'lucide-react'

function CategoryList({categoryList, onRefresh}) {
  // Function to check if the icon is an image URL or an emoji/text
  const isImageUrl = (icon) => {
    if (!icon) return false;
    // Check if it's a URL or path
    return icon.includes('/') || icon.includes('.png') || icon.includes('.jpg') || icon.includes('.svg') || icon.includes('.webp');
  };

  // Function to render the appropriate icon
  const renderCategoryIcon = (category) => {
    if (!category.icon) {
      // Default icon if none provided
      return (
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
          style={{ backgroundColor: category.backgroundColor || '#3B82F6' }}
        >
          🔧
        </div>
      );
    }

    if (isImageUrl(category.icon)) {
      // Render as image if it's a URL
      return (
        <Image 
          src={category.icon}
          alt={category.name}
          width={40}
          height={40}
          className="object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/placeholder-business.jpg';
          }}
        />
      );
    } else {
      // Render as emoji/text in a styled div
      return (
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
          style={{ backgroundColor: category.backgroundColor || '#3B82F6' }}
        >
          {category.icon}
        </div>
      );
    }
  };

  return (
    <div className='mx-4 md:mx-16 lg:mx-22 xl:mx-52 my-10'>
      {/* Header with refresh button */}
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-2xl font-bold text-gray-800'>Service Categories</h2>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className='flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors'
          >
            <RefreshCw className='w-4 h-4' />
            Refresh
          </button>
        )}
      </div>
      
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4'>
        {categoryList.length>0?categoryList.map((category,index)=>(
            <Link href={'/search/'+encodeURIComponent(category.name)}  key={index} className={`flex flex-col items-center
             justify-center gap-2
             bg-purple-50 p-5 rounded-lg
             cursor-pointer hover:scale-105 transition-all ease-in-out
             text-center
             `}>
                
                {renderCategoryIcon(category)}
                <h2 className='text-primary text-sm sm:text-base'>{category.name}</h2>
            </Link>
        )):
            [1,2,3,4,5,6].map((item,index)=>(
                <div key={index} className='h-[120px]
                w-full bg-slate-200 animate-pulse
                rounded-lg'>

                </div>
            ))
        }
      </div>
    </div>
  )
}

export default CategoryList