"use client"
import ApiService from '@/app/_services/ApiService';
import { signIn, useSession } from 'next-auth/react'
import React, { useEffect, useState } from 'react'
import BusinessInfo from '../_components/BusinessInfo';
import SuggestedBusinessList from '../_components/SuggestedBusinessList';
import BusinessDescription from '../_components/BusinessDescription';
import ReviewSummary from '@/app/_components/ReviewSummary';
import ReviewList from '@/app/_components/ReviewList';
import ReviewForm from '@/app/_components/ReviewForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function BusinessDetail({params}) {

    const {data,status}=useSession();
    const [business,setBusiness]=useState([]);
    const [hasBooking, setHasBooking]=useState(false);
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    
    useEffect(()=>{
      params&&getbusinessById();
    },[params]);

    useEffect(() => {
      if (params?.businessId) {
        fetchReviews();
      }
    }, [params?.businessId]);

    useEffect(()=>{
      if(status=='authenticated' && params.businessId)
      {
        checkIfUserBooked();
      }
    },[business, status]);

    const getbusinessById=()=>{
      ApiService.getBusinessById(params.businessId).then(resp=>{
        setBusiness(resp.businessList);
        
        // Track this business as recently viewed for messaging
        if (resp.businessList) {
          addToRecentProviders(resp.businessList);
        }
      })
    }

    const addToRecentProviders = (business) => {
      try {
        const recent = localStorage.getItem('recentProviders');
        let providers = recent ? JSON.parse(recent) : [];
        
        // Remove if already exists
        providers = providers.filter(p => p.id !== business.id);
        
        // Add to beginning
        providers.unshift({
          id: business.id,
          name: business.name,
          images: business.images,
          category: business.category,
          contactPerson: business.contactPerson,
          email: business.email,
          phone: business.phone,
          address: business.address,
          viewedAt: new Date().toISOString()
        });
        
        // Keep only last 10
        providers = providers.slice(0, 10);
        
        localStorage.setItem('recentProviders', JSON.stringify(providers));
      } catch (error) {
        console.error('Error saving recent provider:', error);
      }
    }

    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        const result = await ApiService.getBusinessReviews(params.businessId);
        setReviews(result.reviews);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setReviewsLoading(false);
      }
    };

    const handleReviewSubmitted = (newReview) => {
      // Add new review to the list
      setReviews(prev => [newReview, ...prev]);
      
      // Refresh business data to get updated rating
      getbusinessById();
    };

    const handleReviewDeleted = (deletedReviewId) => {
      // Remove the deleted review from the list
      setReviews(prev => prev.filter(review => review.id !== deletedReviewId));
      
      // Refresh business data to get updated rating
      getbusinessById();
    };

    const checkIfUserBooked=async ()=>{
      try {
        const resp = await ApiService.verifyUserBooking(params.businessId);
        if (resp.hasBooking) {
          console.log("User has booked this service");
          setHasBooking(true);
        }
      } catch (error) {
        console.error("Failed to verify booking status:", error);
        setHasBooking(false); // Assume no booking on error
      }
    }

  return business&&(
    <div className='py-4 sm:py-6 md:py-8 lg:py-12 px-3 sm:px-6 md:px-10 lg:px-20 xl:px-36'>
        <BusinessInfo business={business} hasBooking={hasBooking} />

        <div className='grid grid-cols-1 lg:grid-cols-3 mt-6 sm:mt-8 md:mt-10 lg:mt-16 gap-4 sm:gap-6 lg:gap-8'>
          <div className='lg:col-span-2 order-last lg:order-first'>
            
            {/* Business Description and Reviews Tabs */}
            <Tabs defaultValue="about" className="w-full">
              <div className="overflow-x-auto pb-2">
                <TabsList className={`grid w-full grid-cols-2 ${hasBooking ? 'sm:grid-cols-3' : ''} min-w-0`}>
                  <TabsTrigger value="about" className="text-xs sm:text-sm px-2 sm:px-3">About</TabsTrigger>
                  <TabsTrigger value="reviews" className="text-xs sm:text-sm px-2 sm:px-3">Reviews</TabsTrigger>
                  {hasBooking && <TabsTrigger value="write-review" className="text-xs sm:text-sm px-2 sm:px-3">Write Review</TabsTrigger>}
                </TabsList>
              </div>
              
              <TabsContent value="about" className="mt-4 sm:mt-6">
                <BusinessDescription business={business}/>
              </TabsContent>
              
              <TabsContent value="reviews" className="mt-4 sm:mt-6">
                <div className="space-y-4 sm:space-y-6">
                  {/* Review Summary */}
                  <ReviewSummary businessId={business.id} />
                  
                  {/* Reviews List */}
                  <div>
                    <h3 className="font-semibold mb-3 sm:mb-4 text-base sm:text-lg">Customer Reviews</h3>
                    <ReviewList 
                      reviews={reviews} 
                      loading={reviewsLoading}
                      currentUserEmail={data?.user?.email}
                      onReviewDeleted={handleReviewDeleted}
                    />
                  </div>
                </div>
              </TabsContent>
              
              {hasBooking && (
                <TabsContent value="write-review" className="mt-4 sm:mt-6">
                  <ReviewForm 
                    businessId={business.id}
                    businessName={business.name}
                    onReviewSubmitted={handleReviewSubmitted}
                  />
                </TabsContent>
              )}
            </Tabs>
          </div>
          
          <div className='order-first lg:order-last'>
            <SuggestedBusinessList business={business}/>
          </div>
        </div>
    
    </div>
  )
}

export default BusinessDetail