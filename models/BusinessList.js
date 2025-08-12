import mongoose from 'mongoose'

const BusinessListSchema = new mongoose.Schema({
  name: { type: String, required: true },
  about: { type: String, required: true },
  address: { type: String, required: true },
  // ✅ LOCATION COORDINATES FOR GEOGRAPHIC FILTERING
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  country: { type: String, default: 'Ghana' },
  contactPerson: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  images: [{ type: String }],
  categoryId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category', 
    required: true 
  },
  specializations: [{ type: String }],
  certifications: [{
    name: String,
    issuer: String,
    issuedDate: String,
    type: String // 'certification', 'license', 'insurance'
  }],
  experience: { type: String, default: '' },
  portfolio: [{ 
    type: String // URLs to portfolio images
  }],
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  providerEmail: { type: String, required: true }, // ✅ PROVIDER ASSOCIATION
  createdBy: { type: String, required: true }, // ✅ CREATED BY TRACKING
  isActive: { type: Boolean, default: true },

  // ✅ SIMPLIFIED PROVIDER TIER SYSTEM - Only Premium tier management
  providerTier: {
    type: String,
    enum: ['STANDARD', 'PREMIUM'],
    default: 'STANDARD'
  },
  isPremiumProvider: { type: Boolean, default: false },
  premiumPromotedAt: { type: Date, default: null },
  premiumPromotedBy: { type: String, default: null },
  tierAssignedAt: { type: Date, default: Date.now },
  performanceMetrics: {
    completedBookings: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    accountAgeMonths: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    lastUpdated: { type: Date, default: Date.now }
  },
  
  // ✅ NEW APPROVAL-RELATED FIELDS FOR PHASE 1
  approvalStatus: { 
    type: String, 
    enum: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_DOCUMENTS', 'NEEDS_REVIEW'], 
    default: 'PENDING' 
  },
  documentsUploaded: [{
    type: { type: String }, // 'ghana_card', 'business_license', 'tax_certificate', 'insurance', 'portfolio'
    fileName: String,
    fileUrl: String,
    publicId: String, // Cloudinary public ID for deletion
    fileSize: Number, // File size in bytes
    format: String, // File format (jpg, png, pdf, etc.)
    uploadedAt: { type: Date, default: Date.now }
  }],
  adminNotes: { type: String, default: '' },
  reviewedBy: { type: String, default: '' }, // Admin email who reviewed
  reviewedAt: { type: Date },
  rejectionReason: { type: String, default: '' },
  isPublic: { type: Boolean, default: false }, // Only approved businesses are public
  guarantorInfo: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    relationship: { type: String, default: '' },
    ghanaCardNumber: { type: String, default: '' }
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'businesslists'
})

// Index for efficient provider queries
BusinessListSchema.index({ providerEmail: 1 })
BusinessListSchema.index({ categoryId: 1 })
BusinessListSchema.index({ rating: -1 })
// ✅ NEW INDEXES FOR APPROVAL WORKFLOW
BusinessListSchema.index({ approvalStatus: 1 })
BusinessListSchema.index({ isPublic: 1 })
// ✅ GEOSPATIAL INDEX FOR LOCATION-BASED QUERIES
BusinessListSchema.index({ latitude: 1, longitude: 1 })
BusinessListSchema.index({ city: 1 })
BusinessListSchema.index({ state: 1 })

// Create static method for business creation with proper error handling
BusinessListSchema.statics.create = async function(businessData) {
  try {
    const business = new this(businessData)
    const savedBusiness = await business.save()
    return {
      success: true,
      business: savedBusiness
    }
  } catch (error) {
    console.error('❌ BusinessList creation error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Get businesses by provider email
BusinessListSchema.statics.getByProvider = async function(providerEmail) {
  try {
    const businesses = await this.find({ 
      providerEmail: providerEmail,
      isActive: true 
    }).exec()
    return businesses
  } catch (error) {
    console.error('❌ Error fetching businesses by provider:', error)
    throw error
  }
}

// Update business rating (called from Review model)
BusinessListSchema.statics.updateRating = async function(businessId, averageRating, totalReviews) {
  try {
    const result = await this.findByIdAndUpdate(
      businessId,
      {
        rating: averageRating,
        totalReviews: totalReviews,
        updatedAt: new Date()
      },
      { new: true }
    )
    
    if (!result) {
      throw new Error('Business not found')
    }
    
    console.log(`✅ Business rating updated: ${averageRating} (${totalReviews} reviews)`)
    return result
  } catch (error) {
    console.error('❌ Error updating business rating:', error)
    throw error
  }
}

export default mongoose.models.BusinessList || mongoose.model('BusinessList', BusinessListSchema) 