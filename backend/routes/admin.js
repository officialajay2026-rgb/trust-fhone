import express from 'express';
import Listing from '../models/Listing.js';
import User from '../models/User.js';
import FraudReport from '../models/FraudReport.js';
import AdminLog from '../models/AdminLog.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Private (Admin)
router.get('/dashboard', protect, authorize('admin'), async (req, res) => {
  try {
    const totalListings = await Listing.countDocuments();
    const pendingListings = await Listing.countDocuments({ status: 'pending' });
    const approvedListings = await Listing.countDocuments({ status: 'approved' });
    const rejectedListings = await Listing.countDocuments({ status: 'rejected' });
    
    const totalUsers = await User.countDocuments();
    const totalBuyers = await User.countDocuments({ role: 'buyer' });
    const totalSellers = await User.countDocuments({ role: 'seller' });
    const bannedUsers = await User.countDocuments({ isBanned: true });

    const highFraudListings = await Listing.countDocuments({ fraudScore: { $gte: 50 } });
    const avgFraudScore = await Listing.aggregate([
      { $group: { _id: null, avgScore: { $avg: '$fraudScore' } } }
    ]);

    res.json({
      success: true,
      stats: {
        listings: {
          total: totalListings,
          pending: pendingListings,
          approved: approvedListings,
          rejected: rejectedListings,
          highFraud: highFraudListings
        },
        users: {
          total: totalUsers,
          buyers: totalBuyers,
          sellers: totalSellers,
          banned: bannedUsers
        },
        fraud: {
          avgScore: avgFraudScore[0]?.avgScore || 0
        }
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
});

// @route   GET /api/admin/listings
// @desc    Get all listings for admin review
// @access  Private (Admin)
router.get('/listings', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, sort = '-createdAt', page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const listings = await Listing.find(filter)
      .populate('seller', 'name email verificationBadge riskScore totalListings rejectedListings')
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
    console.error('Get admin listings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching listings',
      error: error.message
    });
  }
});

// @route   GET /api/admin/listings/:id
// @desc    Get listing details with fraud report
// @access  Private (Admin)
router.get('/listings/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'name email verificationBadge riskScore totalListings rejectedListings createdAt');

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    const fraudReport = await FraudReport.findOne({ listing: listing._id });

    res.json({
      success: true,
      listing,
      fraudReport
    });
  } catch (error) {
    console.error('Get admin listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching listing',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/approve/:id
// @desc    Approve a listing
// @access  Private (Admin)
router.put('/approve/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { adminNotes } = req.body;

    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    listing.status = 'approved';
    listing.adminNotes = adminNotes || '';
    await listing.save();

    // Create admin log
    await AdminLog.create({
      admin: req.user._id,
      action: 'approve_listing',
      targetType: 'listing',
      targetId: listing._id,
      notes: adminNotes || 'Listing approved',
      metadata: {
        listingBrand: listing.brand,
        listingModel: listing.model,
        fraudScore: listing.fraudScore
      }
    });

    res.json({
      success: true,
      message: 'Listing approved successfully',
      listing
    });
  } catch (error) {
    console.error('Approve listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving listing',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/reject/:id
// @desc    Reject a listing
// @access  Private (Admin)
router.put('/reject/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { rejectionReason, adminNotes } = req.body;

    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    listing.status = 'rejected';
    listing.rejectionReason = rejectionReason || 'Did not meet verification standards';
    listing.adminNotes = adminNotes || '';
    await listing.save();

    // Update seller's rejected count and risk score
    const seller = await User.findById(listing.seller);
    if (seller) {
      seller.rejectedListings += 1;
      seller.riskScore = Math.min(seller.riskScore + 10, 100);
      await seller.save();
    }

    // Create admin log
    await AdminLog.create({
      admin: req.user._id,
      action: 'reject_listing',
      targetType: 'listing',
      targetId: listing._id,
      notes: rejectionReason || 'Listing rejected',
      metadata: {
        listingBrand: listing.brand,
        listingModel: listing.model,
        fraudScore: listing.fraudScore
      }
    });

    res.json({
      success: true,
      message: 'Listing rejected',
      listing
    });
  } catch (error) {
    console.error('Reject listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting listing',
      error: error.message
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { role, isBanned, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (isBanned !== undefined) filter.isBanned = isBanned === 'true';

    const skip = (Number(page) - 1) * Number(limit);

    const users = await User.find(filter)
      .select('-password')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      count: users.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/users/:id/ban
// @desc    Ban or unban a user
// @access  Private (Admin)
router.put('/users/:id/ban', protect, authorize('admin'), async (req, res) => {
  try {
    const { isBanned, reason } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isBanned = isBanned;
    await user.save();

    // Create admin log
    await AdminLog.create({
      admin: req.user._id,
      action: isBanned ? 'ban_user' : 'unban_user',
      targetType: 'user',
      targetId: user._id,
      notes: reason || `User ${isBanned ? 'banned' : 'unbanned'}`,
      metadata: {
        userName: user.name,
        userEmail: user.email
      }
    });

    res.json({
      success: true,
      message: `User ${isBanned ? 'banned' : 'unbanned'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isBanned: user.isBanned
      }
    });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user ban status',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/users/:id/verify
// @desc    Verify a seller
// @access  Private (Admin)
router.put('/users/:id/verify', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.verificationBadge = true;
    user.isVerified = true;
    await user.save();

    // Create admin log
    await AdminLog.create({
      admin: req.user._id,
      action: 'verify_seller',
      targetType: 'user',
      targetId: user._id,
      notes: 'Seller verified',
      metadata: {
        userName: user.name,
        userEmail: user.email
      }
    });

    res.json({
      success: true,
      message: 'Seller verified successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        verificationBadge: user.verificationBadge
      }
    });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying user',
      error: error.message
    });
  }
});

export default router;
