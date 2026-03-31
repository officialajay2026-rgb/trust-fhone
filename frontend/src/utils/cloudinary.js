import api from './api';

export const uploadToCloudinary = async (file, folder = 'trustfhone/products') => {
  try {
    // Get signature from backend
    const { data } = await api.get(`/api/cloudinary/signature?folder=${folder}&resource_type=image`);
    
    const { signature, timestamp, cloud_name, api_key } = data;
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', api_key);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('folder', folder);
    
    // Upload to Cloudinary
    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );
    
    const result = await uploadResponse.json();
    
    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

export const uploadMultipleToCloudinary = async (files, folder = 'trustfhone/products') => {
  const uploadPromises = Array.from(files).map(file => uploadToCloudinary(file, folder));
  return Promise.all(uploadPromises);
};