import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

  const handleCreateWallet = async () => {
    if (newWalletName && newWalletBalance && user) {
      const initialBalance = parseInt(newWalletBalance.replace(/,/g, ''), 10);
      await createWallet(newWalletName, initialBalance);
      setNewWalletName('');
      setNewWalletBalance('');
      setCreateModalVisible(false);
      onWalletCreate(initialBalance); // Update parent with new balance
    }
  };

  const handleEditWallet = async () => {
    if (!wallet || !editWalletName || !editWalletBalance) return;

    try {
      const newBalance = parseInt(editWalletBalance.replace(/,/g, ''), 10);
      await updateWallet({
        name: editWalletName,
        balance: newBalance,
        currentBalance: newBalance,
      });

      // Update the current balance in parent component
      onWalletCreate(newBalance);

      setEditModalVisible(false);
      setEditWalletName('');
      setEditWalletBalance('');
    } catch (error) {
      console.error('Error updating wallet:', error);
    }
  };

  const handleDeleteWallet = async () => {
    try {
      await deleteWallet();
      onWalletCreate(0); // Reset balance in parent component
      onClose();
    } catch (error) {
      console.error('Error deleting wallet:', error);
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="formSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Wallet</Text>
        </View>

        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Initial Balance</Text>
          <Text style={styles.balanceAmount}>
            {wallet?.balance.toLocaleString('vi-VN') || '0'} VNĐ
          </Text>
        </View>

        <ScrollView style={styles.walletsList}>
          {!wallet ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                You haven't created a wallet yet.
              </Text>
              <Text style={styles.emptyStateSubText}>
                Tap the button below to create your wallet.
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.walletItem}
              onPress={() => {
                setEditWalletName(wallet.name);
                setEditWalletBalance(wallet.balance.toString());
                setEditModalVisible(true);
              }}
            >
              <View style={styles.walletIcon}>
                <Ionicons name="wallet" size={24} color="#fff" />
              </View>
              <View style={styles.walletInfo}>
                <Text style={styles.walletName}>{wallet.name}</Text>
                <Text style={styles.walletBalance}>
                  Initial Balance: {wallet.balance.toLocaleString('vi-VN')} VNĐ
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Show Create New Wallet button if no wallet exists */}
        {!wallet && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setCreateModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Create New Wallet</Text>
          </TouchableOpacity>
        )}

        {/* Create Wallet Modal */}
        <Modal visible={isCreateModalVisible} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create New Wallet</Text>

              <TextInput
                style={styles.input}
                placeholder="Wallet Name"
                placeholderTextColor="#666"
                value={newWalletName}
                onChangeText={setNewWalletName}
              />

              <TextInput
                style={styles.input}
                placeholder="Initial Balance"
                placeholderTextColor="#666"
                keyboardType="numeric"
                value={newWalletBalance}
                onChangeText={(text) => setNewWalletBalance(formatNumber(text))}
              />

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
                >
                  <Text style={styles.buttonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Wallet Modal */}
        <Modal visible={isEditModalVisible} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Wallet</Text>

              <TextInput
                style={styles.input}
                placeholder="Wallet Name"
                placeholderTextColor="#666"
                value={editWalletName}
                onChangeText={setEditWalletName}
              />

              <TextInput
                style={styles.input}
                placeholder="Initial Balance"
                placeholderTextColor="#666"
                keyboardType="numeric"
                value={editWalletBalance}
                onChangeText={(text) => setEditWalletBalance(formatNumber(text))}
              />

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
                >
                  <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
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
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 16,
  },
  balanceSection: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  balanceLabel: {
    color: '#9ca3af',
    fontSize: 16,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '600',
    marginTop: 8,
  },
  walletsList: {
    flex: 1,
    padding: 16,
  },
  walletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    marginBottom: 12,
  },
  walletIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#150f3c',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#150f3c',
    padding: 16,
    borderRadius: 12,
    margin: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 20,
    width: '90%',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#2c2c2e',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#3a3a3c',
  },
  createButton: {
    backgroundColor: '#150f3c',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  activeWalletItem: {
    borderColor: '#150f3c',
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
    borderRadius: 12, // This will round all corners
    marginVertical: 0,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyStateSubText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  editButton: {
    backgroundColor: '#1e174f', // Indigo color for edit
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '88%',
    borderRadius: 12,
    marginVertical: 0,
    marginRight: 8,
  },
});

export default WalletScreen;