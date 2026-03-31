import express from 'express';
import Listing from '../models/Listing.js';
import User from '../models/User.js';
import FraudReport from '../models/FraudReport.js';
import { protect, authorize } from '../middleware/auth.js';
import { fraudDetection } from '../middleware/fraudDetection.js';

const router = express.Router();

// @route   POST /api/listings
// @desc    Create a new listing (with fraud detection)
// @access  Private (Seller)
router.post('/', protect, authorize('seller', 'admin'), fraudDetection, async (req, res) => {
  try {
    const { brand, model, price, condition, imei, hasBox, hasOriginalParts, description, images, billImage } = req.body;

    // Validation
    if (!brand || !model || !price || !condition || !imei || !images || !billImage) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Create listing
    const listing = await Listing.create({
      seller: req.user._id,
      brand,
      model,
      price,
      condition,
      imei,
      hasBox: hasBox || false,
      hasOriginalParts: hasOriginalParts || false,
      description: description || '',
      images,
      billImage,
      fraudScore: req.fraudReport.fraudScore,
      fraudReasons: req.fraudReport.fraudReasons,
      aiVerification: {
        imeiValid: req.fraudReport.checks.imeiValidation.passed,
        billVerified: req.fraudReport.checks.billOCR.passed,
        imageQuality: req.fraudReport.checks.imageQuality.passed ? 'good' : 'poor',
        duplicateCheck: !req.fraudReport.checks.duplicateDetection.passed
      },
      status: 'pending'
    });

    // Create fraud report
    await FraudReport.create({
      listing: listing._id,
      seller: req.user._id,
      fraudScore: req.fraudReport.fraudScore,
      fraudReasons: req.fraudReport.fraudReasons,
      checks: req.fraudReport.checks,
      autoRejected: req.fraudReport.autoRejected
    });

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalListings: 1 }
    });

    res.status(201).json({
      success: true,
      message: 'Listing created successfully and sent for review',
      listing,
      fraudScore: req.fraudReport.fraudScore,
      status: 'pending'
    });
  } catch (error) {
    console.error('Create listing error:', error);
    
    // Handle duplicate IMEI error
    if (error.code === 11000 && error.keyPattern && error.keyPattern.imei) {
      return res.status(400).json({
        success: false,
        message: 'A listing with this IMEI already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating listing',
      error: error.message
    });
  }
});

// @route   GET /api/listings
// @desc    Get all approved listings (for buyers)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { brand, minPrice, maxPrice, condition, search, sort = '-createdAt', page = 1, limit = 12 } = req.query;

    // Build filter
    const filter = { status: 'approved' };

    if (brand) {
      filter.brand = { $regex: brand, $options: 'i' };
    }

    if (condition) {
      filter.condition = condition;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (search) {
      filter.$or = [
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    const listings = await Listing.find(filter)
      .populate('seller', 'name email verificationBadge avatar')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Listing.countDocuments(filter);

    res.json({
      success: true,
      count: listings.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      listings
    });
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching listings',
      error: error.message
    });
  }
});

// @route   GET /api/listings/:id
// @desc    Get single listing by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'name email verificationBadge avatar phone totalListings createdAt');

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Only show approved listings to non-admin users
    if (listing.status !== 'approved' && (!req.user || req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Listing not available'
      });
    }

    // Increment views
    listing.views += 1;
    await listing.save();

    res.json({
      success: true,
      listing
    });
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching listing',
      error: error.message
    });
  }
});

// @route   GET /api/listings/my/listings
// @desc    Get logged-in user's listings
// @access  Private
router.get('/my/listings', protect, async (req, res) => {
  try {
    const listings = await Listing.find({ seller: req.user._id })
      .sort('-createdAt')
      .populate('seller', 'name email');

    res.json({
      success: true,
      count: listings.length,
      listings
    });
  } catch (error) {
    console.error('Get my listings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your listings',
      error: error.message
    });
  }
});

// @route   DELETE /api/listings/:id
// @desc    Delete a listing
// @access  Private (Owner or Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Check ownership or admin
    if (listing.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this listing'
      });
    }

    await listing.deleteOne();

    res.json({
      success: true,
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting listing',
      error: error.message
    });
  }
});

export default router;
