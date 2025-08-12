import mongoose from 'mongoose'

const PortfolioSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  
  // Images
  beforeImage: { type: String, required: true },
  afterImage: { type: String, required: true },
  additionalImages: [{ type: String }],
  
  // Project details
  projectDate: { type: Date },
  duration: { type: String },
  cost: { type: String },
  tags: [{ type: String }],
  
  // Customer info
  customerName: { type: String },
  customerEmail: { type: String },
  
  // Provider association
  providerId: { type: String, required: true },
  providerName: { type: String, required: true },
  providerEmail: { type: String, required: true },
  
  // Visibility and engagement
  isPublic: { type: Boolean, default: true },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  inquiries: { type: Number, default: 0 },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'portfolioItems'
})

// Indexes for performance
PortfolioSchema.index({ providerId: 1 })
PortfolioSchema.index({ category: 1 })
PortfolioSchema.index({ isPublic: 1 })
PortfolioSchema.index({ createdAt: -1 })

// Static method to get portfolio by provider
PortfolioSchema.statics.getByProvider = async function(providerId) {
  try {
    const portfolioItems = await this.find({ 
      providerId: providerId,
      isPublic: true 
    }).sort({ createdAt: -1 }).exec()
    return portfolioItems
  } catch (error) {
    console.error('❌ Error fetching portfolio by provider:', error)
    throw error
  }
}

// Instance method to increment views
PortfolioSchema.methods.incrementViews = async function() {
  try {
    this.views += 1
    await this.save()
    return this.views
  } catch (error) {
    console.error('❌ Error incrementing views:', error)
    throw error
  }
}

export default mongoose.models.Portfolio || mongoose.model('Portfolio', PortfolioSchema) 