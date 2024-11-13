import torch
from transformers import Trainer, TrainingArguments
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
import pandas as pd
import pickle

# Tải mô hình và tokenizer đã tối ưu hóa
model = DistilBertForSequenceClassification.from_pretrained("../models/optimized_distilbert")
tokenizer = DistilBertTokenizer.from_pretrained("../models/optimized_distilbert")

# Tải label encoder
with open("../data/label_encoder.pkl", "rb") as f:
    label_encoder = pickle.load(f)

# Dataset class for PyTorch
class ChiTieuDataset(torch.utils.data.Dataset):
    def __init__(self, encodings, labels):
        self.encodings = encodings
        self.labels = labels

    def __getitem__(self, idx):
        item = {key: val[idx] for key, val in self.encodings.items()}
        item['labels'] = torch.tensor(self.labels[idx])
        return item

    def __len__(self):
        return len(self.labels)

def preprocess_new_data(new_data):
    """Chuẩn bị và mã hóa dữ liệu mới để huấn luyện"""
    if new_data.empty or 'description' not in new_data.columns:
        raise ValueError("Dữ liệu đầu vào trống hoặc không có cột 'description'.")

    encodings = tokenizer(new_data['description'].tolist(), truncation=True, padding=True, max_length=128, return_tensors="pt")
    
    if len(encodings['input_ids']) == 0:
        raise ValueError("Mã hóa đầu vào bị trống, kiểm tra lại dữ liệu đầu vào.")

    labels = label_encoder.transform(new_data['category'])
    dataset = ChiTieuDataset(encodings, labels)
    return dataset

def update_model(new_data):
    """Cập nhật mô hình với dữ liệu mới"""
    if new_data.empty or 'description' not in new_data.columns:
        raise ValueError("Dữ liệu đầu vào trống hoặc không có cột 'description'.")

    # Chia dữ liệu để tạo tập eval (đảm bảo ít nhất 1 dòng dữ liệu)
    if len(new_data) > 1:
        eval_data = new_data.sample(frac=0.2, random_state=42)  # Lấy 20% làm tập đánh giá
        train_data = new_data.drop(eval_data.index)
    else:
        eval_data = new_data
        train_data = new_data

    print("Dữ liệu eval:")
    print(eval_data)

    if eval_data.empty or 'description' not in eval_data.columns:
        raise ValueError("Dữ liệu eval trống hoặc không có cột 'description'.")

    eval_dataset = preprocess_new_data(eval_data)
    train_dataset = preprocess_new_data(train_data)


    # Tạo bộ dữ liệu đánh giá (có thể sử dụng một phần của `new_data` hoặc dữ liệu khác)
    eval_data = new_data.sample(frac=0.2)  # Lấy 20% dữ liệu làm tập đánh giá
    eval_dataset = preprocess_new_data(eval_data)

    # Thiết lập tham số huấn luyện
    training_args = TrainingArguments(
        output_dir='../models/optimized_distilbert',
        num_train_epochs=1,
        per_device_train_batch_size=8,
        learning_rate=1e-5,
        weight_decay=0.01,
        logging_dir='../logs',
        save_total_limit=2,
        load_best_model_at_end=True,
        evaluation_strategy="steps",
        save_strategy="steps",
        eval_steps=500
    )


    # Khởi tạo Trainer với dữ liệu mới
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=new_dataset
    )

    # Fine-tuning trên dữ liệu mới
    trainer.train()

    # Lưu mô hình đã cập nhật
    model.save_pretrained("../models/optimized_distilbert")
    tokenizer.save_pretrained("../models/optimized_distilbert")
