import React, { useState, useEffect } from 'react';
import { FaSignOutAlt, FaChartLine, FaBullseye, FaSearch, FaBell, FaRegLightbulb } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

function Dashboard({ onLogout }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.name) {
      setUserName(user.name);
    }
  }, []);


  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen text-white bg-gradient-to-r from-blue-950 via-black to-blue-950">
      <div className="flex flex-col w-64 p-6 space-y-6 bg-gray-800/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <h2 className="text-2xl font-bold text-white">Finance AI</h2>
        </div>
        
        <div 
          className="flex items-center p-3 space-x-2 rounded-lg cursor-pointer hover:bg-gray-700/50" 
          onClick={() => navigate('/statistics')}
        >
          <FaChartLine className="text-white" />
          <span className="ml-2">Thống Kê Chi Tiêu</span>
        </div>

        <div 
          className="flex items-center p-3 space-x-2 rounded-lg cursor-pointer hover:bg-gray-700/50" 
          onClick={() => navigate('/savings')}
        >
          <FaBullseye className="text-white" />
          <span className="ml-2">Mục Tiêu Tiết Kiệm</span>
        </div>

        <div className="flex-1"></div>

        <button 
          onClick={handleLogout}
          className="flex items-center w-full p-3 mt-auto text-white rounded-lg hover:bg-gray-700/50"
        >
          <FaSignOutAlt className="mr-3 text-white" /> Đăng xuất
        </button>
      </div>

      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">
            Xin chào, {userName}!
          </h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input 
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Tìm kiếm..."
                className="w-64 px-4 py-2 text-white rounded-lg bg-gray-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FaSearch className="absolute text-white transform -translate-y-1/2 right-3 top-1/2" />
            </div>
            
            <div className="relative">
              <FaBell className="text-xl text-white cursor-pointer hover:text-gray-300" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </div>
          </div>
        </div>

        {/* Phân tích và Gợi ý */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg shadow-[#1e3a8a]">
            <div className="flex items-center mb-6 space-x-3">
              <FaChartLine className="text-2xl text-white" />
              <h2 className="text-xl font-bold text-white">Phân Tích Chi Tiêu</h2>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-gray-700/50">
                <h4 className="mb-2 font-semibold text-white">Chi Tiêu Lớn Nhất</h4>
                <p className="text-white">Ăn uống: 1,200,000₫ (48%)</p>
                <div className="w-full h-2 mt-2 bg-gray-600 rounded-full">
                  <div className="w-1/2 h-2 bg-blue-600 rounded-full"></div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-gray-700/50">
                <h4 className="mb-2 font-semibold text-white">Tiết Kiệm Tốt Nhất</h4>
                <p className="text-white">Di chuyển: -150,000₫ (-15%)</p>
                <div className="w-full h-2 mt-2 bg-gray-600 rounded-full">
                  <div className="w-1/3 h-2 bg-blue-600 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg shadow-[#1e3a8a]">
            <div className="flex items-center mb-6 space-x-3">
              <FaRegLightbulb className="text-2xl text-white" />
              <h2 className="text-xl font-bold text-white">Gợi Ý Tài Chính</h2>
            </div>
            <div className="space-y-4">
              <div className="flex p-4 space-x-4 rounded-lg bg-gray-700/50">
                <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full bg-blue-600/20">
                  <FaBullseye className="text-white" />
                </div>
                <div>
                  <h4 className="mb-1 font-semibold text-white">Cơ Hội Tiết Kiệm</h4>
                  <p className="text-sm text-white">Giảm 20% chi tiêu ăn uống ngoài có thể tiết kiệm thêm 240,000₫/tháng</p>
                </div>
              </div>
              <div className="flex p-4 space-x-4 rounded-lg bg-gray-700/50">
                <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full bg-blue-600/20">
                  <FaChartLine className="text-white" />
                </div>
                <div>
                  <h4 className="mb-1 font-semibold text-white">Xu Hướng Tích Cực</h4>
                  <p className="text-sm text-white">Chi tiêu của bạn đã giảm 15% so với tháng trước. Hãy duy trì xu hướng này!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;