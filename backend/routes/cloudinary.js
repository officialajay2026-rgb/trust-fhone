import express from 'express';
import cloudinary from '../config/cloudinary.js';
import { protect } from '../middleware/auth.js';
import { saveImageLocally } from '../utils/localImageStorage.js';

const router = express.Router();

// Check if Cloudinary is properly configured
const isCloudinaryConfigured = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  
  return cloudName && 
         apiKey && 
         apiSecret &&
         cloudName !== 'demo' &&
         cloudName !== 'your_cloud_name_here' &&
         !cloudName.includes('placeholder');
};

// @route   POST /api/cloudinary/upload
// @desc    Upload image (Cloudinary or Local fallback)
// @access  Private
router.post('/upload', protect, async (req, res) => {
  try {
    const { image, folder = 'trustfhone' } = req.body;
    
    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'No image provided'
      });
    }

    // Check if Cloudinary is configured
    if (isCloudinaryConfigured()) {
      // Try Cloudinary upload
      try {
        const result = await cloudinary.uploader.upload(image, {
          folder: folder,
          resource_type: 'image'
        });
        
        return res.json({
          success: true,
          url: result.secure_url,
          publicId: result.public_id,
          storage: 'cloudinary'
        });
      } catch (cloudinaryError) {
        console.error('Cloudinary upload failed, using local storage:', cloudinaryError.message);
      }
    }
    
    // Fallback to local storage
    const localResult = saveImageLocally(image, folder);
    
    res.json({
      success: true,
      url: `${process.env.BACKEND_URL || 'http://localhost:8001'}${localResult.url}`,
      publicId: localResult.publicId,
      storage: 'local',
      message: 'Using local storage. Add Cloudinary credentials for cloud storage.'
    });
    
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error.message
    });
  }
});

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
