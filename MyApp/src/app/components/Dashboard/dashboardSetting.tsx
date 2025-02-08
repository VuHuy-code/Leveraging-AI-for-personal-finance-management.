import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

interface SettingsProps {
  userData: {
    name: string;
    avatarUrl: string;
  };
  onUpdateProfile: (name: string, avatarUrl: string) => Promise<void>;
  onLogout: () => void;
}

const DashboardSettings: React.FC<SettingsProps> = ({ userData, onUpdateProfile, onLogout }) => {
  const [newName, setNewName] = useState(userData?.name || '');
  const [newAvatar, setNewAvatar] = useState(userData?.avatarUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false); // Trạng thái để chỉnh sửa tên

  const handleProfileUpdate = async () => {
    if (!newName.trim() && !newAvatar.trim()) {
      Alert.alert('Invalid Input', 'Please provide a name or an avatar to update.');
      return;
    }

    const updateName = newName.trim() || userData?.name;
    const updateAvatar = newAvatar.trim() || userData?.avatarUrl;

    try {
      await onUpdateProfile(updateName, updateAvatar);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Profile update failed:', error);
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  const handleAvatarUpload = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted) {
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (pickerResult.canceled) {
        Alert.alert('No image selected', 'You have not selected any image.');
        return;
      }

      setIsUploading(true);
      const imageUri = pickerResult.assets[0].uri;

      if (imageUri) {
        setNewAvatar(imageUri);

        const response = await fetch(imageUri);
        const blob = await response.blob();

        const data = new FormData();
        data.append('file', blob, 'avatar.jpg');
        data.append('upload_preset', 'Finance AI');

        const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/dafkqfkof/image/upload`, {
          method: 'POST',
          body: data,
        });

        const result = await uploadResponse.json();
        if (result.secure_url) {
          setNewAvatar(result.secure_url);
        } else {
          Alert.alert('Error', 'Failed to upload image');
        }
      } else {
        Alert.alert('Error', 'No URI found for the image');
      }
    } else {
      Alert.alert('Permission Denied', 'You need to grant permission to access your photo library');
    }
    setIsUploading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Settings</Text>
      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={handleAvatarUpload} disabled={isUploading}>
          <Image source={{ uri: newAvatar }} style={styles.avatar} />
          <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.editAvatarOverlay}>
            <Feather name="camera" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Tên và chỉnh sửa tên */}
      <View style={styles.nameContainer}>
        {!isEditingName ? (
          <View style={styles.nameDisplay}>
            <Text style={styles.nameText}>{newName}</Text>
            <TouchableOpacity onPress={() => setIsEditingName(true)}>
              <Feather name="edit" size={24} color="#4facfe" />
            </TouchableOpacity>
          </View>
        ) : (
          <TextInput
            style={styles.input}
            placeholder="Enter new name"
            value={newName}
            onChangeText={setNewName}
            onBlur={() => setIsEditingName(false)} // Khi người dùng rời khỏi ô nhập tên
          />
        )}
      </View>

      <TouchableOpacity style={styles.updateButton} onPress={handleProfileUpdate} disabled={isUploading}>
        <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.gradientButton}>
          <Text style={styles.updateButtonText}>Update Profile</Text>
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ddd',
  },
  editAvatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 5,
  },
  nameContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  nameDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  input: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    borderColor: '#cccccc',
    borderWidth: 1,
    marginBottom: 15,
  },
  gradientButton: {
    padding: 15,
    borderRadius: 8,
  },
  updateButton: {
    marginBottom: 15,
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#ff6666',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DashboardSettings;
