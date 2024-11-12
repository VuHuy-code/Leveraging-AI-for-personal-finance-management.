import pandas as pd
import torch
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification, Trainer, TrainingArguments
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import pickle

# Đọc và tiền xử lý dữ liệu
data = pd.read_csv('../data/chi_tieu.csv')
label_encoder = LabelEncoder()
data['category_encoded'] = label_encoder.fit_transform(data['category'])

X_train, X_val, y_train, y_val = train_test_split(
    data['description'], data['category_encoded'], test_size=0.2, random_state=42)

# Tokenize dữ liệu với DistilBERT
tokenizer = DistilBertTokenizer.from_pretrained('distilbert-base-uncased')
train_encodings = tokenizer(X_train.tolist(), truncation=True, padding=True, max_length=128, return_tensors="pt")
val_encodings = tokenizer(X_val.tolist(), truncation=True, padding=True, max_length=128, return_tensors="pt")

# Tạo dataset PyTorch
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

train_dataset = ChiTieuDataset(train_encodings, y_train.values)
val_dataset = ChiTieuDataset(val_encodings, y_val.values)

# Khởi tạo mô hình DistilBERT với số nhãn đầu ra
model = DistilBertForSequenceClassification.from_pretrained('distilbert-base-uncased', num_labels=len(data['category'].unique()))

# Cài đặt các tham số huấn luyện tối ưu
training_args = TrainingArguments(
    output_dir='../models/optimized_distilbert',
    evaluation_strategy="epoch",            # Đánh giá mô hình ở mỗi epoch
    save_strategy="epoch",                  # Lưu mô hình ở mỗi epoch
    num_train_epochs=5,                     
    per_device_train_batch_size=16,         
    per_device_eval_batch_size=16,          
    learning_rate=2e-5,                     
    weight_decay=0.01,                      
    logging_dir='../logs',                  
    load_best_model_at_end=True,            
    save_total_limit=2                      
)

# Sử dụng Trainer API của Hugging Face để huấn luyện mô hình
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=val_dataset
)

trainer.train()

# Lưu mô hình và tokenizer đã được tối ưu hóa
model.save_pretrained("../models/optimized_distilbert")
tokenizer.save_pretrained("../models/optimized_distilbert")

# Lưu label encoder
with open("../data/label_encoder.pkl", "wb") as f:
    pickle.dump(label_encoder, f)
