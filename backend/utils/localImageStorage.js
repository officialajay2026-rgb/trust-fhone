import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log('✅ Local uploads directory created');
}

// Save base64 image locally (fallback when Cloudinary not available)
export const saveImageLocally = (base64Data, folder = 'products') => {
  try {
    // Remove data:image/jpeg;base64, prefix if present
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
    
    // Generate unique filename
    const filename = `${folder}_${crypto.randomBytes(16).toString('hex')}.jpg`;
    const filepath = path.join(UPLOAD_DIR, filename);
    
    // Save file
    fs.writeFileSync(filepath, base64Image, 'base64');
    
    // Return URL that can be served
    const publicId = `uploads/${filename}`;
    const url = `/uploads/${filename}`;
    
    return {
      url,
      publicId,
      local: true
    };
  } catch (error) {
    console.error('Error saving image locally:', error);
    throw error;
  }
};

// Serve uploaded images
export const getImagePath = (filename) => {
  return path.join(UPLOAD_DIR, filename);
};
