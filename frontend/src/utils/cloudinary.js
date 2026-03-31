import api from './api';

// Convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

// Upload single image to backend (Cloudinary or Local)
export const uploadToCloudinary = async (file, folder = 'trustfhone/products') => {
  try {
    // Convert to base64
    const base64 = await fileToBase64(file);
    
    // Upload to backend
    const { data } = await api.post('/api/cloudinary/upload', {
      image: base64,
      folder: folder
    });
    
    return {
      url: data.url,
      publicId: data.publicId,
      storage: data.storage
    };
  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
};

// Upload multiple images
export const uploadMultipleToCloudinary = async (files, folder = 'trustfhone/products') => {
  const uploadPromises = Array.from(files).map(file => uploadToCloudinary(file, folder));
  return Promise.all(uploadPromises);
};