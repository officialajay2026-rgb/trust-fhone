import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['listing_approved', 'listing_rejected', 'new_message', 'new_review', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  link: {
    type: String,
    default: ''
  },
  read: {
    type: Boolean,
    default: false
  },
  emailSent: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
