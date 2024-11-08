import joblib
import pickle
with open('../data/label_encoder.pkl', 'rb') as f:
    label_encoder = pickle.load(f)
#Hàm dự đoán loại chi tiêu:
def predict_category(description):
    description_transformed = vectorizer.transform([description])
    predicted_category = model.predict(description_transformed)
    return predicted_category[0]

#Tải mô hình và vectorizer đã lưu
model = joblib.load('../models/chi_tieu_model.pkl')
vectorizer = joblib.load('../models/tfidf_vectorizer.pkl')

#Chạy thử dự đoán
description = "Electric"
predicted_category = predict_category(description)
print("Loại chi tiêu dự đoán:", predicted_category)

# Giải mã loại chi tiêu từ nhãn số
predicted_category_name = label_encoder.inverse_transform([predicted_category])[0]
print("Loại chi tiêu dự đoán:", predicted_category_name)