import express from 'express';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Listing from '../models/Listing.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { sendNotification } from '../utils/notifications.js';

const router = express.Router();

// @route   POST /api/chat/start
// @desc    Start or get conversation for a listing
// @access  Private
router.post('/start', protect, async (req, res) => {
  try {
    const { listingId } = req.body;
    const buyerId = req.user._id;

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    const sellerId = listing.seller;

    if (buyerId.toString() === sellerId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot chat with yourself' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [buyerId, sellerId] },
      listing: listingId
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [buyerId, sellerId],
        listing: listingId,
        unreadCount: new Map([[sellerId.toString(), 0], [buyerId.toString(), 0]])
      });
    }

    await conversation.populate([
      { path: 'participants', select: 'name avatar role' },
      { path: 'listing', select: 'brand model price images' }
    ]);

    res.json({ success: true, conversation });
  } catch (error) {
    console.error('Start chat error:', error);
    res.status(500).json({ success: false, message: 'Error starting chat', error: error.message });
  }
});

// @route   GET /api/chat/conversations
// @desc    Get all conversations for logged-in user
// @access  Private
router.get('/conversations', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
      .populate('participants', 'name avatar role')
      .populate('listing', 'brand model price images')
      .sort('-updatedAt');

    res.json({ success: true, conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, message: 'Error fetching conversations', error: error.message });
  }
});

// @route   GET /api/chat/messages/:conversationId
// @desc    Get messages for a conversation
// @access  Private
router.get('/messages/:conversationId', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Check if user is a participant
    if (!conversation.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const messages = await Message.find({ conversation: req.params.conversationId })
      .populate('sender', 'name avatar role')
      .sort('createdAt');

    // Mark unread messages as read
    await Message.updateMany(
      { conversation: req.params.conversationId, sender: { $ne: req.user._id }, read: false },
      { read: true }
    );

    // Reset unread count
    conversation.unreadCount.set(req.user._id.toString(), 0);
    await conversation.save();

    res.json({ success: true, messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Error fetching messages', error: error.message });
  }
});

// @route   POST /api/chat/send
// @desc    Send a message
// @access  Private
router.post('/send', protect, async (req, res) => {
  try {
    const { conversationId, text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ success: false, message: 'Message text required' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (!conversation.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      text: text.trim()
    });

    await message.populate('sender', 'name avatar role');

    // Update conversation
    conversation.lastMessage = {
      text: text.trim(),
      sender: req.user._id,
      createdAt: new Date()
    };

    // Increment unread count for other participant
    const otherParticipant = conversation.participants.find(
      p => p.toString() !== req.user._id.toString()
    );
    const currentCount = conversation.unreadCount.get(otherParticipant.toString()) || 0;
    conversation.unreadCount.set(otherParticipant.toString(), currentCount + 1);
    await conversation.save();

    // Send notification to other participant
    const sender = await User.findById(req.user._id).select('name');
    await sendNotification({
      userId: otherParticipant,
      type: 'new_message',
      title: 'New Message',
      message: `${sender.name}: ${text.trim().substring(0, 100)}`,
      link: `/chat`
    });

    res.json({ success: true, message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Error sending message', error: error.message });
  }
});

// @route   GET /api/chat/unread-count
// @desc    Get total unread message count
// @access  Private
router.get('/unread-count', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id });
    let total = 0;
    conversations.forEach(c => {
      total += c.unreadCount.get(req.user._id.toString()) || 0;
    });
    res.json({ success: true, count: total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error', error: error.message });
  }
});

export default router;
