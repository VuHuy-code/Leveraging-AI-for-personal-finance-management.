import pandas as pd
import torch
from transformers import BertTokenizer, BertForSequenceClassification, Trainer, TrainingArguments
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score

# Đọc dữ liệu huấn luyện và kiểm tra
train_data = pd.read_csv('../data/train.csv')
test_data = pd.read_csv('../data/test.csv')

# Sử dụng tokenizer của BERT để chuyển văn bản thành tensor
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
train_encodings = tokenizer(train_data['description'].tolist(), truncation=True, padding=True, max_length=128, return_tensors="pt")
test_encodings = tokenizer(test_data['description'].tolist(), truncation=True, padding=True, max_length=128, return_tensors="pt")

# Tạo dataset tùy chỉnh cho PyTorch
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

train_dataset = ChiTieuDataset(train_encodings, train_data['category'].values)
test_dataset = ChiTieuDataset(test_encodings, test_data['category'].values)

# Thiết lập và huấn luyện mô hình BERT
model = BertForSequenceClassification.from_pretrained('bert-base-uncased', num_labels=train_data['category'].max() + 1)

# Định nghĩa hàm compute_metrics để tính độ chính xác
def compute_metrics(p):
    predictions, labels = p
    predictions = predictions.argmax(axis=-1)
    return {
        'accuracy': accuracy_score(labels, predictions)
    }

training_args = TrainingArguments(
    output_dir='../models/chi_tieu_model',
    num_train_epochs=3,
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    warmup_steps=500,
    weight_decay=0.01,
    logging_dir='../logs',
    evaluation_strategy="epoch"
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=test_dataset,
    compute_metrics=compute_metrics  # Tính toán độ chính xác
)

trainer.train()

print("Độ chính xác trên tập huấn luyện:")
train_results = trainer.evaluate(train_dataset)
print(f"Accuracy trên tập huấn luyện: {train_results['eval_accuracy']:.4f}")

# Lưu mô hình và tokenizer
model.save_pretrained("../models/chi_tieu_model")
tokenizer.save_pretrained("../models/chi_tieu_model")