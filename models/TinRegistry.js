const mongoose = require('mongoose')

const TinRegistrySchema = new mongoose.Schema({
  tinNumber: { 
    type: String, 
    required: true, 
    unique: true,
    validate: {
      validator: function(v) {
        return /^TIN-\d{4}-\d{6}$/.test(v)
      },
      message: 'TIN number must follow format TIN-YYYY-NNNNNN'
    }
  },
  
  businessName: { 
    type: String, 
    required: true,
    maxlength: 200
  },
  
  businessType: { 
    type: String, 
    enum: ['SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'LIMITED_COMPANY', 'NGO'],
    required: true 
  },
  
  registrationYear: { 
    type: Number, 
    required: true,
    min: 2010,
    max: new Date().getFullYear()
  },
  
  // Business Owner Details
  ownerInfo: {
    fullName: {
      type: String,
      required: true,
      maxlength: 100
    },
    ghanaCardNumber: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^GHA-\d{9}-\d$/.test(v)
        },
        message: 'Ghana Card number must follow format GHA-NNNNNNNNN-N'
      }
    },
    phoneNumber: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^\+233\d{9}$/.test(v)
        },
        message: 'Phone number must be in format +233XXXXXXXXX'
      }
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      validate: {
        validator: function(v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
        },
        message: 'Please enter a valid email address'
      }
    }
  },
  
  // Business Address
  businessAddress: {
    street: {
      type: String,
      required: true,
      maxlength: 200
    },
    city: {
      type: String,
      required: true,
      maxlength: 50
    },
    region: {
      type: String,
      required: true,
      enum: [
        'Greater Accra', 'Ashanti', 'Northern', 'Western', 'Eastern',
        'Central', 'Volta', 'Upper East', 'Upper West', 'Brong-Ahafo',
        'Western North', 'Ahafo', 'Bono', 'Bono East', 'Oti', 'Savannah', 'North East'
      ]
    },
    digitalAddress: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^[A-Z]{2}-\d{3}-\d{4}$/.test(v)
        },
        message: 'Digital address must follow format XX-XXX-XXXX'
      }
    },
    coordinates: {
      latitude: {
        type: Number,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180
      }
    }
  },
  
  // Business Category Mapping (to our service categories)
  businessCategory: {
    primary: {
      type: String,
      required: true,
      enum: [
        'Cleaning', 'Repair', 'Painting', 'Shifting', 'Plumbing', 'Electric',
        'Landscaping', 'Security', 'Catering', 'Transportation', 'Construction',
        'IT Services', 'Beauty & Wellness', 'Education', 'Healthcare'
      ]
    },
    secondary: [{
      type: String,
      maxlength: 100
    }],
    description: {
      type: String,
      maxlength: 500
    }
  },
  
  // Financial Information
  financialInfo: {
    expectedAnnualRevenue: {
      type: Number,
      min: 0,
      max: 10000000 // 10 million GHS
    },
    employeeCount: {
      type: Number,
      min: 1,
      max: 1000
    },
    hasPayrollTax: {
      type: Boolean,
      default: false
    }
  },
  
  // Registration Information
  registrationInfo: {
    issuedDate: {
      type: Date,
      required: true
    },
    expiryDate: {
      type: Date,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    issuingOffice: {
      type: String,
      required: true,
      maxlength: 100
    }
  },
  
  // Meta fields
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true,
  collection: 'tinregistry'
})

// Indexes for efficient queries (tinNumber unique index is automatically created by schema)
TinRegistrySchema.index({ 'ownerInfo.ghanaCardNumber': 1 })
TinRegistrySchema.index({ 'businessCategory.primary': 1 })
TinRegistrySchema.index({ 'businessAddress.region': 1 })
TinRegistrySchema.index({ 'registrationInfo.isActive': 1 })
TinRegistrySchema.index({ 'registrationInfo.expiryDate': 1 })

// Static method to validate TIN format
TinRegistrySchema.statics.validateTinFormat = function(tinNumber) {
  const tinRegex = /^TIN-\d{4}-\d{6}$/
  if (!tinRegex.test(tinNumber)) {
    return { isValid: false, error: 'Invalid TIN format. Expected: TIN-YYYY-NNNNNN' }
  }
  
  const [, year, sequence] = tinNumber.match(/^TIN-(\d{4})-(\d{6})$/)
  const currentYear = new Date().getFullYear()
  
  if (parseInt(year) < 2010 || parseInt(year) > currentYear) {
    return { isValid: false, error: `Invalid year. Must be between 2010 and ${currentYear}` }
  }
  
  if (parseInt(sequence) < 1 || parseInt(sequence) > 999999) {
    return { isValid: false, error: 'Invalid sequence number' }
  }
  
  return { isValid: true }
}

// Static method to find active TIN
TinRegistrySchema.statics.findActiveTin = async function(tinNumber) {
  try {
    const tinRecord = await this.findOne({
      tinNumber,
      'registrationInfo.isActive': true,
      'registrationInfo.expiryDate': { $gte: new Date() }
    })
    
    return tinRecord
  } catch (error) {
    console.error('Error finding active TIN:', error)
    throw error
  }
}

// Instance method to check if TIN is expired
TinRegistrySchema.methods.isExpired = function() {
  return this.registrationInfo.expiryDate < new Date()
}

// Instance method to get formatted business data for auto-fill
TinRegistrySchema.methods.getBusinessData = function() {
  return {
    businessName: this.businessName,
    businessType: this.businessType,
    ownerName: this.ownerInfo.fullName,
    email: this.ownerInfo.email,
    phone: this.ownerInfo.phoneNumber,
    address: {
      street: this.businessAddress.street,
      city: this.businessAddress.city,
      region: this.businessAddress.region,
      digitalAddress: this.businessAddress.digitalAddress,
      coordinates: this.businessAddress.coordinates
    },
    category: this.businessCategory.primary,
    description: this.businessCategory.description,
    ghanaCardNumber: this.ownerInfo.ghanaCardNumber,
    registrationYear: this.registrationYear,
    tinNumber: this.tinNumber,
    isActive: this.registrationInfo.isActive,
    expiryDate: this.registrationInfo.expiryDate
  }
}

// Pre-save middleware to update lastUpdated
TinRegistrySchema.pre('save', function(next) {
  this.registrationInfo.lastUpdated = new Date()
  this.updatedAt = new Date()
  next()
})

module.exports = mongoose.models.TinRegistry || mongoose.model('TinRegistry', TinRegistrySchema)
