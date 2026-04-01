import express from 'express';
import Review from '../models/Review.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { sendNotification } from '../utils/notifications.js';

const router = express.Router();

// @route   POST /api/reviews
// @desc    Create a review for a seller
// @access  Private (Buyer)
router.post('/', protect, async (req, res) => {
  try {
    const { sellerId, listingId, rating, comment } = req.body;

    if (!sellerId || !rating) {
      return res.status(400).json({ success: false, message: 'Seller ID and rating required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    if (req.user._id.toString() === sellerId) {
      return res.status(400).json({ success: false, message: 'Cannot review yourself' });
    }

    // Check if already reviewed
    const existing = await Review.findOne({ reviewer: req.user._id, seller: sellerId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already reviewed this seller' });
    }

    const review = await Review.create({
      reviewer: req.user._id,
      seller: sellerId,
      listing: listingId || undefined,
      rating,
      comment: comment || ''
    });

    await review.populate('reviewer', 'name avatar');

    // Notify seller
    const reviewer = await User.findById(req.user._id).select('name');
    await sendNotification({
      userId: sellerId,
      type: 'new_review',
      title: 'New Review Received',
      message: `${reviewer.name} gave you ${rating} stars: "${comment || 'No comment'}"`,
      link: '/profile'
    });

    res.status(201).json({ success: true, review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You already reviewed this seller' });
    }
    console.error('Create review error:', error);
    res.status(500).json({ success: false, message: 'Error creating review', error: error.message });
  }
});

// @route   GET /api/reviews/seller/:sellerId
// @desc    Get all reviews for a seller
// @access  Public
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const reviews = await Review.find({ seller: req.params.sellerId })
      .populate('reviewer', 'name avatar')
      .sort('-createdAt');

    const totalRatings = reviews.length;
    const avgRating = totalRatings > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(1)
      : 0;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => { distribution[r.rating]++; });

    res.json({
      success: true,
      reviews,
      stats: { totalRatings, avgRating: parseFloat(avgRating), distribution }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ success: false, message: 'Error fetching reviews', error: error.message });
  }
});

export default router;
