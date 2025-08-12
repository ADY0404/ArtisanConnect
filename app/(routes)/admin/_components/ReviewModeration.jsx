"use client"
import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MessageSquare,
  Flag,
  CheckCircle2,
  XCircle,
  Eye,
  Star,
  User,
  Calendar,
  AlertTriangle,
  Search,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"
import StarRating from "@/app/_components/StarRating"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

function ReviewModeration() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("flagged")
  const [selectedReview, setSelectedReview] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [moderationNote, setModerationNote] = useState("")
  const [reviewCounts, setReviewCounts] = useState({
    flagged: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    all: 0
  })

  useEffect(() => {
    fetchReviews()
  }, [filter])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      
      // Fetch reviews from the API
      const response = await fetch(`/api/reviews?status=${filter}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.status}`)
      }
      
      const data = await response.json()
      
      // If the API returns the reviews directly
      let fetchedReviews = data.reviews || data
      
      // If no reviews are returned, set an empty array
      if (!Array.isArray(fetchedReviews)) {
        console.warn("API did not return an array of reviews:", data)
        fetchedReviews = []
      }
      
      // Format the reviews for display
      const formattedReviews = fetchedReviews.map(review => ({
        id: review._id || review.id,
        rating: review.rating,
        comment: review.comment || review.text || "",
        userName: review.userName || review.user?.name || "Anonymous",
        userEmail: review.userEmail || review.user?.email || "",
        businessName: review.businessName || review.business?.name || "",
        businessId: review.businessId || review.business?._id || "",
        status: review.status || "pending",
        flagReason: review.flagReason || "",
        createdAt: review.createdAt || new Date().toISOString(),
        flaggedAt: review.flaggedAt || null,
        flaggedBy: review.flaggedBy || null,
        rejectedAt: review.rejectedAt || null,
        rejectionReason: review.rejectionReason || ""
      }))
      
      setReviews(formattedReviews)
      
      // Fetch review counts for each status
      try {
        const statsResponse = await fetch('/api/reviews/stats')
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setReviewCounts({
            flagged: statsData.flagged || 0,
            pending: statsData.pending || 0,
            approved: statsData.approved || 0,
            rejected: statsData.rejected || 0,
            all: statsData.total || 0
          })
        } else {
          throw new Error(`Failed to fetch review stats: ${statsResponse.status}`)
        }
      } catch (statsError) {
        console.error("Error fetching review stats:", statsError)
        // Calculate counts from the fetched reviews as fallback
        const allReviews = await fetchAllReviews()
        const counts = {
          flagged: allReviews.filter(r => r.status === "flagged").length,
          pending: allReviews.filter(r => r.status === "pending").length,
          approved: allReviews.filter(r => r.status === "approved").length,
          rejected: allReviews.filter(r => r.status === "rejected").length,
          all: allReviews.length
        }
        setReviewCounts(counts)
      }
      
    } catch (error) {
      console.error("Error fetching reviews:", error)
      toast.error("Failed to load reviews")
      
      // Fallback to empty reviews
      setReviews([])
    } finally {
      setLoading(false)
    }
  }
  
  // Helper function to fetch all reviews for counting if stats API fails
  const fetchAllReviews = async () => {
    try {
      const response = await fetch('/api/reviews?status=all&count_only=true')
      if (response.ok) {
        const data = await response.json()
        return data.reviews || data || []
      }
      return []
    } catch (error) {
      console.error("Error fetching all reviews:", error)
      return []
    }
  }

  const handleReviewAction = async (reviewId, action) => {
    try {
      setActionLoading(true)
      
      // Call the API to moderate the review
      const response = await fetch('/api/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          action,
          moderationNote,
          status: action === 'approve' ? 'approved' : 'rejected'
        })
      })
      
      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Failed to ${action} review: ${response.status} - ${errorData}`)
      }
      
      const result = await response.json()
      
      toast.success(`Review ${action}d successfully`)
      
      // Update local state
      setReviews(prev => 
        prev.filter(review => review.id !== reviewId)
      )
      
      // Close modal
      setSelectedReview(null)
      setModerationNote("")
      
      // Refresh counts
      fetchReviews()
      
    } catch (error) {
      console.error("Error moderating review:", error)
      toast.error(`Failed to ${action} review: ${error.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      case "flagged":
        return <Badge className="bg-orange-100 text-orange-800">Flagged</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Review Moderation
          </CardTitle>
          <CardDescription>
            Review and moderate customer feedback and ratings
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchReviews} 
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filter buttons */}
          <div className="flex gap-2 flex-wrap">
            {Object.entries(reviewCounts).map(([filterType, count]) => (
              <Button
                key={filterType}
                variant={filter === filterType ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(filterType)}
                className="capitalize"
              >
                {filterType} ({count})
              </Button>
            ))}
          </div>

          {/* Reviews list */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No reviews found with "{filter}" status</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StarRating rating={review.rating} size="sm" readOnly />
                        {getStatusBadge(review.status)}
                        {review.status === "flagged" && review.flagReason && (
                          <Badge variant="outline" className="text-red-600">
                            <Flag className="w-3 h-3 mr-1" />
                            {review.flagReason}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-md border">
                        <p className="text-sm">{review.comment}</p>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3 h-3" />
                          {review.userName}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                        <span>for {review.businessName}</span>
                      </div>

                      {review.flaggedAt && (
                        <div className="flex items-center gap-1 text-sm text-orange-600">
                          <AlertTriangle className="w-4 h-4" />
                          Flagged on {new Date(review.flaggedAt).toLocaleDateString()}
                          {review.flaggedBy && ` by ${review.flaggedBy.startsWith('business') ? 'business owner' : 'user'}`}
                        </div>
                      )}
                      
                      {review.rejectedAt && (
                        <div className="flex items-center gap-1 text-sm text-red-600">
                          <XCircle className="w-4 h-4" />
                          Rejected on {new Date(review.rejectedAt).toLocaleDateString()}
                          {review.rejectionReason && `: ${review.rejectionReason}`}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-row md:flex-col items-start md:items-end gap-2 self-start pt-2 md:pt-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedReview(review)}
                        className="text-blue-600 hover:text-blue-700 w-full justify-start"
                      >
                        <Eye className="w-4 h-4 mr-2" /> View
                      </Button>
                      {review.status !== "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedReview({...review, action: "approve"})}
                          className="text-green-600 hover:text-green-700 w-full justify-start"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                        </Button>
                      )}
                      {review.status !== "rejected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedReview({...review, action: "reject"})}
                          className="text-red-600 hover:text-red-700 w-full justify-start"
                        >
                          <XCircle className="w-4 h-4 mr-2" /> Reject
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Review Detail/Action Modal */}
      {selectedReview && (
        <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedReview.action 
                  ? `${selectedReview.action === "approve" ? "Approve" : "Reject"} Review` 
                  : "Review Details"}
              </DialogTitle>
              <DialogDescription>
                {selectedReview.action 
                  ? `Are you sure you want to ${selectedReview.action} this review?` 
                  : `Review for ${selectedReview.businessName}`}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2">
                <StarRating rating={selectedReview.rating} size="md" readOnly />
                {getStatusBadge(selectedReview.status)}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md border">
                <p>{selectedReview.comment}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Customer</p>
                  <p className="font-medium">{selectedReview.userName}</p>
                  <p className="text-xs text-gray-500">{selectedReview.userEmail}</p>
                </div>
                <div>
                  <p className="text-gray-500">Business</p>
                  <p className="font-medium">{selectedReview.businessName}</p>
                  <p className="text-xs text-gray-500">ID: {selectedReview.businessId}</p>
                </div>
                <div>
                  <p className="text-gray-500">Submitted</p>
                  <p className="font-medium">{new Date(selectedReview.createdAt).toLocaleDateString()}</p>
                  <p className="text-xs text-gray-500">{new Date(selectedReview.createdAt).toLocaleTimeString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <p className="font-medium capitalize">{selectedReview.status}</p>
                  {selectedReview.flagReason && (
                    <p className="text-xs text-orange-600">{selectedReview.flagReason}</p>
                  )}
                </div>
              </div>
              
              {selectedReview.action && (
                <div>
                  <label className="text-sm font-medium">
                    Moderation Note
                    <span className="text-gray-500 font-normal"> (optional)</span>
                  </label>
                  <Textarea
                    value={moderationNote}
                    onChange={(e) => setModerationNote(e.target.value)}
                    placeholder="Add a note explaining your decision..."
                    className="mt-1"
                  />
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedReview(null)}
              >
                Cancel
              </Button>
              
              {selectedReview.action && (
                <Button
                  variant={selectedReview.action === "approve" ? "default" : "destructive"}
                  onClick={() => handleReviewAction(selectedReview.id, selectedReview.action)}
                  disabled={actionLoading}
                >
                  {actionLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {selectedReview.action === "approve" ? "Approve Review" : "Reject Review"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
}

export default ReviewModeration 