import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function configureNotifications(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
        android: {
          allowAlert: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    if (Platform.OS === 'android') {
      // Tạo nhiều kênh thông báo cho Android
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Mặc định',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        enableVibrate: true,
        enableLights: true,
      });

      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Nhắc nhở',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        enableVibrate: true,
      });
    }

    return true;
  } catch (error) {
    console.error('Lỗi cấu hình thông báo:', error);
    return false;
  }
}

// 🕒 Tạo trigger đúng định dạng
const createTrigger = (hour: number, minute: number): Notifications.CalendarTriggerInput => {
  return {
    type: Notifications.SchedulableTriggerInputTypes.CALENDAR, // ✅ Sửa lỗi ở đây
    hour,
    minute,
    repeats: true,
  };
};

// Array of fun emoji combinations for notifications
const funEmojis = [
  '💰 💝',
  '🎯 💫',
  '✨ 💖',
  '🌟 💅',
  '👛 ✨',
  '💎 💫',
  '🎀 💖',
  '🌸 ✨',
  '🦋 💫',
  '🎪 💝',
  '🌈 ✨',
  '🎭 💖'
];

// Get random emoji combination
const getRandomEmoji = () => {
  const randomIndex = Math.floor(Math.random() * funEmojis.length);
  return funEmojis[randomIndex];
};

// 🔔 Hàm lên lịch thông báo
export async function scheduleNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule notifications for each hour from 8 AM to 10 PM
    for (let hour = 8; hour <= 22; hour++) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${getRandomEmoji()} Ghi chép chi tiêu đi nào`,
          body: 'Nhớ cập nhật chi tiêu để quản lý chi tiêu hiệu quả nhé! 💫',
        },
        trigger: createTrigger(hour, 0), // Triggers at the start of each hour
      });
    }

    console.log('Hourly notifications scheduled successfully');
  } catch (error) {
    console.error('Error scheduling hourly notifications:', error);
  }
}

// 🚨 Nhắc nhở nếu chưa nhập chi tiêu
export async function checkAndNotifyNoTransactions() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⚠️ Nhắc nhở!',
      body: 'Hôm nay bạn chưa ghi chép khoản chi tiêu nào. Hãy cập nhật ngay!',
    },
    trigger: createTrigger(20, 0), // 20:00 tối
  });
}

// ✅ Đăng ký quyền thông báo
export async function registerForPushNotificationsAsync() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    if (newStatus !== 'granted') {
      alert('Bạn cần cấp quyền để nhận thông báo!');
      return;
    }
  }
}

// 🧪 Test notification function
export async function sendTestNotification() {
  try {
    // Check if notifications are configured
    const isConfigured = await configureNotifications();
    if (!isConfigured) {
      console.error('Notifications not configured');
      return false;
    }

    // Send an immediate test notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 Test Notification',
        body: 'Nếu bạn nhìn thấy thông báo này, notifications đang hoạt động tốt!',
        data: { type: 'test' },
      },
      trigger: null, // null trigger means immediate notification
    });

    console.log('Test notification sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
  }
}

export async function checkScheduledNotifications() {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('Scheduled notifications:', scheduledNotifications);
    return scheduledNotifications;
  } catch (error) {
    console.error('Error checking scheduled notifications:', error);
    return [];
  }
}
