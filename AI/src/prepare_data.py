import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import pickle

# Đọc dữ liệu từ file CSV
data = pd.read_csv('../data/chi_tieu.csv')

# Mã hóa nhãn (Label Encoding)
label_encoder = LabelEncoder()
data['category_encoded'] = label_encoder.fit_transform(data['category'])

# Chia dữ liệu thành tập huấn luyện và kiểm tra
X_train, X_test, y_train, y_test = train_test_split(data['description'], data['category_encoded'], test_size=0.2, random_state=42)

# Lưu dữ liệu đã mã hóa
pd.DataFrame({'description': X_train, 'category': y_train}).to_csv("../data/train.csv", index=False)
pd.DataFrame({'description': X_test, 'category': y_test}).to_csv("../data/test.csv", index=False)

# Lưu label_encoder để sử dụng khi dự đoán
with open("../data/label_encoder.pkl", "wb") as f:
    pickle.dump(label_encoder, f)