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
    encodings = tokenizer(new_data['description'].tolist(), truncation=True, padding=True, max_length=128, return_tensors="pt")
    labels = label_encoder.transform(new_data['category'])
    dataset = ChiTieuDataset(encodings, labels)
    return dataset

def update_model(new_data):
    """Cập nhật mô hình với dữ liệu mới"""
    new_dataset = preprocess_new_data(new_data)

    # Thiết lập tham số huấn luyện
    training_args = TrainingArguments(
        output_dir='../models/optimized_distilbert',
        num_train_epochs=1,                      # Số epoch cho dữ liệu mới
        per_device_train_batch_size=8,           # Batch size nhỏ để cập nhật nhanh
        learning_rate=1e-5,                      # Learning rate thấp để fine-tuning
        weight_decay=0.01,                       
        logging_dir='../logs',
        save_total_limit=2,
        load_best_model_at_end=True,
        evaluation_strategy="no"                 # Không đánh giá trong khi fine-tuning
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
