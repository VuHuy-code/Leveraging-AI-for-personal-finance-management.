// src/services/config/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; 
import { getAnalytics } from "firebase/analytics"; 
import { getFirestore } from "firebase/firestore"; 
import { getStorage } from "firebase/storage"; // Import Firebase Storage

// Cấu hình Firebase của bạn
const firebaseConfig = {
  apiKey: "AIzaSyCzYeK3vc7P2V19ZGWhHFJju3QxM4awOhk",
  authDomain: "finance-ai-bbab1.firebaseapp.com",
  projectId: "finance-ai-bbab1",
  storageBucket: "finance-ai-bbab1.appspot.com", // Chỉnh sửa nếu có lỗi nhỏ ở đây
  messagingSenderId: "1006672247865",
  appId: "1:1006672247865:web:e53a971b5e9b12f462a1e8",
  measurementId: "G-W2PJWQSTLE"
};

// Khởi tạo Firebase app
const firebaseApp = initializeApp(firebaseConfig);

// Khởi tạo Firebase Authentication
const initializeAuth = () => getAuth(firebaseApp);

// Khởi tạo Firestore
const db = getFirestore(firebaseApp);

// Khởi tạo Firebase Storage
const storage = getStorage(firebaseApp);

// Khởi tạo Firebase Analytics (nếu cần)
const initializeAnalytics = () => getAnalytics(firebaseApp);

// Export Firebase app và các dịch vụ cần thiết
export { firebaseApp, initializeAuth, db, storage, initializeAnalytics };
