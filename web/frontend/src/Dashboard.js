import React, { useState } from 'react';
import { FaSignOutAlt, FaChartLine, FaBullseye, FaSearch, FaBell } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

function Dashboard({ onLogout }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Xử lý sự kiện tìm kiếm
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleLogout = () => {
    onLogout(); // Gọi hàm đăng xuất từ props
    navigate('/'); // Dẫn tới trang chủ
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 p-6 space-y-6 flex flex-col">
        <h2 className="text-2xl font-bold">Fiction AI</h2>
        
        {/* Thống Kê Chi Tiêu */}
        <div 
          className="flex items-center space-x-2 hover:bg-gray-700 p-3 rounded-lg cursor-pointer" 
          onClick={() => navigate('/statistics')}
        >
          <FaChartLine />
          <span className="ml-2">Thống Kê Chi Tiêu</span>
        </div>

        {/* Mục Tiêu Tiết Kiệm */}
        <div 
          className="flex items-center space-x-2 hover:bg-gray-700 p-3 rounded-lg cursor-pointer" 
          onClick={() => navigate('/savings')}
        >
          <FaBullseye />
          <span className="ml-2">Mục Tiêu Tiết Kiệm</span>
        </div>

        {/* Phần còn lại của nội dung Sidebar */}
        <div className="flex-1"></div>

        {/* Đăng xuất */}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center p-3 rounded-lg hover:bg-gray-700 text-white mt-auto"
        >
          <FaSignOutAlt className="mr-3" /> Đăng xuất
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          {/* Thanh tìm kiếm dịch qua phải */}
          <div className="relative max-w-xs w-full ml-auto">
            <input 
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Tìm kiếm..."
              className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white" />
          </div>
          
          {/* Icon Thông Báo */}
          <div className="ml-4">
            <FaBell className="text-xl cursor-pointer hover:text-blue-400" />
          </div>
        </div>

        {/* Nội dung Giới thiệu và Hướng dẫn mới */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-md shadow-[#1e3a8a] bg-opacity-60 mb-6">
          <h2 className="text-2xl font-bold mb-4">Khám Phá Cách Tối Ưu Hóa Tài Chính Của Bạn</h2>
          <p className="text-sm text-gray-400 mb-4">
            Chào mừng bạn đến với Fiction AI! Đây là nơi bạn có thể theo dõi chi tiêu hàng ngày và đặt ra các mục tiêu tiết kiệm cho tương lai. Hãy bắt đầu hành trình quản lý tài chính thông minh của bạn ngay hôm nay!
          </p>
          <h3 className="text-xl font-semibold text-blue-400 mb-2">Các Tính Năng Nổi Bật:</h3>
          <ul className="list-disc pl-6 text-sm text-gray-400 mb-4">
            <li>Theo dõi chi tiêu theo danh mục và phân tích dữ liệu chi tiết.</li>
            <li>Đặt mục tiêu tiết kiệm và theo dõi tiến trình thực hiện.</li>
            <li>Nhận thông báo nhắc nhở về chi tiêu và các cột mốc tiết kiệm quan trọng.</li>
            <li>Tính năng tìm kiếm giúp bạn dễ dàng tìm kiếm các mục trong hệ thống.</li>
          </ul>
          <h3 className="text-xl font-semibold text-blue-400 mb-2">Tại Sao Bạn Cần Quản Lý Tài Chính?</h3>
          <p className="text-sm text-gray-400 mb-4">
            Quản lý tài chính là một phần quan trọng giúp bạn duy trì ổn định cuộc sống và chuẩn bị cho tương lai. Việc theo dõi chi tiêu và đặt ra mục tiêu tiết kiệm không chỉ giúp bạn kiểm soát dòng tiền mà còn tạo nền tảng vững chắc cho các kế hoạch dài hạn.
          </p>
          <h3 className="text-xl font-semibold text-blue-400 mb-2">Lợi Ích Khi Sử Dụng Fiction AI:</h3>
          <ul className="list-disc pl-6 text-sm text-gray-400 mb-4">
            <li>Giúp bạn nhìn thấy rõ ràng dòng tiền của mình, từ đó ra quyết định chi tiêu thông minh hơn.</li>
            <li>Cung cấp các báo cáo chi tiết về chi tiêu và tiết kiệm, giúp bạn điều chỉnh ngân sách kịp thời.</li>
            <li>Khuyến khích bạn đạt được các mục tiêu tài chính thông qua các công cụ theo dõi và thông báo tích cực.</li>
          </ul>
          <p className="text-sm text-gray-400 mt-4">
            Đừng quên kiểm tra các mục tiêu tiết kiệm và điều chỉnh chiến lược tài chính của bạn mỗi tháng để đạt được thành công trong việc quản lý tài chính cá nhân.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
