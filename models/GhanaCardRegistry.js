const mongoose = require('mongoose')

const GhanaCardRegistrySchema = new mongoose.Schema({
  cardNumber: { 
    type: String, 
    required: true, 
    unique: true,
    validate: {
      validator: function(v) {
        return /^GHA-\d{9}-\d$/.test(v)
      },
      message: 'Ghana Card number must follow format GHA-NNNNNNNNN-N'
    }
  },
  
  // Personal Information
  personalInfo: {
    firstName: {
      type: String,
      required: true,
      maxlength: 50,
      uppercase: true
    },
    middleName: {
      type: String,
      maxlength: 50,
      uppercase: true,
      default: ''
    },
    lastName: {
      type: String,
      required: true,
      maxlength: 50,
      uppercase: true
    },
    fullName: {
      type: String,
      required: true,
      uppercase: true
    },
    dateOfBirth: {
      type: Date,
      required: true,
      validate: {
        validator: function(v) {
          const today = new Date()
          const age = today.getFullYear() - v.getFullYear()
          return age >= 18 && age <= 120
        },
        message: 'Age must be between 18 and 120 years'
      }
    },
    placeOfBirth: {
      type: String,
      required: true,
      maxlength: 100
    },
    nationality: {
      type: String,
      default: 'Ghanaian',
      maxlength: 50
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE'],
      required: true
    }
  },
  
  // Card Identification Information
  identificationInfo: {
    cardIssuedDate: {
      type: Date,
      required: true
    },
    cardExpiryDate: {
      type: Date,
      required: true,
      validate: {
        validator: function(v) {
          return v > this.identificationInfo.cardIssuedDate
        },
        message: 'Expiry date must be after issue date'
      }
    },
    issuingCenter: {
      type: String,
      required: true,
      maxlength: 100
    },
    cardStatus: { 
      type: String, 
      enum: ['ACTIVE', 'EXPIRED', 'SUSPENDED', 'REVOKED', 'REPLACED'],
      default: 'ACTIVE'
    },
    cardVersion: {
      type: String,
      default: 'v2.0'
    }
  },
  
  // Contact Information
  contactInfo: {
    address: {
      houseNumber: {
        type: String,
        maxlength: 20
      },
      streetName: {
        type: String,
        maxlength: 100
      },
      area: {
        type: String,
        maxlength: 100
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
      }
    },
    phoneNumber: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^\+233\d{9}$/.test(v)
        },
        message: 'Phone number must be in format +233XXXXXXXXX'
      }
    },
    emergencyContact: {
      name: {
        type: String,
        maxlength: 100
      },
      relationship: {
        type: String,
        maxlength: 50
      },
      phone: {
        type: String,
        validate: {
          validator: function(v) {
            return !v || /^\+233\d{9}$/.test(v)
          },
          message: 'Emergency contact phone must be in format +233XXXXXXXXX'
        }
      }
    }
  },
  
  // Biometric Information (Simulated/Hashed)
  biometricInfo: {
    fingerprintHash: {
      type: String,
      required: true
    },
    photoHash: {
      type: String,
      required: true
    },
    signatureHash: {
      type: String,
      required: true
    },
    biometricTemplate: {
      type: String, // Base64 encoded template
      required: true
    }
  },
  
  // Verification Flags and Audit Trail
  verificationFlags: {
    isVerified: {
      type: Boolean,
      default: true
    },
    lastVerificationDate: {
      type: Date,
      default: Date.now
    },
    verificationMethod: {
      type: String,
      enum: ['MANUAL', 'BIOMETRIC', 'OCR', 'API'],
      default: 'MANUAL'
    },
    verificationNotes: {
      type: String,
      maxlength: 500
    },
    verificationCount: {
      type: Number,
      default: 0
    }
  },
  
  // Security and Audit
  securityInfo: {
    accessHistory: [{
      accessDate: Date,
      accessMethod: String,
      ipAddress: String,
      userAgent: String
    }],
    flaggedForReview: {
      type: Boolean,
      default: false
    },
    reviewReason: {
      type: String,
      maxlength: 200
    },
    lastSecurityCheck: {
      type: Date,
      default: Date.now
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
  collection: 'ghanacardregistry'
})

// Indexes for efficient queries (cardNumber unique index is automatically created by schema)
GhanaCardRegistrySchema.index({ 'personalInfo.fullName': 1 })
GhanaCardRegistrySchema.index({ 'personalInfo.dateOfBirth': 1 })
GhanaCardRegistrySchema.index({ 'identificationInfo.cardStatus': 1 })
GhanaCardRegistrySchema.index({ 'identificationInfo.cardExpiryDate': 1 })
GhanaCardRegistrySchema.index({ 'contactInfo.address.region': 1 })
GhanaCardRegistrySchema.index({ 'verificationFlags.isVerified': 1 })

