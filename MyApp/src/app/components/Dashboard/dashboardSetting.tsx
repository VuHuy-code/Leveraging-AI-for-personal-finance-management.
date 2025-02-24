import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
  Image,
  ScrollView,
  Platform
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
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
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>Settings</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => {}}
            >
              <Ionicons name="notifications" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.profileSection}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={handleAvatarUpload} 
            disabled={isUploading}
          >
            <Image 
              source={{ uri: newAvatar || 'https://via.placeholder.com/150' }} 
              style={styles.avatar} 
            />
            <View style={styles.editAvatarOverlay}>
              {isUploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons name="camera" size={20} color="#fff" />
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.nameContainer}>
            {!isEditingName ? (
              <TouchableOpacity 
                style={styles.nameDisplay}
                onPress={() => setIsEditingName(true)}
              >
                <Text style={styles.nameText}>{newName}</Text>
                <Ionicons name="pencil" size={16} color="#4f46e5" />
              </TouchableOpacity>
            ) : (
              <TextInput
                style={styles.input}
                value={newName}
                onChangeText={setNewName}
                onBlur={async () => {
                  setIsEditingName(false);
                  if (newName !== userData?.name) {
                    await handleProfileUpdate(newName, newAvatar);
                  }
                }}
                onEndEditing={async () => {
                  setIsEditingName(false);
                  if (newName !== userData?.name) {
                    await handleProfileUpdate(newName, newAvatar);
                  }
                }}
                placeholder="Enter your name"
                placeholderTextColor="#666"
              />
            )}
          </View>
        </View>
      </View>

      <View style={styles.settingsSection}>
        <View style={styles.settingCard}>
          <Text style={styles.settingTitle}>Account Settings</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="notifications-outline" size={20} color="#4f46e5" />
            </View>
            <Text style={styles.settingText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="lock-closed-outline" size={20} color="#4f46e5" />
            </View>
            <Text style={styles.settingText}>Privacy</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="help-circle-outline" size={20} color="#4f46e5" />
            </View>
            <Text style={styles.settingText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  headerWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1.5,
  },
  header: {
    width: '100%',
  },
  headerBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 35 : 55,
  },
  titleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
  },
  notificationButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 5,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#4f46e5',
  },
  editAvatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4f46e5',
    borderRadius: 15,
    padding: 8,
  },
  nameContainer: {
    alignItems: 'center',
  },
  nameDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  input: {
    minWidth: 200,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    textAlign: 'center',
  },
  settingsSection: {
    padding: 20,
    marginTop: -20,
  },
  settingCard: {
    backgroundColor: 'rgba(23, 23, 23, 0.5)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9ca3af',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    gap: 8,
  },
  logoutButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DashboardSettings;