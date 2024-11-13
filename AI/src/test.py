import pandas as pd
from sklearn.preprocessing import LabelEncoder
from transformers import BertTokenizer

# Khởi tạo LabelEncoder và Tokenizer
label_encoder = LabelEncoder()
tokenizer = BertTokenizer.from_pretrained("distilbert-base-uncased")

def preprocess_new_data(new_data):
    """Tiền xử lý dữ liệu để tạo tập huấn luyện và đánh giá."""
    if 'category' not in new_data.columns or 'description' not in new_data.columns:
        raise ValueError("Dữ liệu không có đủ cột cần thiết ('description', 'category').")
    
    # Kiểm tra nhãn đã có trong label_encoder
    all_categories = new_data['category'].unique()  # Lấy tất cả nhãn trong new_data
    
    # Cập nhật LabelEncoder nếu có nhãn mới
    label_encoder.fit(all_categories)  # Huấn luyện lại với tất cả nhãn mới

    # Mã hóa nhãn
    labels = label_encoder.transform(new_data['category'])
    
    # Tokenize mô tả
    encodings = tokenizer(new_data['description'].tolist(), truncation=True, padding=True, max_length=128, return_tensors="pt")
    encodings['labels'] = labels
    
    return encodings

def update_model(new_data):
    """Cập nhật mô hình với dữ liệu mới."""
    # Tiền xử lý dữ liệu
    encodings = preprocess_new_data(new_data)
    
    # Huấn luyện lại mô hình hoặc cập nhật mô hình hiện tại (ở đây chỉ là một mô phỏng)
    print("Dữ liệu đã được tiền xử lý và mô hình sẵn sàng để cập nhật.")
    print(f"Ví dụ về encodings: {encodings}")

# Tạo dữ liệu chi tiêu lớn hơn
new_data = pd.DataFrame({
    "description": [
        "Đặt vé xem phim",
        "Mua sắm tại cửa hàng thời trang",
        "Thanh toán hóa đơn điện",
        "Mua đồ ăn nhanh",
        "Đổ xăng",
        "Đi chơi công viên",
        "Mua vé máy bay",
        "Đặt phòng khách sạn",
        "Mua sách",
        "Thanh toán internet",
        "Đặt hàng từ nhà hàng",
        "Mua quà sinh nhật",
        "Đăng ký thành viên phòng tập gym",
        "Thanh toán bảo hiểm",
        "Mua vé xem hòa nhạc",
        "Đặt hàng trực tuyến",
        "Chi phí sửa chữa xe",
        "Mua đồ nội thất",
        "Thanh toán điện thoại",
        "Mua thiết bị điện tử"
    ],
    "category": [
        "Giải trí",
        "Mua sắm",
        "Hóa đơn",
        "Ăn uống",
        "Di chuyển",
        "Giải trí",
        "Du lịch",
        "Du lịch",
        "Giáo dục",
        "Hóa đơn",
        "Ăn uống",
        "Quà tặng",
        "Sức khỏe",
        "Hóa đơn",
        "Giải trí",
        "Mua sắm",
        "Sửa chữa",
        "Mua sắm",
        "Hóa đơn",
        "Mua sắm"
    ]
})

# Kiểm tra dữ liệu trước khi gọi update_model
if new_data.empty or new_data['description'].isnull().any():
    raise ValueError("Dữ liệu đầu vào trống hoặc chứa giá trị NaN trong cột 'description'.")

# Gọi hàm update_model với tập dữ liệu mới
update_model(new_data)
