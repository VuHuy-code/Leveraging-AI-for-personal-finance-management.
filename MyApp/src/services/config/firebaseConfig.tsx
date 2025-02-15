// src/services/config/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; 
import { getAnalytics } from "firebase/analytics"; 
import { getFirestore } from "firebase/firestore"; 
import { getStorage } from "firebase/storage"; // Import Firebase Storage

// Cấu hình Firebase của bạn
const firebaseConfig = {
  apiKey: "AIzaSyB7poj0Ubylvevl8Ge3HC_HBfMAaFAOXoA",
  authDomain: "expoapp-4bb19.firebaseapp.com",
  projectId: "expoapp-4bb19",
  storageBucket: "expoapp-4bb19.firebasestorage.app",
  messagingSenderId: "149881821864",
  appId: "1:149881821864:web:c8a744832bdfa01a86c09d",
  measurementId: "G-FJ1JPN5SZE"
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
