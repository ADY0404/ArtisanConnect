"use client"
import React, { useEffect, useState } from 'react'
import StarRating from './StarRating'
import ApiService from '@/app/_services/ApiService'
import { Progress } from '@/components/ui/progress'

function ReviewSummary({ businessId }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const result = await ApiService.getReviewStatistics(businessId)
        setStats(result.stats)
      } catch (error) {
        console.error('Error fetching review stats:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    if (businessId) {
      fetchStats()
    }
  }, [businessId])

  if (loading) {
    return (
      <div className="p-4 border rounded-lg animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32 mb-3"></div>
        <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="h-4 bg-gray-200 rounded w-12"></div>
              <div className="h-2 bg-gray-200 rounded flex-1"></div>
              <div className="h-4 bg-gray-200 rounded w-8"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 border rounded-lg text-red-600">
        <p>Error loading review statistics</p>
      </div>
    )
  }

  if (!stats || stats.totalReviews === 0) {
    return (
      <div className="p-4 border rounded-lg text-center">
        <h3 className="font-semibold mb-2">No Reviews Yet</h3>
        <p className="text-gray-600">Be the first to review this business!</p>
      </div>
    )
  }

  const { totalReviews, averageRating, ratingDistribution } = stats

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold mb-3">Customer Reviews</h3>
      
      {/* Overall Rating */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <div className="text-center flex-shrink-0">
          <div className="text-3xl font-bold text-gray-900">
            {averageRating.toFixed(1)}
          </div>
          <StarRating rating={averageRating} size={20} showNumber={false} />
          <div className="text-sm text-gray-600 mt-1">
            {totalReviews} review{totalReviews !== 1 ? 's' : ''}
          </div>
        </div>
        
        {/* Rating Breakdown */}
        <div className="flex-1 space-y-2 w-full">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = ratingDistribution[rating] || 0
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
            
            return (
              <div key={rating} className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1 w-12 flex-shrink-0">
                  <span>{rating}</span>
                  <span className="text-yellow-400">★</span>
                </div>
                <Progress 
                  value={percentage} 
                  className="flex-1 h-2"
                />
                <span className="text-gray-600 w-10 text-right flex-shrink-0">
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Rating Distribution Summary */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t text-center">
        <div>
          <div className="text-xl sm:text-2xl font-semibold text-green-600">
            {(ratingDistribution[5] || 0) + (ratingDistribution[4] || 0)}
          </div>
          <div className="text-xs text-gray-600">Excellent</div>
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-semibold text-yellow-600">
            {ratingDistribution[3] || 0}
          </div>
          <div className="text-xs text-gray-600">Good</div>
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-semibold text-red-600">
            {(ratingDistribution[2] || 0) + (ratingDistribution[1] || 0)}
          </div>
          <div className="text-xs text-gray-600">Poor</div>
        </div>
      </div>
    </div>
  )
}

export default ReviewSummary 