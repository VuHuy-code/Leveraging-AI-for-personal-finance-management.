import { Stack } from 'expo-router';
import { WalletProvider } from './contexts/WalletContext';
import { TransactionProvider } from './contexts/TransactionContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from './hooks/useAuth';
import * as Notifications from 'expo-notifications';
import { configureNotifications, registerForPushNotificationsAsync, scheduleNotifications, sendTestNotification } from '../services/notifications/notificationService';
import { SavingsProvider } from './contexts/SavingsContext';
import { getWallet } from '../services/firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

// Cấu hình notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!loading) {
        if (user) {
          // Nếu đã đăng nhập, kiểm tra xem có ví không
          try {
            const userWallet = await getWallet(user.uid);

            if (userWallet) {
              // Nếu có ví, đi đến dashboard
              router.replace('/components/Dashboard/dashboard');
            } else {
              // Nếu không có ví, đi đến trang thiết lập ví
              router.replace('/components/Dashboard/SetupWallet');
            }
          } catch (error) {
            console.error("Lỗi khi kiểm tra thiết lập người dùng:", error);
            router.replace('/components/Dashboard/SetupWallet');
          }
        } else {
          // Nếu chưa đăng nhập, kiểm tra xem có thông tin đăng nhập được lưu không
          const rememberMe = await AsyncStorage.getItem('rememberMe');

          if (rememberMe === 'true') {
            // Nếu có thông tin đăng nhập được lưu, đợi xử lý tự động đăng nhập từ useAuth
            console.log('Đang đợi tự động đăng nhập...');
            // Không chuyển hướng tại đây, để useAuth xử lý
          } else {
            // Nếu không có thông tin đăng nhập được lưu, đi đến trang đăng nhập
            router.replace('/');
          }
        }
      }
    };

    checkUserStatus();
  }, [user, loading]);

  useEffect(() => {
    // Cấu hình thông báo khi ứng dụng khởi động
    async function setupNotifications() {
      try {
        const isConfigured = await configureNotifications();
        if (isConfigured) {
          console.log('Notifications configured successfully');

          // Đăng ký quyền đẩy thông báo
          await registerForPushNotificationsAsync();

          // Lên lịch thông báo
          await scheduleNotifications();

          // Gửi thông báo test nếu cần
          // Bỏ comment dòng dưới để test thông báo khi khởi động app
          // await sendTestNotification();
        }
      } catch (error) {
        console.error('Failed to setup notifications:', error);
      }
    }

    setupNotifications();

    // Thêm phần lắng nghe sự kiện thông báo
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Xử lý khi người dùng nhấn vào thông báo
    });

    return () => {
      // Dọn dẹp khi unmount
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <WalletProvider>
        <TransactionProvider>
          <SavingsProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right'
              }}
            >
              <Stack.Screen
                name="index"
                options={{
                  animation: 'fade'
                }}
              />
              <Stack.Screen name="components/Auth/login" />
              <Stack.Screen name="components/Auth/register" />
              <Stack.Screen name="components/Dashboard/SetupWallet" />
              <Stack.Screen
                name="components/Dashboard/dashboard"
                options={{
                  gestureEnabled: false
                }}
              />
              <Stack.Screen
                name="components/Dashboard/chatbot"
                options={{
                  gestureEnabled: false
                }}
              />
            </Stack>
          </SavingsProvider>
        </TransactionProvider>
      </WalletProvider>
    </GestureHandlerRootView>
  );
}
