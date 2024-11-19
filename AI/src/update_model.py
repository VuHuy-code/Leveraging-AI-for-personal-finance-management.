from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
import torch
import pickle
import pandas as pd

# Tải mô hình và tokenizer đã huấn luyện
model = DistilBertForSequenceClassification.from_pretrained("../models/optimized_distilbert")
tokenizer = DistilBertTokenizer.from_pretrained("../models/optimized_distilbert")

# Tải label encoder
with open("../data/label_encoder.pkl", "rb") as f:
    label_encoder = pickle.load(f)

# Hàm dự đoán loại chi tiêu từ mô tả
def predict_category(description):
    inputs = tokenizer(description, return_tensors="pt", truncation=True, padding=True, max_length=128)
    outputs = model(**inputs)
    logits = outputs.logits
    predicted_class = torch.argmax(logits, dim=1).item()
    return label_encoder.inverse_transform([predicted_class])[0]

# Hàm lưu thông tin mới vào file CSV
def save_new_data(description, predicted_category):
    # Đọc dữ liệu cũ hoặc tạo mới nếu file chưa tồn tại
    try:
        new_data = pd.read_csv('../data/new_chi_tieu.csv')
    except FileNotFoundError:
        new_data = pd.DataFrame(columns=['description', 'category'])

    # Tạo DataFrame mới cho dòng dữ liệu mới
    new_row = pd.DataFrame({'description': [description], 'category': [predicted_category]})

    # Dùng pd.concat thay vì append
    new_data = pd.concat([new_data, new_row], ignore_index=True)

    # Lưu lại vào file CSV
    new_data.to_csv('../data/new_chi_tieu.csv', index=False)

# Hàm để người dùng nhập thông tin chi tiêu
def input_and_predict():
    while True:
        # Nhập mô tả chi tiêu từ người dùng
        description = input("Nhập mô tả chi tiêu (hoặc 'exit' để thoát): ")
        if description.lower() == 'exit':
            print("Thoát chương trình.")
            break

        # Dự đoán loại chi tiêu
        predicted_category = predict_category(description)
        print(f"Loại chi tiêu dự đoán: {predicted_category}")

        # Lưu vào dữ liệu mới
        save_new_data(description, predicted_category)
        print("Thông tin đã được lưu vào dữ liệu mới.\n")

# Gọi hàm nhập liệu và dự đoán
input_and_predict()