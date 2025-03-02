import { useState, useEffect } from 'react';
import { auth } from '../../services/firebase/auth';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getUserProfile, saveUserProfile} from '../../services/firebase/firestore'; // Import Firestore functions
import { getWallet } from '../../services/firebase/storage'; // Import getWallet function

interface AuthUser extends User {
  displayName: string | null;
  photoURL: string | null;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userData, setUserData] = useState<any>(null); // Lưu thông tin người dùng
  const [loading, setLoading] = useState(true);

  // Theo dõi trạng thái đăng nhập và lấy dữ liệu từ Firestore
  useEffect(() => {
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

  // Hàm đăng nhập
  const login = async (email: string, password: string) => {
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

      // Navigation will be handled by _layout.tsx
    } catch (error) {
      console.error('Error logging in:', error);
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
    } catch (error) {
      console.error('Error registering:', error);
      throw error;
    }
  };

  // Hàm đăng xuất
  const logout = async () => {
    try {
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
