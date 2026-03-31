import mongoose from 'mongoose';

const adminLogSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['approve_listing', 'reject_listing', 'ban_user', 'unban_user', 'verify_seller', 'delete_listing']
  },
  targetType: {
    type: String,
    required: true,
    enum: ['listing', 'user']
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

adminLogSchema.index({ admin: 1 });
adminLogSchema.index({ action: 1 });
adminLogSchema.index({ createdAt: -1 });

const AdminLog = mongoose.model('AdminLog', adminLogSchema);

export default AdminLog;
