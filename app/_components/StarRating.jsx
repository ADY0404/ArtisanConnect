"use client"
import React from 'react'
import { Star } from 'lucide-react'

function StarRating({ 
  rating = 0, 
  maxStars = 5, 
  size = 20, 
  interactive = false, 
  onRatingChange = null,
  showNumber = false 
}) {
  const [hoverRating, setHoverRating] = React.useState(0)
  
  const handleStarClick = (starValue) => {
    if (interactive && onRatingChange) {
      onRatingChange(starValue)
    }
  }
  
  const handleStarHover = (starValue) => {
    if (interactive) {
      setHoverRating(starValue)
    }
  }
  
  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0)
    }
  }
  
  return (
    <div className="flex items-center gap-1">
      <div className="flex" onMouseLeave={handleMouseLeave}>
        {[...Array(maxStars)].map((_, index) => {
          const starValue = index + 1
          const filled = (hoverRating || rating) >= starValue
          
          return (
            <Star
              key={index}
              size={size}
              className={`${
                filled 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'text-gray-300'
              } ${
                interactive 
                  ? 'cursor-pointer hover:fill-yellow-400 hover:text-yellow-400 transition-colors' 
                  : ''
              }`}
              onClick={() => handleStarClick(starValue)}
              onMouseEnter={() => handleStarHover(starValue)}
            />
          )
        })}
      </div>
      
      {showNumber && (
        <span className="text-sm text-gray-600 ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

export default StarRating 