import { Stack } from 'expo-router';
import { WalletProvider } from './contexts/WalletContext';
import { TransactionProvider } from './contexts/TransactionContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from './hooks/useAuth';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync, scheduleNotifications } from '../services/notifications/notificationService';
import { SavingsProvider } from './contexts/SavingsContext';
// Import getWallet
import { getWallet } from '../services/firebase/storage';

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
    const checkUserSetup = async () => {
      if (!loading && user) {
        try {
          // Check if user has a wallet
          const userWallet = await getWallet(user.uid);

          if (userWallet) {
            // If wallet exists, go to dashboard
            router.replace('/components/Dashboard/dashboard');
          } else {
            // If no wallet, go to setup wallet screen
            router.replace('./components/Dashboard/SetupWallet');
          }
        } catch (error) {
          console.error("Error checking user setup:", error);
          // In case of error, default to setup wallet
          router.replace('./components/Dashboard/SetupWallet');
        }
      }
    };

    checkUserSetup();
  }, [user, loading]);

  useEffect(() => {
    // Đăng ký permissions khi app khởi động
    registerForPushNotificationsAsync();

    // Lên lịch notifications
    scheduleNotifications();
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
