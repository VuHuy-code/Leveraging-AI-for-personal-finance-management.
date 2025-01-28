import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  BackHandler, // Import BackHandler
} from 'react-native';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router'; // Sử dụng useRouter từ expo-router
import { login } from '../../../services/firebase/auth'; // Import hàm login từ Firebase

const Login: React.FC = () => {
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Trạng thái đăng nhập
  const router = useRouter(); // Sử dụng router từ expo-router

  const handleLogin = async () => {
    try {
      if (email && password) {
        const user = await login(email, password); // Gọi hàm login từ Firebase
        if (user) {
          setIsLoggedIn(true); // Cập nhật trạng thái đăng nhập
          router.push('./dashboard'); // Điều hướng tới Dashboard sau khi đăng nhập thành công
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      // Hiển thị thông báo lỗi cho người dùng (tuỳ chọn)
    }
  };

  // Xử lý sự kiện khi nhấn nút back
  useEffect(() => {
    const backAction = () => {
      router.push('/'); // Điều hướng về trang chủ (Home)
      return true; // Ngừng hành động mặc định của back button
    };

    BackHandler.addEventListener('hardwareBackPress', backAction);

    // Dọn dẹp sự kiện khi component bị unmount
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', backAction);
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Sign In</Text>

      {/* Email Input */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      {/* Password Input */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {/* Remember Me và Forgot Password */}
      <View style={styles.rowContainer}>
        <View style={styles.rememberMeContainer}>
          <BouncyCheckbox
            size={25}
            fillColor="#0072ff"
            text="Remember Me"
            iconStyle={{ borderColor: '#0072ff' }}
            innerIconStyle={{ borderWidth: 2 }}
            textStyle={{ textDecorationLine: 'none' }}
            isChecked={isChecked}
            onPress={(checked: boolean) => setIsChecked(checked)}
          />
        </View>

        {/* Forgot password được căn chỉnh bên phải */}
        <TouchableOpacity>
          <Text style={styles.forgotPasswordText}>Forgot password?</Text>
        </TouchableOpacity>
      </View>

      {/* Login Button với Gradient */}
      <TouchableOpacity onPress={handleLogin} style={styles.signInButton}>
        <LinearGradient
          colors={['#4facfe', '#00f2fe']}
          style={styles.gradientButton}
        >
          <Text style={styles.loginButtonText}>Sign In</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Sign Up Link */}
      <View style={styles.signUpContainer}>
        <Text style={styles.signUpText}>Don’t have an account? </Text>
        <Link href="./register" asChild>
          <TouchableOpacity>
            <Text style={styles.signUpLink}>Sign Up</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Or Sign In With Text */}
      <Text style={styles.orText}>Or sign in with:</Text>

      {/* Social Buttons */}
      <View style={styles.socialButtonsContainer}>
        <TouchableOpacity style={styles.socialButton}>
          <Image
            source={require('../../../assets/images/facebook.png')}
            style={styles.socialLogo}
          />
          <Text style={styles.socialButtonText}>Facebook</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <Image
            source={require('../../../assets/images/google.png')}
            style={styles.socialLogo}
          />
          <Text style={styles.socialButtonText}>Google</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Stylesheet (giữ nguyên)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 35,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#000000',
  },
  input: {
    height: 50,
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 20,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#ffffff',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  forgotPasswordText: {
    color: '#4c6ef5',
    fontSize: 16,
    textAlign: 'right',
    marginLeft: 10,
  },
  signInButton: {
    width: '100%',
    marginBottom: 15,
  },
  gradientButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  signUpText: {
    fontSize: 14,
    color: '#6c757d',
  },
  signUpLink: {
    fontSize: 14,
    color: '#4c6ef5',
    fontWeight: 'bold',
  },
  orText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 20,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
  },
  socialLogo: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  socialButtonText: {
    fontSize: 14,
    color: '#6c757d',
  },
});

export default Login;
