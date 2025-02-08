import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

const storage = getStorage();

export const uploadImageToStorage = async (uri: string, path: string): Promise<string> => {
  try {
    // Lấy blob từ URI
    const response = await fetch(uri);
    const blob = await response.blob();

    // Tạo reference và upload
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);

    // Lấy download URL sau khi upload thành công
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const getDownloadUrl = async (path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw error;
  }
};