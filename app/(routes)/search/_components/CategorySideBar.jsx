"use client"
import ApiService from '@/app/_services/ApiService';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react'

function CategorySideBar() {
    const [categoryList,setCategoryList]=useState([]);
    const [selectedCategory,setSelectedCategory]=useState();
    const params=usePathname();
    params.split('/')[2];
    useEffect(()=>{
      getCategoryList();
    },[])

    useEffect(()=>{
      params&&setSelectedCategory(decodeURIComponent(params.split('/')[2] || ''))
    },[params])
  
    /**
     * Used to get All Category List
     */
    const getCategoryList=()=>{
      ApiService.getCategory().then(resp=>{
        console.log(resp)
        setCategoryList(resp.categories);
      })
    }

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
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
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
            width={30}
            height={30}
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
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
            style={{ backgroundColor: category.backgroundColor || '#3B82F6' }}
          >
            {category.icon}
          </div>
        );
      }
    };

  return (
    <div>
        <h2 className='font-bold mb-3 text-lg text-primary'>Categories</h2>
        <div>
            {categoryList.map((category,index)=>(
                <Link href={'/search/'+encodeURIComponent(category.name)} 
                key={index} className={`flex gap-2 p-3 
                border rounded-lg mb-3
                md:mr-10 cursor-pointer
                hover:bg-purple-50
                hover:shadow-md
                items-center
                hover:text-primary
                 hover:border-primary
                 ${selectedCategory==category.name&&
                  'border-primary text-primary shadow-md bg-purple-50'}
                 `}>
                    {renderCategoryIcon(category)}
                    <h2>{category.name}</h2>
                </Link>
            ))}
        </div>
    </div>
  )
}

export default CategorySideBar