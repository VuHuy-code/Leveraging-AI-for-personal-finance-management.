import React from 'react';

function Dashboard() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-gray-800 via-gray-900 to-black text-white font-sans">

      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white p-6 shadow-2xl backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-4xl font-bold tracking-wide text-white hover:text-blue-300 transition-all">Quản Lý Chi Tiêu</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto p-8 space-y-16">
        
        {/* About Section */}
        <section id="about" className="bg-opacity-30 backdrop-blur-md p-8 rounded-lg shadow-lg">
          <h2 className="text-3xl font-semibold mb-4 text-white">Chức Năng Quản Lý Chi Tiêu</h2>
          <p className="text-lg text-white">
            Bạn có thể theo dõi các khoản chi tiêu của mình, phân tích chi tiêu và lập kế hoạch ngân sách cho từng khoản mục. Hãy bắt đầu quản lý tài chính của bạn ngay hôm nay!
          </p>
        </section>

        {/* Dashboard Features */}
        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-2xl transition transform hover:scale-105">
            <h3 className="text-xl font-semibold text-white mb-4">Theo Dõi Chi Tiêu</h3>
            <p className="text-white">
              Ghi lại mọi khoản chi tiêu hàng ngày và phân loại chúng theo từng mục để dễ dàng theo dõi và điều chỉnh ngân sách.
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-2xl transition transform hover:scale-105">
            <h3 className="text-xl font-semibold text-white mb-4">Phân Tích Chi Tiêu</h3>
            <p className="text-white">
              Phân tích chi tiêu của bạn thông qua các biểu đồ và báo cáo chi tiết để nhận diện xu hướng và điều chỉnh chi tiêu hiệu quả hơn.
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-2xl transition transform hover:scale-105">
            <h3 className="text-xl font-semibold text-white mb-4">Lập Kế Hoạch Ngân Sách</h3>
            <p className="text-white">
              Thiết lập ngân sách cho các mục chi tiêu và theo dõi chúng để đảm bảo bạn luôn chi tiêu trong phạm vi ngân sách.
            </p>
          </div>
        </section>

        {/* Guide Section */}
        <section className="bg-gray-800 p-8 rounded-lg shadow-lg">
          <h2 className="text-3xl font-semibold text-white mb-4">Hướng Dẫn Sử Dụng</h2>
          <p className="text-lg text-white mb-4">
            Dưới đây là một số bước cơ bản để bạn có thể bắt đầu sử dụng hệ thống quản lý chi tiêu này:
          </p>
          <ol className="list-decimal list-inside text-lg text-white">
            <li className="mb-2">Đăng nhập vào hệ thống để bắt đầu quản lý tài chính của bạn.</li>
            <li className="mb-2">Thêm các khoản chi tiêu và phân loại chúng vào các mục cụ thể.</li>
            <li className="mb-2">Thiết lập ngân sách cho mỗi mục chi tiêu và theo dõi chúng định kỳ.</li>
            <li className="mb-2">Xem các báo cáo chi tiêu để điều chỉnh và tối ưu hóa ngân sách của bạn.</li>
          </ol>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 border-t-2 border-gray-600 mt-auto">
        <div className="max-w-7xl mx-auto text-center">
          <p>&copy; 2024 Quản Lý Chi Tiêu. Tất cả quyền được bảo vệ.</p>
          <div className="mt-4">
            <a href="https://facebook.com" className="text-white hover:text-blue-400 mx-4">Facebook</a>
            <a href="https://twitter.com" className="text-white hover:text-blue-400 mx-4">Twitter</a>
            <a href="https://linkedin.com" className="text-white hover:text-blue-400 mx-4">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;
