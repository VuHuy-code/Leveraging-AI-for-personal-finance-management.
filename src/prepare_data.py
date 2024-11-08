import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
import pickle

# Đọc dữ liệu từ file CSV
data = pd.read_csv('../data/chi_tieu.csv')
print(data.head())  # In 5 dòng đầu tiên để kiểm tra dữ liệu # In 5 dòng đầu tiên để kiểm tra dữ liệu

# Mã hóa nhãn (Label Encoding)
label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(data['category'])

# Chia dữ liệu (80% huấn luyện, 20% kiểm tra)
X_train, X_test, y_train, y_test = train_test_split(data['description'], y_encoded, test_size=0.2, random_state=42)

# Lưu label_encoder để sử dụng khi dự đoán
with open("../data/label_encoder.pkl", "wb") as f:
    pickle.dump(label_encoder, f)

# Lưu tập dữ liệu đã chia
pd.DataFrame({'description': X_train, 'category': y_train}).to_csv("../data/train.csv", index=False)
pd.DataFrame({'description': X_test, 'category': y_test}).to_csv("../data/test.csv", index=False)