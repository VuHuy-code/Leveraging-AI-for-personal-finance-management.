import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
import joblib
from sklearn.metrics import accuracy_score

#Đọc lại dữ liệu đã chia
train_data = pd.read_csv('../data/train.csv')
test_data = pd.read_csv('../data/test.csv')

#Mã hóa văn bản với TfidfVectorizer
vectorizer = TfidfVectorizer(max_features=5000)
X_train_transformed = vectorizer.fit_transform(train_data['description'])
X_test_transformed = vectorizer.transform(test_data['description'])

#Huấn luyện mô hình Naive Bayes
model = MultinomialNB()
model.fit(X_train_transformed, train_data['category'])

#Đánh giá mô hình
y_pred = model.predict(X_test_transformed)
accuracy = accuracy_score(test_data['category'], y_pred)
print(f"Accuracy: {accuracy}")
print(train_data['category'].value_counts())
#Lưu mô hình và vectorizer
joblib.dump(model, "../models/chi_tieu_model.pkl")
joblib.dump(vectorizer, "../models/tfidf_vectorizer.pkl")