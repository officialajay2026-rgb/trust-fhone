import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  condition: {
    type: String,
    enum: ['New', 'Like New', 'Used'],
    required: true
  },
  imei: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    length: 15
  },
  hasBox: {
    type: Boolean,
    default: false
  },
  hasOriginalParts: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    }
  }],
  billImage: {
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  fraudScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  fraudReasons: [{
    type: String
  }],
  aiVerification: {
    imeiValid: { type: Boolean, default: false },
    billVerified: { type: Boolean, default: false },
    imageQuality: { type: String, default: 'pending' },
    duplicateCheck: { type: Boolean, default: false }
  },
  views: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  adminNotes: {
    type: String,
    default: ''
  },
  rejectionReason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for faster queries
listingSchema.index({ status: 1 });
listingSchema.index({ seller: 1 });
listingSchema.index({ imei: 1 }, { unique: true });
listingSchema.index({ brand: 1, model: 1 });
listingSchema.index({ price: 1 });
listingSchema.index({ fraudScore: 1 });

const Listing = mongoose.model('Listing', listingSchema);

export default Listing;
