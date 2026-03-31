import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.node' });

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name_here',
  api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key_here',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret_here',
  secure: true
});

export default cloudinary;
