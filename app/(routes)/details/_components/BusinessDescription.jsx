"use client"
import Image from 'next/image'
import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PortfolioGallery from '@/app/_components/PortfolioGallery'
import CertificationsList from '@/app/_components/CertificationsList'

function BusinessDescription({business}) {
  return business?.name&&(
    <div>
      <Tabs defaultValue="about" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="about">About & Gallery</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="certifications">Credentials</TabsTrigger>
        </TabsList>
        
        <TabsContent value="about" className="mt-6">
          <div>
            <h2 className='font-bold text-[25px]'>Description</h2>
            <p className='mt-4 text-lg text-gray-600'>{business.about}</p>

            <h2 className='font-bold text-[25px] mt-8'>Gallery</h2>
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-5'>
              {business?.images?.map((item,index)=>(
                <Image src={item?.url || item} 
                  key={index}
                  alt='image'
                  width={700}
                  height={200}
                  className='rounded-lg object-cover h-[150px]' />
              ))}
            </div>
            
            {/* Basic Business Info */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-lg mb-3">Service Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {business.contactPerson && (
                  <div>
                    <span className="font-medium">Contact Person:</span>
                    <p className="text-gray-600">{business.contactPerson}</p>
                  </div>
                )}
                {business.email && (
                  <div>
                    <span className="font-medium">Email:</span>
                    <p className="text-gray-600">{business.email}</p>
                  </div>
                )}
                {business.phone && (
                  <div>
                    <span className="font-medium">Phone:</span>
                    <p className="text-gray-600">{business.phone}</p>
                  </div>
                )}
                {business.address && (
                  <div>
                    <span className="font-medium">Address:</span>
                    <p className="text-gray-600">{business.address}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="portfolio" className="mt-6">
          <PortfolioGallery 
            portfolio={business.portfolio || []} 
            businessName={business.name}
          />
        </TabsContent>
        
        <TabsContent value="certifications" className="mt-6">
          <CertificationsList 
            certifications={business.certifications || []} 
            specializations={business.specializations || []}
            businessName={business.name}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default BusinessDescription