import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, BackHandler } from 'react-native'; // Thêm BackHandler
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router'; // Dùng useRouter để điều hướng
import { useAuth } from '../../hooks/useAuth'; // Import useAuth để sử dụng logout

const Dashboard: React.FC = () => {
  const router = useRouter(); // Khai báo router để điều hướng
  const { logout } = useAuth(); // Lấy hàm logout từ useAuth

  useEffect(() => {
    // Xử lý sự kiện nhấn nút back
    const handleBackPress = () => {
      // Không cho phép quay lại từ Dashboard
      return true;
    };

    // Thêm listener khi component mount
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    // Dọn dẹp khi component unmount
    return () => backHandler.remove();
  }, []);

  // Hàm xử lý đăng xuất
  const handleLogout = async () => {
    try {
      await logout(); // Gọi hàm logout từ useAuth
      router.replace('/'); // Quay về trang Home khi đăng xuất
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
        colors={['#4facfe', '#00f2fe']}
        style={styles.gradientBackground}
      >
        <Text style={styles.welcomeText}>Welcome to Dashboard!</Text>
        <Text style={styles.subText}>You are now logged in.</Text>

        {/* Nút Log Out */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  gradientBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subText: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
  },
  logoutButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
    backgroundColor: '#ff4d4d', // Màu đỏ cho nút Log Out
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Dashboard;
