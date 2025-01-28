import React, { useState,  useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  BackHandler,
} from 'react-native';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { register } from '../../../services/firebase/auth';

const Register: React.FC = () => {
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); // Thêm trạng thái errorMessage
  const router = useRouter();

  const handleRegister = async () => {
    setErrorMessage(''); // Reset thông báo lỗi trước khi thực hiện đăng ký

    if (!email || !password || !confirmPassword) {
      setErrorMessage('Please fill out all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!isChecked) {
      setErrorMessage('You must agree to the terms and conditions.');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Registering user...');
      await register(email, password);
      router.push('/components/Dashboard/dashboard'); // Chuyển hướng đến Dashboard
    } catch (error: any) {
      let errorMessage = 'Registration failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'The email address is already in use.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'The email address is invalid.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'The password is too weak.';
      }
      setErrorMessage(errorMessage); // Hiển thị thông báo lỗi trên giao diện
    } finally {
      setIsLoading(false);
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
      <Text style={styles.headerText}>Sign Up</Text>

      {/* Hiển thị thông báo lỗi */}
      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

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

      {/* Confirm Password Input */}
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      {/* Terms and Conditions Checkbox */}
      <View style={styles.rowContainer}>
        <BouncyCheckbox
          size={25}
          fillColor="#0072ff"
          text="I agree to the terms and conditions"
          iconStyle={{ borderColor: '#0072ff' }}
          innerIconStyle={{ borderWidth: 2 }}
          textStyle={{ textDecorationLine: 'none' }}
          isChecked={isChecked}
          onPress={(checked: boolean) => setIsChecked(checked)}
        />
      </View>

      {/* Register Button với Gradient */}
      <TouchableOpacity
        onPress={handleRegister}
        style={styles.signUpButton}
        disabled={isLoading}
      >
        <LinearGradient
          colors={['#4facfe', '#00f2fe']}
          style={styles.gradientButton}
        >
          <Text style={styles.signUpButtonText}>
            {isLoading ? 'Loading...' : 'SIGN UP'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Sign In Link */}
      <View style={styles.signInContainer}>
        <Text style={styles.signInText}>Already have an account? </Text>
        <Link href="./login" asChild>
          <TouchableOpacity>
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Or Sign Up With Text */}
      <Text style={styles.orText}>Or sign up with:</Text>

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

// Stylesheet
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 10,
    marginHorizontal: 0,
  },
  signUpButton: {
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
  signUpButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  signInText: {
    fontSize: 14,
    color: '#6c757d',
  },
  signInLink: {
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
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 14,
  },
});

export default Register;