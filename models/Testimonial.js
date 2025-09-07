import mongoose from 'mongoose'

const TestimonialSchema = new mongoose.Schema({
  // Customer information
  customerName: { type: String, required: true },
  customerEmail: { type: String },
  customerPhoto: { type: String },
  
  // Testimonial content
  rating: { type: Number, required: true, min: 1, max: 5 },
  testimonialText: { type: String, required: true },
  projectType: { type: String, required: true },
  
  // Provider association
  providerId: { type: String, required: true },
  providerName: { type: String, required: true },
  providerEmail: { type: String, required: true },
  
  // Verification and engagement
  verified: { type: Boolean, default: false },
  verificationDate: { type: Date },
  isPublic: { type: Boolean, default: true },
  helpful: { type: Number, default: 0 },
  
  // Related data
  relatedBookingId: { type: String },
  relatedPortfolioId: { type: String },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'testimonials'
})

// Indexes for performance
TestimonialSchema.index({ providerId: 1 })
TestimonialSchema.index({ rating: -1 })
TestimonialSchema.index({ verified: 1 })
TestimonialSchema.index({ isPublic: 1 })
TestimonialSchema.index({ createdAt: -1 })

// Static method to get testimonials by provider
TestimonialSchema.statics.getByProvider = async function(providerId) {
  try {
    const testimonials = await this.find({ 
      providerId: providerId,
      isPublic: true 
    }).sort({ createdAt: -1 }).exec()
    return testimonials
  } catch (error) {
    console.error('❌ Error fetching testimonials by provider:', error)
    throw error
  }
}

// Static method to get average rating
TestimonialSchema.statics.getAverageRating = async function(providerId) {
  try {
    const result = await this.aggregate([
      { $match: { providerId: providerId, verified: true } },
      { $group: { _id: null, averageRating: { $avg: '$rating' }, totalCount: { $sum: 1 } } }
    ])
    
    return result.length > 0 
      ? { average: Number(result[0].averageRating.toFixed(1)), count: result[0].totalCount }
      : { average: 0, count: 0 }
  } catch (error) {
    console.error('❌ Error calculating average rating:', error)
    throw error
  }
}

// Instance method to mark as verified
TestimonialSchema.methods.markAsVerified = async function() {
  try {
    this.verified = true
    this.verificationDate = new Date()
    await this.save()
    return this
  } catch (error) {
    console.error('❌ Error marking testimonial as verified:', error)
    throw error
  }
}

export default mongoose.models.Testimonial || mongoose.model('Testimonial', TestimonialSchema) 