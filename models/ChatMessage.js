import mongoose from 'mongoose'

const chatMessageSchema = new mongoose.Schema({
  // Message identification
  messageId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Booking reference - Updated to support both ObjectId and String for direct messages
  bookingId: {
    type: mongoose.Schema.Types.Mixed, // Changed from ObjectId to Mixed
    required: true,
    index: true
  },
  
  // Sender information
  senderId: {
    type: String, // Changed to String to support email-based IDs
    required: true,
    index: true
  },
  senderName: {
    type: String,
    required: true
  },
  senderRole: {
    type: String,
    required: true,
    enum: ['customer', 'provider', 'admin']
  },
  
  // Message content
  message: {
    type: String,
    required: true,
    maxLength: 2000
  },
  messageType: {
    type: String,
    required: true,
    enum: ['text', 'image', 'document', 'audio', 'system'],
    default: 'text'
  },
  
  // File attachments (for images/documents)
  fileUrl: {
    type: String,
    default: null
  },
  fileName: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
    default: null
  },
  fileType: {
    type: String,
    default: null
  },
  
  // Message status
  isRead: {
    type: Boolean,
    default: false
  },
  readBy: [{
    userId: {
      type: String, // Changed to String to support email-based IDs
      required: true
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Message metadata
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  
  // Reply/thread functionality
  replyToMessageId: {
    type: String,
    default: null,
    ref: 'ChatMessage'
  },
  
  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes for better query performance
chatMessageSchema.index({ bookingId: 1, timestamp: -1 })
chatMessageSchema.index({ senderId: 1, timestamp: -1 })
chatMessageSchema.index({ messageType: 1, timestamp: -1 })
chatMessageSchema.index({ isRead: 1, bookingId: 1 })

// Virtual fields
chatMessageSchema.virtual('isFile').get(function() {
  return this.messageType !== 'text' && this.messageType !== 'system'
})

chatMessageSchema.virtual('timeSincePosted').get(function() {
  return Date.now() - this.timestamp.getTime()
})

// Instance methods
chatMessageSchema.methods.markAsRead = function(userId) {
  if (!this.readBy.some(read => read.userId.toString() === userId.toString())) {
    this.readBy.push({
      userId: userId,
      readAt: new Date()
    })
    this.isRead = true
  }
  return this.save()
}

chatMessageSchema.methods.markAsDeleted = function() {
  this.isDeleted = true
  this.deletedAt = new Date()
  this.message = '[Message deleted]'
  this.fileUrl = null
  this.fileName = null
  return this.save()
}

// Static methods
chatMessageSchema.statics.getBookingChatHistory = function(bookingId, limit = 50, page = 1) {
  const skip = (page - 1) * limit
  return this.find({ 
    bookingId,
    isDeleted: false
  })
  .sort({ timestamp: -1 })
  .limit(limit)
  .skip(skip)
  .exec() // Removed populate since senderId is now a string
}

chatMessageSchema.statics.getUnreadMessagesCount = function(bookingId, userId) {
  return this.countDocuments({
    bookingId,
    senderId: { $ne: userId },
    isRead: false,
    isDeleted: false
  })
}

chatMessageSchema.statics.markAllAsRead = function(bookingId, userId) {
  return this.updateMany(
    {
      bookingId,
      senderId: { $ne: userId },
      isRead: false,
      isDeleted: false
    },
    {
      $push: {
        readBy: {
          userId: userId,
          readAt: new Date()
        }
      },
      $set: { isRead: true }
    }
  )
}

// Pre-save middleware
chatMessageSchema.pre('save', function(next) {
  // Auto-generate messageId if not provided
  if (!this.messageId) {
    this.messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  // Validate file fields
  if (this.messageType !== 'text' && this.messageType !== 'system') {
    if (!this.fileUrl) {
      return next(new Error('File URL is required for non-text messages'))
    }
  }
  
  next()
})

// Export model
const ChatMessage = mongoose.models.ChatMessage || mongoose.model('ChatMessage', chatMessageSchema)

export default ChatMessage 