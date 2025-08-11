import mongoose from 'mongoose'

// Schema for push notification subscriptions
const pushSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true
  },
  subscription: {
    endpoint: {
      type: String,
      required: true
    },
    keys: {
      p256dh: {
        type: String,
        required: true
      },
      auth: {
        type: String,
        required: true
      }
    }
  },
  userAgent: {
    type: String,
    default: null
  },
  deviceType: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet'],
    default: 'desktop'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Schema for in-app notifications
const notificationSchema = new mongoose.Schema({
  // Recipient information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true
  },
  
  // Notification content
  type: {
    type: String,
    required: true,
    enum: [
      'new_message',
      'booking_update',
      'booking_confirmed',
      'booking_cancelled',
      'payment_received',
      'payment_required',
      'service_completed',
      'review_request',
      'new_booking_request',
      'system_announcement'
    ],
    index: true
  },
  title: {
    type: String,
    required: true,
    maxLength: 100
  },
  body: {
    type: String,
    required: true,
    maxLength: 500
  },
  
  // Notification metadata
  data: {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null
    },
    messageId: {
      type: String,
      default: null
    },
    actionUrl: {
      type: String,
      default: null
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    },
    category: {
      type: String,
      enum: ['chat', 'booking', 'payment', 'system'],
      default: 'system'
    }
  },
  
  // Notification status
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date,
    default: null
  },
  
  // Delivery tracking
  isPushSent: {
    type: Boolean,
    default: false
  },
  pushSentAt: {
    type: Date,
    default: null
  },
  pushDelivered: {
    type: Boolean,
    default: false
  },
  pushDeliveredAt: {
    type: Date,
    default: null
  },
  
  // Expiry
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes for better query performance
notificationSchema.index({ userId: 1, createdAt: -1 })
notificationSchema.index({ userId: 1, isRead: 1 })
notificationSchema.index({ type: 1, createdAt: -1 })
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

pushSubscriptionSchema.index({ userId: 1, isActive: 1 })
pushSubscriptionSchema.index({ 'subscription.endpoint': 1 }, { unique: true })

// Virtual fields
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date()
})

notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date()
  const diff = now - this.createdAt
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
})

// Instance methods for notifications
notificationSchema.methods.markAsRead = function() {
  this.isRead = true
  this.readAt = new Date()
  return this.save()
}

notificationSchema.methods.markPushSent = function() {
  this.isPushSent = true
  this.pushSentAt = new Date()
  return this.save()
}

notificationSchema.methods.markPushDelivered = function() {
  this.pushDelivered = true
  this.pushDeliveredAt = new Date()
  return this.save()
}

// Static methods for notifications
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    userId,
    isRead: false,
    expiresAt: { $gt: new Date() }
  })
}

notificationSchema.statics.getUserNotifications = function(userId, limit = 20, page = 1) {
  const skip = (page - 1) * limit
  return this.find({
    userId,
    expiresAt: { $gt: new Date() }
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip)
  .exec()
}

notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    {
      userId,
      isRead: false,
      expiresAt: { $gt: new Date() }
    },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    }
  )
}

notificationSchema.statics.createNotification = function(notificationData) {
  const notification = new this(notificationData)
  return notification.save()
}

// Instance methods for push subscriptions
pushSubscriptionSchema.methods.updateLastUsed = function() {
  this.lastUsed = new Date()
  return this.save()
}

pushSubscriptionSchema.methods.deactivate = function() {
  this.isActive = false
  return this.save()
}

// Static methods for push subscriptions
pushSubscriptionSchema.statics.getUserActiveSubscriptions = function(userId) {
  return this.find({
    userId,
    isActive: true
  }).exec()
}

pushSubscriptionSchema.statics.cleanupInactiveSubscriptions = function(daysInactive = 30) {
  const cutoffDate = new Date(Date.now() - daysInactive * 24 * 60 * 60 * 1000)
  return this.deleteMany({
    lastUsed: { $lt: cutoffDate },
    isActive: false
  })
}

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  // Auto-set actionUrl based on notification type
  if (!this.data.actionUrl) {
    switch (this.type) {
      case 'new_message':
        if (this.data.bookingId) {
          this.data.actionUrl = `/booking/${this.data.bookingId}/chat`
        }
        break
      case 'booking_update':
      case 'booking_confirmed':
      case 'booking_cancelled':
        if (this.data.bookingId) {
          this.data.actionUrl = `/booking/${this.data.bookingId}`
        }
        break
      case 'payment_received':
      case 'payment_required':
        if (this.data.bookingId) {
          this.data.actionUrl = `/booking/${this.data.bookingId}/payment`
        }
        break
      default:
        this.data.actionUrl = '/notifications'
    }
  }
  
  next()
})

// Export models
const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema)
const PushSubscription = mongoose.models.PushSubscription || mongoose.model('PushSubscription', pushSubscriptionSchema)

export { Notification, PushSubscription }
export default Notification