import pandas as pd
from datasets import Dataset, DatasetDict
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification, Trainer, TrainingArguments
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score  # Thay thế load_metric bằng accuracy_score

# Bước 1: Đọc và tiền xử lý dữ liệu từ CSV
def preprocess_data(file_path):
    # Đọc CSV vào pandas DataFrame
    df = pd.read_csv(file_path)
    
    # Đảm bảo các cột 'text' và 'label' tồn tại trong dataset của bạn
    df = df[['description', 'category']]  # Điều chỉnh theo cột trong file CSV của bạn
    
    # Chuyển đổi pandas DataFrame thành Hugging Face Dataset
    dataset = Dataset.from_pandas(df)
    return dataset

# Bước 2: Tiền xử lý văn bản (tokenization)
def preprocess_function(examples, tokenizer):
    return tokenizer(examples['description'], padding='max_length', truncation=True, max_length=512)

# Bước 3: Chia tách dữ liệu thành train và test (80% train, 20% test)
def split_dataset(dataset):
    return dataset.train_test_split(test_size=0.2)

# Bước 4: Khởi tạo tokenizer và mô hình BERT
def initialize_model():
    tokenizer = DistilBertTokenizer.from_pretrained('distilbert-base-uncased')
    model = DistilBertForSequenceClassification.from_pretrained('distilbert-base-uncased', num_labels=2)  # Điều chỉnh num_labels
    return tokenizer, model

# Bước 5: Huấn luyện mô hình
def train_model(train_dataset, eval_dataset, tokenizer, model):
    # Tiền xử lý dữ liệu
    train_dataset = train_dataset.map(lambda x: preprocess_function(x, tokenizer), batched=True)
    eval_dataset = eval_dataset.map(lambda x: preprocess_function(x, tokenizer), batched=True)

    # Định nghĩa các tham số huấn luyện
    training_args = TrainingArguments(
        output_dir="../models/optimized_distilbert",          # Kết quả sẽ được lưu vào thư mục này
         evaluation_strategy="epoch",     # Đánh giá mô hình sau mỗi epoch
        save_strategy="epoch",           # Lưu mô hình sau mỗi epoch
        logging_dir="./logs",            # Thư mục lưu logs
        logging_steps=10,                # Số bước để log
        per_device_train_batch_size=8,   # Kích thước batch cho huấn luyện
        per_device_eval_batch_size=8,    # Kích thước batch cho kiểm tra
        num_train_epochs=3,              # Số epoch
        load_best_model_at_end=True,     # Tải mô hình tốt nhất sau mỗi epoch
)
    
    # Đánh giá mô hình
    def compute_metrics(p):
        predictions, labels = p
        preds = predictions.argmax(axis=-1)  # Lấy nhãn dự đoán với xác suất cao nhất
        return {'accuracy': accuracy_score(labels, preds)}  # Tính toán độ chính xác

    # Khởi tạo Trainer
    trainer = Trainer(
        model=model,                     # Mô hình đã được tải
        args=training_args,              # Tham số huấn luyện
        train_dataset=train_dataset,     # Dữ liệu huấn luyện
        eval_dataset=eval_dataset,       # Dữ liệu kiểm tra
        compute_metrics=compute_metrics  # Đo lường độ chính xác
    )

    # Huấn luyện mô hình
    trainer.train()

# Bước 6: Lưu mô hình và tokenizer
def save_model_and_tokenizer(model, tokenizer):
    model.save_pretrained('./models/optimized_distilbert')
    tokenizer.save_pretrained('./models/optimized_distilbert')

# Main
if __name__ == "__main__":
    # Đọc và xử lý dữ liệu
    dataset = preprocess_data("../data/chi_tieu.csv")  # Đảm bảo đường dẫn đúng tới file CSV
    train_test_split = split_dataset(dataset)
    train_dataset, eval_dataset = train_test_split['train'], train_test_split['test']

    # Khởi tạo tokenizer và mô hình
    tokenizer, model = initialize_model()

    # Huấn luyện mô hình
    train_model(train_dataset, eval_dataset, tokenizer, model)

    # Lưu mô hình và tokenizer
    save_model_and_tokenizer(model, tokenizer)

    print("Model has been trained and saved successfully!")
