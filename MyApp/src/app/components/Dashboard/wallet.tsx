import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useWalletContext } from '../../contexts/WalletContext'; // Ensure correct path
import { useAuth } from '../../hooks/useAuth';

interface WalletProps {
  isVisible: boolean;
  onClose: () => void;
  onWalletCreate: (totalBalance: number) => void;
  currentBalance: number;
}

const formatNumber = (text: string): string => {
  const cleanNumber = text.replace(/\D/g, '');
  return cleanNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const WalletScreen: React.FC<WalletProps> = ({
  isVisible,
  onClose,
  onWalletCreate,
  currentBalance,
}) => {
  const { user } = useAuth();
  const { wallet, createWallet, updateWallet, deleteWallet } = useWalletContext();
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletBalance, setNewWalletBalance] = useState('');
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editWalletName, setEditWalletName] = useState('');
  const [editWalletBalance, setEditWalletBalance] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  // Animation refs
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCreateWallet = async () => {
    if (newWalletName && newWalletBalance && user) {
      setIsLoading(true);
      try {
        const initialBalance = parseInt(newWalletBalance.replace(/,/g, ''), 10);
        await createWallet(newWalletName, initialBalance);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setNewWalletName('');
        setNewWalletBalance('');
        setCreateModalVisible(false);
        onWalletCreate(initialBalance); // Update parent with new balance
      } catch (error) {
        console.error('Error creating wallet:', error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEditWallet = async () => {
    if (!wallet || !editWalletName || !editWalletBalance) return;

    setIsLoading(true);
    try {
      const newBalance = parseInt(editWalletBalance.replace(/,/g, ''), 10);
      await updateWallet({
        name: editWalletName,
        balance: newBalance,
        currentBalance: newBalance,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Update the current balance in parent component
      onWalletCreate(newBalance);

      setEditModalVisible(false);
      setEditWalletName('');
      setEditWalletBalance('');
    } catch (error) {
      console.error('Error updating wallet:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWallet = async () => {
    setIsDeleteLoading(true);
    try {
      await deleteWallet();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onWalletCreate(0); // Update the parent with 0 balance

      // Close the edit modal but don't close the wallet screen
      setEditModalVisible(false);

      // Optional: Show feedback that wallet was deleted successfully
      // You could add a temporary success message or animation here

    } catch (error) {
      console.error('Error deleting wallet:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsDeleteLoading(false);
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="formSheet">
      <LinearGradient colors={['#09090b', '#13131f']} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {!wallet ? "Create Your Wallet" : "My Wallet"}
          </Text>
        </View>

        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Initial Balance</Text>
          <View style={styles.balanceWrapper}>
            <Text style={styles.balanceAmount}>
              {wallet?.balance.toLocaleString('vi-VN') || '0'}
            </Text>
            <Text style={styles.currencyLabel}>VNĐ</Text>
          </View>
          {wallet && (
            <View style={styles.balanceInfo}>
              <Ionicons name="information-circle-outline" size={16} color="#9ca3af" />
              <Text style={styles.balanceInfoText}>This is your starting balance</Text>
            </View>
          )}
        </View>

        <ScrollView style={styles.walletsList}>
          {!wallet ? (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="wallet-outline" size={60} color="#251a6a" />
              </View>
              <Text style={styles.emptyStateText}>
                Welcome to Personal Finance Tracker
              </Text>
              <Text style={styles.emptyStateSubText}>
                Create your first wallet to start managing your finances
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.walletItem, styles.walletItemActive]}
              onPress={() => {
                setEditWalletName(wallet.name);
                setEditWalletBalance(wallet.balance.toString());
                setEditModalVisible(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <View style={styles.walletItemContent}>
                <View style={styles.walletIcon}>
                  <Ionicons name="wallet" size={24} color="#fff" />
                </View>
                <View style={styles.walletInfo}>
                  <Text style={styles.walletName}>{wallet.name}</Text>
                  <Text style={styles.walletBalance}>
                    {wallet.balance.toLocaleString('vi-VN')} VNĐ
                  </Text>
                </View>
                <View style={styles.walletActions}>
                  <TouchableOpacity
                    style={styles.editIconButton}
                    onPress={() => {
                      setEditWalletName(wallet.name);
                      setEditWalletBalance(wallet.balance.toString());
                      setEditModalVisible(true);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Ionicons name="pencil" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Show Create New Wallet button if no wallet exists */}
        {!wallet && (
          <TouchableOpacity
            onPress={() => {
              animatePress();
              setCreateModalVisible(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
            activeOpacity={0.8}
            style={styles.setupWalletButtonContainer}
          >
            <Animated.View
              style={[
                styles.setupWalletButton,
                { transform: [{ scale: scaleAnim }] }
              ]}
            >
              <View style={styles.addButtonIcon}>
                <Ionicons name="add" size={24} color="#fff" />
              </View>
              <Text style={styles.addButtonText}>Create Your Wallet</Text>
            </Animated.View>
          </TouchableOpacity>
        )}

        {/* Create Wallet Modal */}
        <Modal visible={isCreateModalVisible} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create New Wallet</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setCreateModalVisible(false)}
                >
                  <Ionicons name="close" size={22} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Wallet Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter wallet name"
                  placeholderTextColor="#666"
                  value={newWalletName}
                  onChangeText={setNewWalletName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Initial Balance</Text>
                <View style={styles.amountInputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    value={newWalletBalance}
                    onChangeText={(text) => setNewWalletBalance(formatNumber(text))}
                  />
                  <Text style={styles.currencyIndicator}>VNĐ</Text>
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setCreateModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.createButton]}
                  onPress={handleCreateWallet}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={18} color="#fff" style={styles.buttonIcon} />
                      <Text style={styles.buttonText}>Create</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Wallet Modal */}
        <Modal visible={isEditModalVisible} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Wallet</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Ionicons name="close" size={22} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Wallet Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter wallet name"
                  placeholderTextColor="#666"
                  value={editWalletName}
                  onChangeText={setEditWalletName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Initial Balance</Text>
                <View style={styles.amountInputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    value={editWalletBalance}
                    onChangeText={(text) => setEditWalletBalance(formatNumber(text))}
                  />
                  <Text style={styles.currencyIndicator}>VNĐ</Text>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.deleteWalletButton}
                  onPress={handleDeleteWallet}
                  disabled={isDeleteLoading}
                >
                  {isDeleteLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={18} color="#fff" style={styles.buttonIcon} />
                      <Text style={styles.deleteButtonText}>Delete Wallet</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setEditModalVisible(false);
                  }}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.createButton]}
                  onPress={handleEditWallet}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Save</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#0f0f13',
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 16,
    letterSpacing: 0.5,
  },
  balanceSection: {
    alignItems: 'center',
    padding: 28,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#0f0f13',
  },
  balanceLabel: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  balanceWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 38,
    fontWeight: '700',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  currencyLabel: {
    color: '#9ca3af',
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 8,
    marginTop: 8,
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  balanceInfoText: {
    color: '#9ca3af',
    fontSize: 12,
    marginLeft: 5,
  },
  walletsList: {
    flex: 1,
    padding: 16,
  },
  walletItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  walletItemActive: {
    borderColor: '#251a6a',
    backgroundColor: 'rgba(37, 26, 106, 0.2)',
  },
  walletItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  walletIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#251a6a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#251a6a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  walletBalance: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 4,
  },
  walletCurrentBalance: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 2,
  },
  walletActions: {
    marginLeft: 'auto',
  },
  editIconButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#251a6a',
    padding: 16,
    borderRadius: 16,
    margin: 16,
    shadowColor: '#251a6a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#1c1c1e',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#2c2c2e',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  amountInputWrapper: {
    position: 'relative',
  },
  currencyIndicator: {
    position: 'absolute',
    right: 16,
    top: 16,
    color: '#9ca3af',
    fontSize: 16,
  },
  modalActions: {
    marginTop: 8,
    marginBottom: 20,
  },
  deleteWalletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 10,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#3a3a3c',
  },
  createButton: {
    backgroundColor: '#251a6a',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 6,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(37, 26, 106, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyStateText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyStateSubText: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    maxWidth: '80%',
    lineHeight: 22,
  },
  activeWalletItem: {
    borderColor: '#251a6a',
    borderWidth: 2,
  },
  activeIndicator: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '88%',
    borderRadius: 12,
    marginVertical: 0,
  },
  editButton: {
    backgroundColor: '#251a6a',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '88%',
    borderRadius: 12,
    marginVertical: 0,
    marginRight: 8,
  },
  setupWalletButtonContainer: {
    padding: 16,
    marginBottom: 24,
  },
  setupWalletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6c63ff',
    padding: 18,
    borderRadius: 16,
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default WalletScreen;