// Static method to validate Ghana Card format and check digit
GhanaCardRegistrySchema.statics.validateCardNumber = function(cardNumber) {
  // Format check
  const formatRegex = /^GHA-\d{9}-\d$/
  if (!formatRegex.test(cardNumber)) {
    return { isValid: false, error: 'Invalid format. Expected: GHA-NNNNNNNNN-N' }
  }

  // Extract components
  const [, mainNumber, checkDigit] = cardNumber.match(/^GHA-(\d{9})-(\d)$/)
  
  // Calculate check digit using Luhn-like algorithm
  const calculatedCheckDigit = this.calculateCheckDigit(mainNumber)
  
  if (parseInt(checkDigit) !== calculatedCheckDigit) {
    return { isValid: false, error: 'Invalid check digit' }
  }

  return { isValid: true }
}

// Static method to calculate check digit
GhanaCardRegistrySchema.statics.calculateCheckDigit = function(numberString) {
  let sum = 0
  for (let i = 0; i < numberString.length; i++) {
    let digit = parseInt(numberString[i])
    if (i % 2 === 0) digit *= 2
    if (digit > 9) digit = Math.floor(digit / 10) + (digit % 10)
    sum += digit
  }
  return (10 - (sum % 10)) % 10
}

// Static method to find active Ghana Card
GhanaCardRegistrySchema.statics.findActiveCard = async function(cardNumber) {
  try {
    const cardRecord = await this.findOne({
      cardNumber,
      'identificationInfo.cardStatus': 'ACTIVE',
      'identificationInfo.cardExpiryDate': { $gte: new Date() }
    })
    
    return cardRecord
  } catch (error) {
    console.error('Error finding active Ghana Card:', error)
    throw error
  }
}

// Instance method to check if card is expired
GhanaCardRegistrySchema.methods.isExpired = function() {
  return this.identificationInfo.cardExpiryDate < new Date()
}

// Instance method to check if card is active
GhanaCardRegistrySchema.methods.isActive = function() {
  return this.identificationInfo.cardStatus === 'ACTIVE' && !this.isExpired()
}

// Instance method to get card data for verification response
GhanaCardRegistrySchema.methods.getCardData = function() {
  return {
    cardNumber: this.cardNumber,
    fullName: this.personalInfo.fullName,
    firstName: this.personalInfo.firstName,
    middleName: this.personalInfo.middleName,
    lastName: this.personalInfo.lastName,
    dateOfBirth: this.personalInfo.dateOfBirth,
    placeOfBirth: this.personalInfo.placeOfBirth,
    gender: this.personalInfo.gender,
    nationality: this.personalInfo.nationality,
    address: this.contactInfo.address,
    phoneNumber: this.contactInfo.phoneNumber,
    issuedDate: this.identificationInfo.cardIssuedDate,
    expiryDate: this.identificationInfo.cardExpiryDate,
    issuingCenter: this.identificationInfo.issuingCenter,
    status: this.identificationInfo.cardStatus,
    isVerified: this.verificationFlags.isVerified,
    lastVerificationDate: this.verificationFlags.lastVerificationDate
  }
}

// Instance method to record verification attempt
GhanaCardRegistrySchema.methods.recordVerification = async function(method = 'MANUAL', notes = '') {
  this.verificationFlags.lastVerificationDate = new Date()
  this.verificationFlags.verificationMethod = method
  this.verificationFlags.verificationNotes = notes
  this.verificationFlags.verificationCount += 1
  
  await this.save()
}

// Instance method to record access
GhanaCardRegistrySchema.methods.recordAccess = async function(accessData = {}) {
  this.securityInfo.accessHistory.push({
    accessDate: new Date(),
    accessMethod: accessData.method || 'API',
    ipAddress: accessData.ipAddress || 'Unknown',
    userAgent: accessData.userAgent || 'Unknown'
  })
  
  // Keep only last 50 access records
  if (this.securityInfo.accessHistory.length > 50) {
    this.securityInfo.accessHistory = this.securityInfo.accessHistory.slice(-50)
  }
  
  this.securityInfo.lastSecurityCheck = new Date()
  await this.save()
}

// Pre-save middleware to compute full name and update timestamps
GhanaCardRegistrySchema.pre('save', function(next) {
  // Compute full name
  const names = [this.personalInfo.firstName, this.personalInfo.middleName, this.personalInfo.lastName]
    .filter(name => name && name.trim().length > 0)
    .map(name => name.toUpperCase())
  
  this.personalInfo.fullName = names.join(' ')
  
  // Update timestamp
  this.updatedAt = new Date()
  
  next()
})

module.exports = mongoose.models.GhanaCardRegistry || mongoose.model('GhanaCardRegistry', GhanaCardRegistrySchema)
