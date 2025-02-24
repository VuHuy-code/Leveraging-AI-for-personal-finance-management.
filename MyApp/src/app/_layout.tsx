import { Stack } from 'expo-router';
import { WalletProvider } from './contexts/WalletContext';
import { TransactionProvider } from './contexts/TransactionContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from './hooks/useAuth';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync, scheduleNotifications } from '../services/notifications/notificationService';

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
    if (!loading) {
      if (user) {
        // If user is authenticated, redirect to dashboard
        router.replace('/components/Dashboard/dashboard');
      }
      // If no user, stay on index page (onboarding)
    }
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
        </TransactionProvider>
      </WalletProvider>
    </GestureHandlerRootView>
  );
}
