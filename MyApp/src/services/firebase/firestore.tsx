// src/services/firebase/firestore.ts
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";

// Hàm lưu thông tin người dùng vào Firestore
export const saveUserProfile = async (uid: string, name: string, avatarUrl: string) => {
  try {
    // Lưu hoặc cập nhật thông tin người dùng trong Firestore
    await setDoc(doc(db, "users", uid), { name, avatarUrl }, { merge: true });
    console.log("User profile saved successfully!");
  } catch (error) {
    console.error("Error saving user profile:", error);
  }
};

// Hàm lấy thông tin người dùng từ Firestore
export const getUserProfile = async (uid: string) => {
  try {
    // Lấy tài liệu người dùng từ Firestore
    const docSnap = await getDoc(doc(db, "users", uid));
    if (docSnap.exists()) {
      // Nếu tài liệu tồn tại, trả về dữ liệu
      return docSnap.data();
    } else {
      // Nếu không có tài liệu, trả về null
      console.log("No user profile found.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};
