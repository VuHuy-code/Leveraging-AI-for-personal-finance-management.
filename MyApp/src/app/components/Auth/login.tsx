import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  BackHandler,
  Alert,
  Modal,
} from 'react-native';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { login, resetPassword } from '../../../services/firebase/auth';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, FontAwesome6, AntDesign } from '@expo/vector-icons';

const Login: React.FC = () => {
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await login(email, password);
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please check your credentials.');
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setIsResetting(true);
    try {
      await resetPassword(resetEmail);
      Alert.alert(
        'Success',
        'Password reset email sent. Please check your inbox.',
        [{ text: 'OK', onPress: () => setShowForgotPassword(false) }]
      );
      setResetEmail('');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.code === 'auth/user-not-found'
          ? 'No account found with this email address'
          : 'Failed to send reset email. Please try again.'
      );
    } finally {
      setIsResetting(false);
    }
  };

  useEffect(() => {
    const backAction = () => {
      router.push('/');
      return true;
    };

    BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', backAction);
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        <Image
          source={require('../../../assets/images/bgg.png')}
          style={styles.headerBg}
        />
        <View style={styles.content}>
          <Text style={styles.headerText}>Welcome Back!</Text>
          <Text style={styles.subHeaderText}>Sign in to continue</Text>

          <View style={styles.formContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#9ca3af" />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <View style={styles.rowContainer}>
              <View style={styles.checkboxContainer}>
                <BouncyCheckbox
                  size={20}
                  fillColor="#4f46e5"
                  text="Remember Me"
                  iconStyle={{ borderColor: '#4f46e5' }}
                  textStyle={{ color: '#fff', textDecorationLine: 'none' }}
                  isChecked={isChecked}
                  onPress={setIsChecked}
                />
              </View>
              <TouchableOpacity onPress={() => setShowForgotPassword(true)}>
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
              <LinearGradient
                colors={['#4f46e5', '#3d2e9c']}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.loginButtonText}>Sign In</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <Link href="./register" asChild>
                <TouchableOpacity>
                  <Text style={styles.signUpLink}>Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.orText}>Or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-google" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-facebook" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <Modal
        visible={showForgotPassword}
        transparent
        animationType="fade"
        onRequestClose={() => setShowForgotPassword(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalSubtitle}>
              Enter your email address to receive a password reset link
            </Text>

            <View style={styles.modalInputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#9ca3af" />
              <TextInput
                style={styles.modalInput}
                placeholder="Email"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                value={resetEmail}
                onChangeText={setResetEmail}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowForgotPassword(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalResetButton}
                onPress={handleForgotPassword}
                disabled={isResetting}
              >
                <Text style={styles.modalResetButtonText}>
                  {isResetting ? 'Sending...' : 'Send Reset Link'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    height: '100%',
  },
  headerBg: {
    position: 'absolute',
    width: '100%',
    height: '108%',
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  headerText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subHeaderText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 32,
  },
  formContainer: {
    backgroundColor: 'rgba(23, 23, 23, 0.8)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#fff',
    marginLeft: 12,
    fontSize: 16,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  checkboxContainer: {
    flex: 1,
  },
  forgotPasswordText: {
    color: '#4f46e5',
    fontSize: 14,
  },
  loginButton: {
    width: '100%',
    marginBottom: 16, // Reduce from 24 to 16
  },
  gradientButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  orText: {
    color: '#9ca3af',
    textAlign: 'center',
    marginHorizontal: 16, // Add spacing between lines and text
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  socialButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20, // Add margin bottom before the divider
  },
  signUpText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  signUpLink: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  modalInput: {
    flex: 1,
    height: 50,
    color: '#fff',
    marginLeft: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalResetButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#4f46e5',
  },
  modalCancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalResetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Login;
