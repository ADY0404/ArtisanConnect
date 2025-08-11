"use client"
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Hero from "./_components/Hero";
import CategoryList from "./_components/CategoryList";
import ApiService from "./_services/ApiService";
import { useEffect, useState, useCallback } from "react";
import BusinessList from "./_components/BusinessList";
import HowItWorks from "./_components/HowItWorks";
import Footer from "./_components/Footer";


export default function Home() {

  const [categoryList,setCategoryList]=useState([]);
  const [businessList,setBusinessList]=useState([]);
  
  /**
   * Used to get All Category List
   */
  const getCategoryList = useCallback(async () => {
    try {
      const resp = await ApiService.getCategory();
      setCategoryList(resp.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  /**
   * Used to get All Business List
   */
  const getAllBusinessList = useCallback(async () => {
    try {
      const resp = await ApiService.getAllBusinessList();
      setBusinessList(resp.businessLists);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    }
  }, []);

  useEffect(()=>{
    getCategoryList();
    getAllBusinessList();
  },[getCategoryList, getAllBusinessList])

  // Enhanced category refresh system for production cache issues
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Page visible, refreshing categories...');
        getCategoryList();
      }
    };

    const handleCategoriesUpdate = () => {
      console.log('🔄 Categories updated event received, refreshing...');
      getCategoryList();
    };

    // Listen for cross-tab updates via localStorage
    const handleStorageChange = (e) => {
      if (e.key === 'categoriesUpdated') {
        console.log('🔄 Categories updated in another tab, refreshing...');
        getCategoryList();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('categoriesUpdated', handleCategoriesUpdate);
    window.addEventListener('storage', handleStorageChange);

    // Set up periodic refresh for production cache issues (every 2 minutes)
    const refreshInterval = setInterval(() => {
      console.log('🔄 Periodic category refresh for cache invalidation...');
      getCategoryList();
    }, 120000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('categoriesUpdated', handleCategoriesUpdate);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(refreshInterval);
    };
  }, [getCategoryList]);
  return (
    <div>
      <Hero/>

      <CategoryList categoryList={categoryList} onRefresh={getCategoryList} />
    
      <BusinessList businessList={businessList}
      title={'Popular Business'} />

      <HowItWorks />

      <Footer />
    </div>
  );
}
