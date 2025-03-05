// src/services/firebase/auth.ts
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { firebaseApp } from '../config/firebaseConfig'; // Import cấu hình Firebase
import AsyncStorage from '@react-native-async-storage/async-storage';

// Khởi tạo auth instance
const auth = getAuth(firebaseApp);

// Kiểm tra trạng thái đăng nhập đã lưu
export const checkSavedAuth = async () => {
  try {
    const email = await AsyncStorage.getItem('userEmail');
    const password = await AsyncStorage.getItem('userPassword');
    const rememberMe = await AsyncStorage.getItem('rememberMe');

    if (email && password && rememberMe === 'true') {
      // Nếu có thông tin đăng nhập được lưu, thử đăng nhập
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    }
    return null;
  } catch (error) {
    console.error('Lỗi khi kiểm tra thông tin đăng nhập đã lưu:', error);
    return null;
  }
};

// Đăng nhập với tùy chọn lưu thông tin
export const login = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Lỗi khi đăng nhập:', error);
    throw error;
  }
};

export const register = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Lỗi khi đăng ký:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    // Xóa thông tin đăng nhập đã lưu khi đăng xuất
    await AsyncStorage.removeItem('userEmail');
    await AsyncStorage.removeItem('userPassword');
    await AsyncStorage.removeItem('rememberMe');
    await signOut(auth);
  } catch (error) {
    console.error('Lỗi khi đăng xuất:', error);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error('Lỗi khi gửi email đặt lại mật khẩu:', error);
    throw error;
  }
};

// Export auth instance để sử dụng trong các hook hoặc component khác
export { auth };
