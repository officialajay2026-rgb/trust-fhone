import express from 'express';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const notifications = await Notification.find({ user: req.user._id })
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });
    const total = await Notification.countDocuments({ user: req.user._id });

    res.json({ success: true, notifications, unreadCount, total });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Error fetching notifications', error: error.message });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error', error: error.message });
  }
});

// @route   PUT /api/notifications/read/:id
// @desc    Mark notification as read
// @access  Private
router.put('/read/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error', error: error.message });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error', error: error.message });
  }
});

export default router;
