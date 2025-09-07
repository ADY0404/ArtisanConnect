import ApiService from '@/app/_services/ApiService';
import { Button } from '@/components/ui/button'
import {  NotebookPen } from 'lucide-react'
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import BookingSection from './BookingSection';
import RoleAccessMessage from '@/app/_components/RoleAccessMessage';

function SuggestedBusinessList({business}) {
  
  const [businessList,setBusinessList]=useState([]);
  const { data: session } = useSession();
  
    useEffect(()=>{
       
        business&&getBusinessList()
    },[business]);

    const getBusinessList=()=>{
        ApiService.getBusinessByCategory(business?.category?.name)
        .then(resp=>{
            setBusinessList(resp?.businessLists);
        })
    }

  
  return (
    <div className='md:pl-10'>
     
      {/* Only show booking button for customers */}
      {session?.user?.role === 'CUSTOMER' ? (
      <BookingSection business={business}>
        <Button className="flex gap-2 w-full">
        <NotebookPen/>
        Book Appointment  
        </Button> 
      </BookingSection>
      ) : (
        <RoleAccessMessage 
          allowedRoles={['CUSTOMER']} 
          feature="book appointments" 
        />
      )}
      <div className='hidden md:block'>
      <h2 className='font-bold 
      text-lg mt-3 mb-3
      
      '>Similar Business</h2>
      <div className=''>
        {businessList&&businessList.map((business,index)=>(
          <Link key={business.id} href={'/details/'+business.id} className="flex gap-2 mb-4
          hover:border rounded-lg p-2
          cursor-pointer hover:shadow-md
           border-primary">
            <Image src={business?.images[0]}
            alt={business.name}
            width={80}
            height={80}
            className='rounded-lg object-cover h-[100px]'
            />
            <div className=''>
              <h2 className='font-bold'>{business.name}</h2>
              <h2 className='text-primary'>{business.contactPerson}</h2>
              <h2 className='text-gray-400'>{business.address}</h2>

            </div>
          </Link>
        ))}
      </div>
      </div>
    </div>
  )
}

export default SuggestedBusinessList