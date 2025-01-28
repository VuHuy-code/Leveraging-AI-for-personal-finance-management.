// src/services/config/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Import Authentication
import { getAnalytics } from "firebase/analytics"; // Firebase Analytics

// Cấu hình Firebase của bạn
const firebaseConfig = {
  apiKey: "AIzaSyCzYeK3vc7P2V19ZGWhHFJju3QxM4awOhk",
  authDomain: "finance-ai-bbab1.firebaseapp.com",
  projectId: "finance-ai-bbab1",
  storageBucket: "finance-ai-bbab1.firebasestorage.app",
  messagingSenderId: "1006672247865",
  appId: "1:1006672247865:web:e53a971b5e9b12f462a1e8",
  measurementId: "G-W2PJWQSTLE"
};

// Khởi tạo Firebase app
const firebaseApp = initializeApp(firebaseConfig);

// Khởi tạo Firebase Authentication
const initializeAuth = () => getAuth(firebaseApp);

// Khởi tạo Firebase Analytics (nếu cần)
const initializeAnalytics = () => getAnalytics(firebaseApp);

// Export Firebase app và các hàm khởi tạo dịch vụ
export { firebaseApp, initializeAuth, initializeAnalytics };