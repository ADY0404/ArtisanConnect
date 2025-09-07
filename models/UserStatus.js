import mongoose from 'mongoose'

const UserStatusSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userEmail: {
    type: String,
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    enum: ['customer', 'provider', 'admin'],
    default: 'customer',
    index: true
  },
  isOnline: {
    type: Boolean,
    default: false,
    index: true
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  socketId: {
    type: String,
    default: null
  },
  deviceInfo: {
    type: Object,
    default: {}
  },
  notificationTokens: [{
    type: String,
    token: String,
    platform: {
      type: String,
      enum: ['web', 'ios', 'android']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  preferences: {
    receiveOfflineNotifications: {
      type: Boolean,
      default: true
    },
    notificationSound: {
      type: Boolean,
      default: true
    },
    emailNotifications: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
})

// Indexes for efficient queries
UserStatusSchema.index({ userRole: 1, isOnline: 1 })
UserStatusSchema.index({ lastSeen: 1 })
UserStatusSchema.index({ isOnline: 1, userRole: 1 })

export default mongoose.models.UserStatus || mongoose.model('UserStatus', UserStatusSchema) 