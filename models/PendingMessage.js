import mongoose from 'mongoose'

const PendingMessageSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true,
    unique: true
  },
  bookingId: {
    type: String,
    required: true,
    index: true
  },
  recipientId: {
    type: String,
    required: true,
    index: true
  },
  message: {
    type: Object,
    required: true
  },
  delivered: {
    type: Boolean,
    default: false,
    index: true
  },
  deliveredAt: {
    type: Date,
    default: null
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  notificationSentAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
}, {
  timestamps: true
})

// Index for efficient queries
PendingMessageSchema.index({ recipientId: 1, delivered: 1, bookingId: 1 })
PendingMessageSchema.index({ delivered: 1, createdAt: 1 })
PendingMessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // TTL index

export default mongoose.models.PendingMessage || mongoose.model('PendingMessage', PendingMessageSchema) 