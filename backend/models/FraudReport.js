import mongoose from 'mongoose';

const fraudReportSchema = new mongoose.Schema({
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fraudScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  fraudReasons: [{
    type: String
  }],
  checks: {
    imeiValidation: {
      passed: Boolean,
      message: String
    },
    duplicateDetection: {
      passed: Boolean,
      message: String
    },
    imageQuality: {
      passed: Boolean,
      message: String
    },
    billOCR: {
      passed: Boolean,
      message: String,
      extractedData: Object
    },
    userBehavior: {
      passed: Boolean,
      message: String
    }
  },
  autoRejected: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

fraudReportSchema.index({ listing: 1 });
fraudReportSchema.index({ fraudScore: 1 });

const FraudReport = mongoose.model('FraudReport', fraudReportSchema);

export default FraudReport;
