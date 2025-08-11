"use client"
import React, { useState } from 'react'
import StarRating from './StarRating'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { ThumbsUp, MoreHorizontal, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import ApiService from '@/app/_services/ApiService'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

function ReviewList({ reviews = [], loading = false, currentUserEmail = null, onReviewDeleted = null }) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reviewToDelete, setReviewToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleMarkHelpful = async (reviewId) => {
    try {
      // TODO: Implement mark as helpful API call
      console.log('Mark helpful:', reviewId)
    } catch (error) {
      console.error('Error marking review as helpful:', error)
    }
  }

  const handleReportReview = (reviewId) => {
    // TODO: Implement report review functionality
    console.log('Report review:', reviewId)
    toast.info('Review reported. Thank you for your feedback.')
  }

  const handleDeleteClick = (review) => {
    setReviewToDelete(review)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!reviewToDelete) return

    try {
      setDeleting(true)
      await ApiService.deleteReview(reviewToDelete.id)
      
      toast.success('Review deleted successfully!')
      
      // Notify parent component to remove the review from the list
      if (onReviewDeleted) {
        onReviewDeleted(reviewToDelete.id)
      }
      
      setDeleteDialogOpen(false)
      setReviewToDelete(null)
    } catch (error) {
      console.error('Error deleting review:', error)
      toast.error(error.message || 'Failed to delete review')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setReviewToDelete(null)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="p-4 border rounded-lg animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No reviews yet. Be the first to leave a review!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="p-4 border rounded-lg">
          {/* Review Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* User Avatar */}
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                {review.userName.charAt(0).toUpperCase()}
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{review.userName}</h4>
                  {review.isVerified && (
                    <Badge variant="secondary" className="text-xs">
                      Verified
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StarRating rating={review.rating} size={16} />
                  <span className="text-sm text-gray-500">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Review Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger className="p-1 hover:bg-gray-100 rounded">
                <MoreHorizontal size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleReportReview(review.id)}>
                  Report Review
                </DropdownMenuItem>
                {currentUserEmail === review.userEmail && (
                  <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(review)}>
                    Delete Review
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Review Content */}
          {review.comment && (
            <p className="text-gray-700 mb-3 leading-relaxed">
              {review.comment}
            </p>
          )}

          {/* Review Images */}
          {review.images && review.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
              {review.images.map((imageUrl, index) => (
                <div key={index} className="relative aspect-square">
                  <Image
                    src={imageUrl}
                    alt={`Review image ${index + 1}`}
                    fill
                    className="rounded-md object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      // TODO: Open image in modal/lightbox
                      window.open(imageUrl, '_blank')
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Review Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            <button
              onClick={() => handleMarkHelpful(review.id)}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ThumbsUp size={14} />
              Helpful {review.helpfulCount > 0 && `(${review.helpfulCount})`}
            </button>
            
            <span className="text-xs text-gray-400">
              Review #{review.id.slice(-6)}
            </span>
          </div>
        </div>
      ))}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={handleDeleteCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this review?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ReviewList 