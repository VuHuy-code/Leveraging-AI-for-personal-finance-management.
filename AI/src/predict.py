import torch
from transformers import (
    BertForSequenceClassification,
    BertTokenizer,
    Trainer,
    TrainingArguments,
    AdamW,
    get_linear_schedule_with_warmup,
    EarlyStoppingCallback
)
from sklearn.model_selection import train_test_split
from datasets import load_dataset

# Tải dataset ví dụ
dataset = load_dataset("your_dataset_name")  # Thay bằng dataset của bạn

# Chia dữ liệu thành train và eval
train_dataset, eval_dataset = train_test_split(dataset["train"], test_size=0.2)

# Tải mô hình và tokenizer BERT đã được huấn luyện trước
model = BertForSequenceClassification.from_pretrained("bert-base-uncased", num_labels=3)
tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")  # Tokenizer cho BERT

# Cấu hình TrainingArguments
training_args = TrainingArguments(
    output_dir='./results',  # Lưu kết quả
    num_train_epochs=3,  # Số epoch
    per_device_train_batch_size=8,  # Batch size cho training
    per_device_eval_batch_size=8,  # Batch size cho evaluation
    learning_rate=2e-5,  # Learning rate
    weight_decay=0.01,  # Weight decay để giảm overfitting
    evaluation_strategy="epoch",  # Đánh giá sau mỗi epoch
    save_strategy="epoch",  # Lưu mô hình sau mỗi epoch
    load_best_model_at_end=True,  # Lưu mô hình tốt nhất
    metric_for_best_model="accuracy",  # Đánh giá mô hình tốt nhất dựa trên độ chính xác
    logging_dir='./logs',  # Lưu log training
)

# Tạo optimizer AdamW
optimizer = AdamW(model.parameters(), lr=2e-5)

# Tạo scheduler để giảm learning rate trong quá trình huấn luyện
total_steps = len(train_dataset) * training_args.num_train_epochs // training_args.per_device_train_batch_size
scheduler = get_linear_schedule_with_warmup(
    optimizer,
    num_warmup_steps=0,
    num_training_steps=total_steps
)

# Callback EarlyStopping để dừng huấn luyện sớm nếu không cải thiện
early_stopping = EarlyStoppingCallback(early_stopping_patience=3)

# Cấu hình Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    optimizers=(optimizer, scheduler),  # Cập nhật optimizer và scheduler
    callbacks=[early_stopping],  # Thêm early stopping
)

# Bắt đầu huấn luyện
trainer.train()

# Đánh giá mô hình trên tập eval
eval_results = trainer.evaluate()

print("Evaluation results:", eval_results)

# Lưu mô hình và tokenizer sau khi huấn luyện
model.save_pretrained("./final_model")
tokenizer.save_pretrained("./final_model")  # Lưu tokenizer vào thư mục cuối cùng
