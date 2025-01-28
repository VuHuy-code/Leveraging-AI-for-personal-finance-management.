import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { Link, router } from 'expo-router'; // Import Link và router từ expo-router
import { useAuth } from './hooks/useAuth'; // Import useAuth hook

const { width } = Dimensions.get('window'); // Lấy kích thước màn hình

const Home: React.FC = () => {
  const { user, loading } = useAuth(); // Sử dụng useAuth để lấy trạng thái đăng nhập

  // Xử lý nút "Back" khi ở trang Home
  useEffect(() => {
    const backAction = () => {
      // Nếu đang ở trang Home, ngăn chặn hành động "Back"
      return true; // Trả về true để ngăn chặn hành động mặc định
    };

    // Thêm listener cho sự kiện nhấn nút "Back"
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    // Dọn dẹp listener khi component unmount
    return () => backHandler.remove();
  }, []);

  // Kiểm tra trạng thái đăng nhập
  useEffect(() => {
    if (!loading && user) {
      // Nếu người dùng đã đăng nhập, chuyển hướng đến Dashboard
      router.replace('/components/Dashboard/dashboard'); // Sử dụng đường dẫn tương đối
    }
  }, [user, loading]);

  // Hiển thị loading indicator nếu đang kiểm tra trạng thái đăng nhập
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4facfe" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Gradient Top Section */}
      <LinearGradient
        colors={['#4facfe', '#00f2fe']}
        style={styles.topSection}
      >
        <View style={styles.logoWrapper}>
          <View style={styles.circleBackground}>
            <FontAwesome5 name="rocket" size={50} color="#ffffff" />
          </View>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.headerText}>Finance AI</Text>
          <Text style={styles.subHeaderText}>Quản lí tài chính thông minh</Text>
          <Text style={styles.subHeaderText}>với trí tuệ nhân tạo</Text>
        </View>
      </LinearGradient>

      {/* Bottom White Section */}
      <View style={styles.bottomSection}>
        <View style={styles.buttonContainer}>
          {/* Log in Button */}
          <Link href="/components/Auth/login" asChild>
            <TouchableOpacity style={styles.signInButton}>
              <LinearGradient
                colors={['#4facfe', '#00f2fe']}
                style={styles.gradientButton}
              >
                <Text style={styles.buttonText}>Log in</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Link>

          {/* Create Account Button */}
          <Link href="/components/Auth/register" asChild>
            <TouchableOpacity style={styles.createAccountButton}>
              <Text style={styles.createAccountText}>Create an account</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
};

// Stylesheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topSection: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  circleBackground: {
    width: width * 0.3, // 30% chiều rộng màn hình
    height: width * 0.3, // Đảm bảo chiều cao bằng chiều rộng
    borderRadius: (width * 0.3) / 2, // BorderRadius bằng một nửa kích thước
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 30,
    color: '#ffffff',
    fontWeight: '500',
    letterSpacing: 1,
  },
  headerText: {
    fontSize: 48,
    color: '#ffffff',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  subHeaderText: {
    fontSize: 18,
    color: '#ffffff',
    marginTop: 5,
    letterSpacing: 0.5,
  },
  bottomSection: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: '5%',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  gradientButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInButton: {
    width: '100%',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  createAccountButton: {
    borderWidth: 1,
    borderColor: '#4facfe',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  createAccountText: {
    color: '#4facfe',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Home;