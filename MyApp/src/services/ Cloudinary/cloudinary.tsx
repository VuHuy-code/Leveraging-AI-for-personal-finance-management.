// src/services/cloudinary.ts
import axios from 'axios';

const CLOUD_NAME = 'your_cloud_name';  // Thay 'your_cloud_name' bằng Cloud Name của bạn
const UPLOAD_PRESET = 'your_upload_preset'; // Thay 'your_upload_preset' bằng Upload Preset của bạn

const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      formData
    );
    return response.data.secure_url; // Trả về URL của ảnh
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export { uploadImage };
