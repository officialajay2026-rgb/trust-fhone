import express from 'express';
import cloudinary from '../config/cloudinary.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/cloudinary/signature
// @desc    Generate signature for Cloudinary upload
// @access  Private
router.get('/signature', protect, async (req, res) => {
  try {
    const { folder = 'trustfhone', resource_type = 'image' } = req.query;

    // Allowed folders
    const ALLOWED_FOLDERS = ['trustfhone/products', 'trustfhone/bills', 'trustfhone/avatars', 'trustfhone'];
    
    if (!folder.startsWith('trustfhone')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid folder path'
      });
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    
    const params = {
      timestamp: timestamp,
      folder: folder,
      resource_type: resource_type
    };

    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET || 'your_api_secret_here'
    );

    res.json({
      success: true,
      signature,
      timestamp,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name_here',
      api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key_here',
      folder,
      resource_type
    });
  } catch (error) {
    console.error('Cloudinary signature error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating Cloudinary signature',
      error: error.message
    });
  }
});

// @route   POST /api/cloudinary/delete
// @desc    Delete image from Cloudinary
// @access  Private
router.post('/delete', protect, async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required'
      });
    }

    const result = await cloudinary.uploader.destroy(publicId, { invalidate: true });

    res.json({
      success: true,
      message: 'Image deleted successfully',
      result
    });
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: error.message
    });
  }
});

export default router;
