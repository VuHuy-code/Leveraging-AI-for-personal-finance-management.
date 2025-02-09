import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { pickImage, uploadImage } from './imagePermissions';

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
  const [isEditingName, setIsEditingName] = useState(false);

  const handleAvatarUpload = async () => {
    try {
      setIsUploading(true);
      const result = await pickImage();
      
      if (result?.uri) {
        const uploadedUrl = await uploadImage(result.uri);
        if (uploadedUrl) {
          setNewAvatar(uploadedUrl);
          await handleProfileUpdate(newName, uploadedUrl);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile picture');
    } finally {
      setIsUploading(false);
    }
  };

  const handleProfileUpdate = async (name: string, avatarUrl: string) => {
    try {
      await onUpdateProfile(
        name.trim() || userData?.name,
        avatarUrl.trim() || userData?.avatarUrl
      );
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Settings</Text>
      
      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={handleAvatarUpload} disabled={isUploading}>
          <Image 
            source={{ uri: newAvatar || 'https://via.placeholder.com/150' }} 
            style={styles.avatar} 
          />
          <View style={styles.editAvatarOverlay}>
            {isUploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Feather name="camera" size={24} color="#fff" />
            )}
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.nameContainer}>
        {!isEditingName ? (
          <TouchableOpacity 
            style={styles.nameDisplay}
            onPress={() => setIsEditingName(true)}
          >
            <Text style={styles.nameText}>{newName}</Text>
            <Feather name="edit-2" size={20} color="#4facfe" />
          </TouchableOpacity>
        ) : (
          <TextInput
            style={styles.input}
            value={newName}
            onChangeText={setNewName}
            onBlur={() => setIsEditingName(false)}
            placeholder="Enter your name"
          />
        )}
        </View>
  
        <TouchableOpacity 
          style={styles.updateButton} 
          onPress={() => handleProfileUpdate(newName, newAvatar)}
          disabled={isUploading}
        >
          <LinearGradient 
            colors={['#4facfe', '#00f2fe']} 
            style={styles.gradientButton}
          >
            <Text style={styles.updateButtonText}>
              {isUploading ? 'Updating...' : 'Update Profile'}
            </Text>
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
      flex: 1,
      padding: 20,
      backgroundColor: '#f9f9f9',
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
      padding: 8,
    },
    nameContainer: {
      marginBottom: 20,
      alignItems: 'center',
    },
    nameDisplay: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    nameText: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    input: {
      width: '100%',
      padding: 12,
      borderRadius: 8,
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#ddd',
    },
    updateButton: {
      marginBottom: 15,
    },
    gradientButton: {
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
    },
    updateButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    logoutButton: {
      backgroundColor: '#ff6666',
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
    },
    logoutButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });
  
  export default DashboardSettings;