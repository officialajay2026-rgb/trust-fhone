import express from 'express';
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
});

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;

    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
});

// @route   POST /api/user/wishlist/:listingId
// @desc    Add to wishlist
// @access  Private
router.post('/wishlist/:listingId', protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.listingId);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    const user = await User.findById(req.user._id);

    // Check if already in wishlist
    const isInWishlist = user.wishlist.some(id => id.toString() === listing._id.toString());

    if (isInWishlist) {
      return res.status(400).json({
        success: false,
        message: 'Listing already in wishlist'
      });
    }

    user.wishlist.push(listing._id);
    await user.save();

    res.json({
      success: true,
      message: 'Added to wishlist',
      wishlist: user.wishlist
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding to wishlist',
      error: error.message
    });
  }
});

// @route   DELETE /api/user/wishlist/:listingId
// @desc    Remove from wishlist
// @access  Private
router.delete('/wishlist/:listingId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    user.wishlist = user.wishlist.filter(id => id.toString() !== req.params.listingId);
    await user.save();

    res.json({
      success: true,
      message: 'Removed from wishlist',
      wishlist: user.wishlist
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing from wishlist',
      error: error.message
    });
  }
});

// @route   GET /api/user/wishlist
// @desc    Get user wishlist
// @access  Private
router.get('/wishlist', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'wishlist',
      populate: {
        path: 'seller',
        select: 'name email verificationBadge'
      }
    });

    res.json({
      success: true,
      count: user.wishlist.length,
      wishlist: user.wishlist
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching wishlist',
      error: error.message
    });
  }
});

// @route   POST /api/user/recently-viewed/:listingId
// @desc    Add to recently viewed
// @access  Private
router.post('/recently-viewed/:listingId', protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.listingId);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    const user = await User.findById(req.user._id);

    // Remove if already exists
    user.recentlyViewed = user.recentlyViewed.filter(
      item => item.listingId.toString() !== listing._id.toString()
    );

    // Add to beginning
    user.recentlyViewed.unshift({
      listingId: listing._id,
      viewedAt: new Date()
    });

    // Keep only last 20
    user.recentlyViewed = user.recentlyViewed.slice(0, 20);

    await user.save();

    res.json({
      success: true,
      message: 'Added to recently viewed'
    });
  } catch (error) {
    console.error('Add to recently viewed error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding to recently viewed',
      error: error.message
    });
  }
});

// @route   GET /api/user/recently-viewed
// @desc    Get recently viewed listings
// @access  Private
router.get('/recently-viewed', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'recentlyViewed.listingId',
      populate: {
        path: 'seller',
        select: 'name email verificationBadge'
      }
    });

    const recentlyViewed = user.recentlyViewed
      .filter(item => item.listingId)
      .map(item => ({
        listing: item.listingId,
        viewedAt: item.viewedAt
      }));

    res.json({
      success: true,
      count: recentlyViewed.length,
      recentlyViewed
    });
  } catch (error) {
    console.error('Get recently viewed error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recently viewed',
      error: error.message
    });
  }
});

export default router;
