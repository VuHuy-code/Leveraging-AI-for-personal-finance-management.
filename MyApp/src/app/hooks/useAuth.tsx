import { useState, useEffect } from 'react';
import { auth } from '../../services/firebase/auth';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getUserProfile, saveUserProfile} from '../../services/firebase/firestore'; // Import Firestore functions
import { getWallet } from '../../services/firebase/storage'; // Import getWallet function
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthUser extends User {
  displayName: string | null;
  photoURL: string | null;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userData, setUserData] = useState<any>(null); // Lưu thông tin người dùng
  const [loading, setLoading] = useState(true);

  // Kiểm tra xem có thông tin đăng nhập được lưu không
  const checkSavedAuth = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('userEmail');
      const savedPassword = await AsyncStorage.getItem('userPassword');

      if (savedEmail && savedPassword) {
        console.log('Tìm thấy thông tin đăng nhập đã lưu, đang tự động đăng nhập...');
        // Tự động đăng nhập với thông tin đã lưu
        await login(savedEmail, savedPassword, true);
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra thông tin đăng nhập đã lưu:', error);
    }
  };

  // Theo dõi trạng thái đăng nhập và lấy dữ liệu từ Firestore
  useEffect(() => {
    // Kiểm tra đăng nhập đã lưu khi khởi động
    checkSavedAuth();

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      console.log('Auth state changed:', authUser?.uid);
      if (authUser) {
        setUser(authUser);

        try {
          // Lấy thông tin người dùng từ Firestore
          let data = await getUserProfile(authUser.uid);

          // Nếu chưa có dữ liệu, lưu thông tin cơ bản ban đầu
          if (!data && authUser.email) {
            const defaultName = authUser.email; // Đặt tên mặc định là email
            const defaultAvatarUrl = 'https://i.pinimg.com/736x/8f/1c/a2/8f1ca2029e2efceebd22fa05cca423d7.jpg';
            await saveUserProfile(authUser.uid, defaultName, defaultAvatarUrl);
            // Lấy lại dữ liệu sau khi lưu
            data = await getUserProfile(authUser.uid);
          }
          setUserData(data);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe(); // Đảm bảo dừng theo dõi khi component bị hủy
  }, []);

  // Add this function to check if a wallet exists
  const checkUserWallet = async (userId: string): Promise<boolean> => {
    try {
      const userWallet = await getWallet(userId);
      return !!userWallet; // Returns true if wallet exists, false otherwise
    } catch (error) {
      console.error("Error checking wallet:", error);
      return false;
    }
  };

  // Hàm đăng nhập với lựa chọn lưu đăng nhập
  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);

      // Lấy dữ liệu từ Firestore sau khi đăng nhập
      let data = await getUserProfile(userCredential.user.uid);
      if (!data && userCredential.user.email) {
        const defaultName = userCredential.user.email;
        const defaultAvatarUrl = 'https://i.pinimg.com/736x/8f/1c/a2/8f1ca2029e2efceebd22fa05cca423d7.jpg';
        await saveUserProfile(userCredential.user.uid, defaultName, defaultAvatarUrl);
        data = await getUserProfile(userCredential.user.uid);
      }
      setUserData(data);

      // Lưu thông tin đăng nhập nếu người dùng chọn "Ghi nhớ đăng nhập"
      if (rememberMe) {
        await AsyncStorage.setItem('userEmail', email);
        await AsyncStorage.setItem('userPassword', password);
        await AsyncStorage.setItem('rememberMe', 'true');
        console.log('Đã lưu thông tin đăng nhập');
      }

      return userCredential.user;
    } catch (error) {
      console.error('Lỗi khi đăng nhập:', error);
      throw error;
    }
  };

  // Hàm đăng ký
  const register = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);

      const defaultName = email;
      const defaultAvatarUrl = 'https://i.pinimg.com/736x/8f/1c/a2/8f1ca2029e2efceebd22fa05cca423d7.jpg';
      await saveUserProfile(userCredential.user.uid, defaultName, defaultAvatarUrl);
      const data = await getUserProfile(userCredential.user.uid);
      setUserData(data);

      // The navigation will be handled by _layout.tsx through the useEffect
      return userCredential.user;
    } catch (error) {
      console.error('Error registering:', error);
      throw error;
    }
  };

  // Hàm đăng xuất - cập nhật để xóa thông tin đăng nhập đã lưu
  const logout = async () => {
    try {
      // Xóa thông tin đăng nhập đã lưu
      await AsyncStorage.removeItem('userEmail');
      await AsyncStorage.removeItem('userPassword');
      await AsyncStorage.removeItem('rememberMe');

      await signOut(auth);
      setUser(null);
      setUserData(null);
      // The navigation will be handled by the component using this hook
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  // Hàm cập nhật thông tin người dùng
  const updateProfile = async (name: string, avatarUrl: string) => {
    if (!user) return;
    try {
      await saveUserProfile(user.uid, name, avatarUrl);
      // Fetch updated data immediately
      const updatedData = await getUserProfile(user.uid);
      setUserData(updatedData);
      console.log('Profile updated with new avatar:', avatarUrl);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  return { user, userData, loading, login, register, logout, updateProfile }; // Trả về updateProfile
};
