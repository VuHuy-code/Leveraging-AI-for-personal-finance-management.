import React from 'react';
import { Link } from 'react-router-dom';
import { FaSignInAlt, FaMoneyCheckAlt, FaChartPie, FaCalendarAlt } from 'react-icons/fa';  // <-- Add this import

function Home() {
  return (
    <div className="min-h-screen relative bg-gradient-to-r from-gray-800 via-gray-900 to-black">

      {/* Nút đăng nhập ở góc phải */}
      <div className="absolute right-8 top-20">
        <Link
          to="/login" // Dẫn đến trang login
          className="bg-transparent border-2 border-gray-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-gray-700 hover:border-gray-500 transition-all shadow-md hover:shadow-lg"
        >
          <FaSignInAlt className="mr-2 inline-block" /> Đăng Nhập
        </Link>
      </div>

      {/* Nội dung trang */}
      <div className="flex flex-col justify-center items-center py-16 text-center text-white">
        <div className="bg-opacity-20 backdrop-blur-lg p-8 rounded-xl shadow-xl max-w-4xl w-full">
          <h1 className="text-5xl font-bold mb-6">
            Quản Lý Chi Tiêu Cá Nhân - Đơn Giản và Hiệu Quả
          </h1>
          <p className="text-xl mb-8">
            Theo dõi và kiểm soát chi tiêu của bạn một cách dễ dàng, giúp bạn tiết kiệm và đạt được mục tiêu tài chính.
          </p>
        </div>
      </div>

      {/* Tính Năng Nổi Bật */}
      <section className="py-16 bg-gray-900 text-gray-200">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-8">Tính Năng Nổi Bật</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="feature-item bg-opacity-40 backdrop-blur-lg p-8 rounded-lg shadow-lg hover:shadow-2xl transition transform hover:scale-105">
              <FaMoneyCheckAlt className="text-4xl text-blue-400 mb-4 mx-auto" />
              <h3 className="text-2xl font-semibold mb-4">Theo Dõi Chi Tiêu</h3>
              <p>
                Ghi lại tất cả các khoản chi tiêu hàng ngày, phân loại chúng để dễ dàng kiểm soát ngân sách của bạn.
              </p>
            </div>

            <div className="feature-item bg-opacity-40 backdrop-blur-lg p-8 rounded-lg shadow-lg hover:shadow-2xl transition transform hover:scale-105">
              <FaChartPie className="text-4xl text-blue-400 mb-4 mx-auto" />
              <h3 className="text-2xl font-semibold mb-4">Phân Tích Chi Tiêu</h3>
              <p>
                Phân tích chi tiêu với các biểu đồ và báo cáo chi tiết giúp bạn nhận diện xu hướng chi tiêu của mình.
              </p>
            </div>

            <div className="feature-item bg-opacity-40 backdrop-blur-lg p-8 rounded-lg shadow-lg hover:shadow-2xl transition transform hover:scale-105">
              <FaCalendarAlt className="text-4xl text-blue-400 mb-4 mx-auto" />
              <h3 className="text-2xl font-semibold mb-4">Lập Kế Hoạch Ngân Sách</h3>
              <p>
                Thiết lập ngân sách cho các mục chi tiêu và nhận thông báo khi bạn gần đạt ngưỡng chi tiêu của mình.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cách Sử Dụng */}
      <section className="py-16 bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-8">Cách Sử Dụng</h2>
          <p className="text-lg mb-8">
            Để bắt đầu sử dụng ứng dụng, bạn chỉ cần:
          </p>
          <ol className="list-decimal list-inside text-left text-lg mx-auto max-w-2xl">
            <li>Đăng nhập vào hệ thống.</li>
            <li>Nhập các khoản chi tiêu và phân loại chúng.</li>
            <li>Lập kế hoạch ngân sách cho từng mục chi tiêu của bạn.</li>
            <li>Kiểm tra báo cáo chi tiêu hàng tuần hoặc hàng tháng để điều chỉnh kế hoạch.</li>
          </ol>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 border-t-4 border-gray-700">
        <div className="max-w-7xl mx-auto text-center">
          <p>&copy; 2024 Quản Lý Chi Tiêu. Tất cả quyền được bảo vệ.</p>
          <div className="mt-4">
            <a href="https://facebook.com/" className="text-white hover:text-yellow-500 mx-4">Facebook</a>
            <a href="https://twitter.com" className="text-white hover:text-yellow-500 mx-4">Twitter</a>
            <a href="https://linkedin.com" className="text-white hover:text-yellow-500 mx-4">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
