import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebaseConfig";

// Hàm tải ảnh đại diện lên Firebase Storage
export const uploadAvatar = async (uid: string, file: File) => {
  try {
    // Kiểm tra định dạng file (chỉ cho phép ảnh)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error("File must be an image (jpg, png, gif).");
    }

    // Kiểm tra kích thước file (ví dụ: giới hạn 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error("File size exceeds the 5MB limit.");
    }

    // Tạo tên file duy nhất để tránh trùng lặp
    const timestamp = Date.now(); // hoặc sử dụng một GUID
    const fileRef = ref(storage, `avatars/${uid}_${timestamp}_${file.name}`);

    // Tải file lên Firebase Storage
    await uploadBytes(fileRef, file);

    // Lấy URL tải về của file đã tải lên
    const downloadURL = await getDownloadURL(fileRef);

    // Trả về URL tải về
    return downloadURL;
  } catch (error) {
    console.error("Error uploading avatar:", error);
    throw error;
  }
};
