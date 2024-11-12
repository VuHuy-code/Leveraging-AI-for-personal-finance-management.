import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      {/* Header */}
      <header className="bg-blue-600 text-white p-6 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold">Quản Lý Chi Tiêu</h1>
          <nav>
            <ul className="flex space-x-6">
              <li><a href="#about" className="hover:text-blue-200">Giới thiệu</a></li>
              <li><a href="#features" className="hover:text-blue-200">Tính Năng</a></li>
              <li><a href="#contact" className="hover:text-blue-200">Liên hệ</a></li>
            </ul>
          </nav>
        </div>
      </header>

      {/* About Section */}
      <section id="about" className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-4">Giới thiệu Dự Án</h2>
          <p className="text-lg text-gray-700 mb-8">
            Ứng dụng quản lý chi tiêu giúp bạn theo dõi các khoản chi của mình một cách dễ dàng và hiệu quả.
            Từ đó, bạn có thể kiểm soát ngân sách và tiết kiệm tiền.
          </p>
          <a href="#features" className="text-white bg-blue-600 px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition">
            Xem Tính Năng
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-8">Tính Năng Chính</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="feature-item bg-gray-50 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold mb-4">Theo Dõi Chi Tiêu</h3>
              <p className="text-gray-700">
                Ghi lại tất cả các khoản chi tiêu hàng ngày và phân loại chúng để dễ dàng theo dõi.
              </p>
            </div>
            <div className="feature-item bg-gray-50 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold mb-4">Phân Tích Chi Tiêu</h3>
              <p className="text-gray-700">
                Ứng dụng cung cấp các biểu đồ và báo cáo chi tiết về các khoản chi tiêu của bạn.
              </p>
            </div>
            <div className="feature-item bg-gray-50 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold mb-4">Lập Kế Hoạch Ngân Sách</h3>
              <p className="text-gray-700">
                Cài đặt ngân sách cho các khoản mục và nhận thông báo khi gần đạt ngưỡng.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Use Section */}
      <section id="how-to-use" className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-8">Cách Sử Dụng</h2>
          <p className="text-lg text-gray-700 mb-8">
            Để bắt đầu sử dụng ứng dụng, bạn chỉ cần:
            <ol className="list-decimal list-inside text-left text-lg text-gray-700">
              <li>Nhập các khoản chi tiêu vào hệ thống.</li>
              <li>Phân loại các khoản chi để dễ dàng theo dõi.</li>
              <li>Lập kế hoạch ngân sách cho từng mục chi tiêu.</li>
              <li>Kiểm tra báo cáo chi tiêu hàng tuần hoặc hàng tháng.</li>
            </ol>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-blue-600 text-white py-8">
        <div className="max-w-7xl mx-auto text-center">
          <p>&copy; 2024 Quản Lý Chi Tiêu. Tất cả quyền được bảo vệ.</p>
          <div className="mt-4">
            <a href="https://facebook.com" className="text-white hover:text-blue-200 mx-4">Facebook</a>
            <a href="https://twitter.com" className="text-white hover:text-blue-200 mx-4">Twitter</a>
            <a href="https://linkedin.com" className="text-white hover:text-blue-200 mx-4">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
