import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  lastMessage: {
    text: { type: String, default: '' },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  }
}, { timestamps: true });

conversationSchema.index({ participants: 1 });
conversationSchema.index({ listing: 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
