"use client"
import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import StarRating from './StarRating'
import ApiService from '@/app/_services/ApiService'
import { toast } from 'sonner'
import { Camera, X, Upload } from 'lucide-react'
import Image from 'next/image'

function ReviewForm({ businessId, businessName, onReviewSubmitted }) {
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return

    // Limit to 5 images total
    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed')
      return
    }

    setUploading(true)
    const uploadedImages = []

    try {
      for (const file of files) {
        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Maximum size is 10MB.`)
          continue
        }

        // Use the existing Cloudinary upload API
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'review-images') // Organize in folder

        const response = await fetch('/api/cloudinary/upload', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            uploadedImages.push(data.secure_url)
          } else {
            console.error('Failed to upload image:', file.name, data.error)
            toast.error(`Failed to upload ${file.name}`)
          }
        } else {
          console.error('Failed to upload image:', file.name)
          toast.error(`Failed to upload ${file.name}`)
        }
      }

      if (uploadedImages.length > 0) {
        setImages(prev => [...prev, ...uploadedImages])
        toast.success(`${uploadedImages.length} image(s) uploaded successfully`)
      }
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error('Failed to upload images')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (indexToRemove) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!session) {
      toast.error('Please login to submit a review')
      return
    }

    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    setIsSubmitting(true)

    try {
      const reviewData = {
        businessId,
        rating,
        comment: comment.trim(),
        images
      }

      const result = await ApiService.createReview(reviewData)
      
      if (result.success) {
        toast.success('Review submitted successfully!')
        
        // Reset form
        setRating(0)
        setComment('')
        setImages([])
        
        // Notify parent component
        if (onReviewSubmitted) {
          onReviewSubmitted(result.review)
        }
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error(error.message || 'Failed to submit review')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!session) {
    return (
      <div className="p-6 border rounded-lg text-center">
        <h3 className="font-semibold mb-2">Login Required</h3>
        <p className="text-gray-600">Please login to leave a review for {businessName}</p>
      </div>
    )
  }

  return (
    <div className="p-6 border rounded-lg">
      <h3 className="font-semibold mb-4">Write a Review for {businessName}</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Your Rating *</label>
          <StarRating
            rating={rating}
            interactive={true}
            onRatingChange={setRating}
            size={24}
          />
          {rating > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </p>
          )}
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium mb-2">Your Review</label>
          <textarea
            className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this service provider..."
            maxLength={1000}
          />
          <p className="text-xs text-gray-500 mt-1">
            {comment.length}/1000 characters
          </p>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">Add Photos (Optional)</label>
          <div className="space-y-3">
            {/* Upload Button */}
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={uploading}
              />
              <label
                htmlFor="image-upload"
                className={`flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 ${
                  uploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploading ? <Upload className="animate-spin" size={16} /> : <Camera size={16} />}
                {uploading ? 'Uploading...' : 'Add Photos'}
              </label>
              <span className="text-xs text-gray-500">
                Max 5 photos, 10MB each
              </span>
            </div>

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {images.map((imageUrl, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={imageUrl}
                      alt={`Review image ${index + 1}`}
                      width={100}
                      height={100}
                      className="rounded-md object-cover w-full h-24"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button 
            type="submit" 
            disabled={isSubmitting || rating === 0}
            className="w-full"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ReviewForm 