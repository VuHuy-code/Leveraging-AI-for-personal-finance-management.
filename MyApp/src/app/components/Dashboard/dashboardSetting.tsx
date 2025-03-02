import React, { useState, useRef, useEffect, useCallback } from "react";
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
  Platform,
  Animated,
  Dimensions,
  StatusBar,
  Pressable,
} from "react-native";
import {
  Ionicons,
  Feather,
  MaterialIcons,
  FontAwesome5,
  AntDesign,
} from "@expo/vector-icons";
import { pickImage, uploadImage } from "./imagePermissions";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useWalletContext } from "../../contexts/WalletContext";
import WalletScreen from "./wallet";

const { width, height } = Dimensions.get("window");

interface SettingsProps {
  userData: {
    name: string;
    avatarUrl: string;
    uid: string; // Make sure uid is included
  };
  onUpdateProfile: (name: string, avatarUrl: string) => Promise<void>;
  onLogout: () => void;
}

const DashboardSettings: React.FC<SettingsProps> = ({
  userData,
  onUpdateProfile,
  onLogout,
}) => {
  const [newName, setNewName] = useState(userData?.name || "");
  const [newAvatar, setNewAvatar] = useState(userData?.avatarUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isWalletModalVisible, setWalletModalVisible] = useState(false);
  const { wallet, refreshWallet } = useWalletContext();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const avatarScale = useRef(new Animated.Value(1)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleAvatarUpload = async () => {
    // Avatar press animation
    Animated.sequence([
      Animated.timing(avatarScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(avatarScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

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
      Alert.alert("Error", "Failed to update profile picture");
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
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const handleWalletCreate = useCallback(
    (newBalance: number) => {
      // Refresh wallet data after creation/update
      if (refreshWallet) refreshWallet();
    },
    [refreshWallet]
  );

  const showLogoutModal = () => {
    setShowLogoutConfirm(true);
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(modalScale, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideLogoutModal = () => {
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowLogoutConfirm(false);
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <LinearGradient
          colors={["#150f3c", "#09090b"]}
          style={styles.headerWrapper}
        >
          <View style={styles.headerTop}>
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>Settings</Text>
            </View>

            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => {}}
            >
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          </View>

          {/* Profile section directly on the background */}
          <View style={styles.profileSection}>
            <Animated.View
              style={[
                styles.avatarContainer,
                { transform: [{ scale: avatarScale }] },
              ]}
            >
              <TouchableOpacity
                onPress={handleAvatarUpload}
                disabled={isUploading}
                activeOpacity={0.8}
              >
                <Image
                  source={{
                    uri: newAvatar || "https://via.placeholder.com/150",
                  }}
                  style={styles.avatar}
                />
                <View style={styles.editAvatarOverlay}>
                  {isUploading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Ionicons name="camera" size={18} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.nameContainer}>
              {!isEditingName ? (
                <TouchableOpacity
                  style={styles.nameDisplay}
                  onPress={() => setIsEditingName(true)}
                >
                  <Text style={styles.nameText}>{newName}</Text>
                  <View style={styles.editNameButton}>
                    <Ionicons name="pencil" size={14} color="#fff" />
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.editNameContainer}>
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
                    onSubmitEditing={async () => {
                      setIsEditingName(false);
                      if (newName !== userData?.name) {
                        await handleProfileUpdate(newName, newAvatar);
                      }
                    }}
                    placeholder="Enter your name"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    autoFocus
                    returnKeyType="done"
                    selectionColor="#6c63ff"
                  />
                  <TouchableOpacity
                    style={styles.saveNameButton}
                    onPress={async () => {
                      setIsEditingName(false);
                      if (newName !== userData?.name) {
                        await handleProfileUpdate(newName, newAvatar);
                      }
                    }}
                  >
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        <Animated.View
          style={[
            styles.settingsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Account Settings</Text>

          <View style={styles.settingCard}>
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons name="person-outline" size={20} color="#6c63ff" />
              </View>
              <Text style={styles.settingText}>Personal Information</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color="rgba(255,255,255,0.5)"
              />
            </TouchableOpacity>

            {/* Wallet item moved here - right after Personal Information */}
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => setWalletModalVisible(true)}
            >
              <View style={styles.settingIcon}>
                <Ionicons name="wallet-outline" size={20} color="#6c63ff" />
              </View>
              <Text style={styles.settingText}>My Wallet</Text>
              <View style={styles.settingValueContainer}>
                {wallet ? (
                  <View style={styles.walletInfoContainer}>
                    <Text style={styles.settingValue}>
                    {wallet.balance.toLocaleString("vi-VN")} VNĐ
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.settingValue}>Not set up</Text>
                )}
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="rgba(255,255,255,0.5)"
                />
              </View>
            </TouchableOpacity>

            {/* Other items remain in the same order */}
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color="#6c63ff"
                />
              </View>
              <Text style={styles.settingText}>Notifications</Text>
              <View style={styles.toggleContainer}>
                <View style={styles.toggleActive}>
                  <View style={styles.toggleCircle} />
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#6c63ff"
                />
              </View>
              <Text style={styles.settingText}>Privacy & Security</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color="rgba(255,255,255,0.5)"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons name="moon-outline" size={20} color="#6c63ff" />
              </View>
              <Text style={styles.settingText}>Appearance</Text>
              <Text style={styles.settingValue}>Dark</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Support</Text>

          <View style={styles.settingCard}>
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons
                  name="help-circle-outline"
                  size={20}
                  color="#6c63ff"
                />
              </View>
              <Text style={styles.settingText}>Help & Support</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color="rgba(255,255,255,0.5)"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#6c63ff"
                />
              </View>
              <Text style={styles.settingText}>About</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color="rgba(255,255,255,0.5)"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={showLogoutModal}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackground} onPress={hideLogoutModal}>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  opacity: modalOpacity,
                  transform: [{ scale: modalScale }],
                },
              ]}
            >
              <Pressable style={styles.modalContent}>
                <View style={styles.modalIconContainer}>
                  <AntDesign name="logout" size={32} color="#ef4444" />
                </View>
                <Text style={styles.modalTitle}>Logout</Text>
                <Text style={styles.modalMessage}>
                  Are you sure you want to logout from your account?
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={hideLogoutModal}
                  >
                    <Text style={styles.modalCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalLogoutButton}
                    onPress={() => {
                      hideLogoutModal();
                      setTimeout(onLogout, 300);
                    }}
                  >
                    <Text style={styles.modalLogoutButtonText}>Logout</Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Animated.View>
          </Pressable>
        </View>
      )}

      <WalletScreen
        isVisible={isWalletModalVisible}
        onClose={() => setWalletModalVisible(false)}
        onWalletCreate={handleWalletCreate}
        currentBalance={wallet?.currentBalance || 0}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090b",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerWrapper: {
    position: "relative",
    width: "100%",
    paddingBottom: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 45 : 60,
    zIndex: 2,
  },
  titleContainer: {
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
    borderWidth: 1,
    borderColor: "#0a0a1a",
  },
  profileSection: {
    alignItems: "center",
    marginTop: 20,
    paddingBottom: 20,
  },
  avatarContainer: {
    marginBottom: 16,
    shadowColor: "#6c63ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: "#6c63ff",
  },
  editAvatarOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#6c63ff",
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#0a0a1a",
  },
  nameContainer: {
    alignItems: "center",
    width: "100%",
  },
  nameDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nameText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  editNameButton: {
    backgroundColor: "rgba(108, 99, 255, 0.3)",
    borderRadius: 12,
    padding: 4,
    marginLeft: 8,
  },
  editNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "80%",
    marginBottom: 8,
  },
  input: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    marginRight: 8,
  },
  saveNameButton: {
    backgroundColor: "#6c63ff",
    borderRadius: 12,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  emailText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    marginTop: 4,
  },
  settingsSection: {
    padding: 20,
    marginTop: -20, // Overlap with the header gradient
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 16,
    marginLeft: 4,
  },
  settingCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(108, 99, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  settingValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingValue: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    marginRight: 8,
  },
  toggleContainer: {
    width: 46,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(108, 99, 255, 0.2)",
    padding: 2,
  },
  toggleActive: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    backgroundColor: "#6c63ff",
    alignItems: "flex-end",
  },
  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    marginTop: 8,
  },
  logoutButtonText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackground: {
    flex: 1,
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    maxWidth: 340,
    borderRadius: 24,
    overflow: "hidden",
  },
  modalContent: {
    backgroundColor: "#1c1c1e",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
  },
  modalCancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  modalLogoutButton: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#ef4444",
    alignItems: "center",
  },
  modalLogoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  walletInfoContainer: {
    alignItems: "flex-end",
    marginRight: 8,
  },
  walletInitialText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    marginTop: 2,
  },
});

export default DashboardSettings;
