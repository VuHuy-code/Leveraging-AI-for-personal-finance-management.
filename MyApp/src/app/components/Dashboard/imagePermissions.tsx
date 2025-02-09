import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking, Platform } from 'react-native';

export const requestImagePermissions = async () => {
  if (Platform.OS !== 'web') {
    const { status: existingStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();
    
    if (existingStatus !== 'granted') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to update your profile picture.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Settings',
              onPress: () => Platform.OS === 'ios' ? Linking.openURL('app-settings:') : Linking.openSettings()
            }
          ]
        );
        return false;
      }
    }
    return true;
  }
  return true;
};

export const validateImageSize = (fileSize: number) => {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  return fileSize <= MAX_FILE_SIZE;
};

export const pickImage = async () => {
  const hasPermission = await requestImagePermissions();
  if (!hasPermission) return null;

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0];
    }
    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    Alert.alert('Error', 'Failed to select image');
    return null;
  }
};

export const uploadImage = async (imageUri: string) => {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'profile.jpg'
    } as any);
    formData.append('upload_preset', 'Finance AI');

    const response = await fetch(
      'https://api.cloudinary.com/v1_1/dafkqfkof/image/upload',
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Upload failed');
    
    return data.secure_url;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};