from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
import torch
import pickle

# Tải mô hình và tokenizer đã tối ưu hóa
model = DistilBertForSequenceClassification.from_pretrained("../models/optimized_distilbert")
tokenizer = DistilBertTokenizer.from_pretrained("../models/optimized_distilbert")

# Tải label encoder
with open("../data/label_encoder.pkl", "rb") as f:
    label_encoder = pickle.load(f)

# Hàm dự đoán loại chi tiêu
def predict_category(description):
    inputs = tokenizer(description, return_tensors="pt", truncation=True, padding=True, max_length=128)
    outputs = model(**inputs)
    logits = outputs.logits
    predicted_class = torch.argmax(logits, dim=1).item()
    return label_encoder.inverse_transform([predicted_class])[0]

# Thử nghiệm với một mô tả mới
description = "Đặt vé xem phim"
predicted_category = predict_category(description)
print("Loại chi tiêu dự đoán:", predicted_category)
