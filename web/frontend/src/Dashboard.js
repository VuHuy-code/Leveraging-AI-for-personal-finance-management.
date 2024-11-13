import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaWallet, FaChartLine, FaSignOutAlt, FaPlus } from 'react-icons/fa'; // Xóa FaBell và FaCog
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data mẫu cho biểu đồ
  const lineChartData = {
    labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
    datasets: [{
      label: 'Chi tiêu theo tháng',
      data: [650, 590, 800, 810, 560, 550, 400],
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };

  const pieChartData = {
    labels: ['Ăn uống', 'Di chuyển', 'Mua sắm', 'Giải trí', 'Khác'],
    datasets: [{
      data: [30, 20, 25, 15, 10],
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF'
      ]
    }]
  };

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-gray-800 p-4 flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">FinanceAI</h1>
        </div>
        
        <nav className="space-y-2 flex-grow">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center p-3 rounded-lg ${
              activeTab === 'overview' ? 'bg-blue-600' : 'hover:bg-gray-700'
            } text-white`}
          >
            <FaWallet className="mr-3" /> Tổng quan
          </button>
          
          <button 
            onClick={() => setActiveTab('transactions')}
            className={`w-full flex items-center p-3 rounded-lg ${
              activeTab === 'transactions' ? 'bg-blue-600' : 'hover:bg-gray-700'
            } text-white`}
          >
            <FaChartLine className="mr-3" /> Giao dịch
          </button>
        </nav>

        {/* Logout button */}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center p-3 rounded-lg hover:bg-gray-700 text-white mt-auto"
        >
          <FaSignOutAlt className="mr-3" /> Đăng xuất
        </button>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white">Xin chào, User!</h2>
            <p className="text-gray-400">Đây là tổng quan tài chính của bạn</p>
          </div>
          
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700">
            <FaPlus className="mr-2" /> Thêm giao dịch
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg shadow-[#1e3a8a]">
            <h3 className="text-gray-400 mb-2">Tổng số dư</h3>
            <p className="text-2xl font-bold text-white">5,000,000 VNĐ</p>
            <span className="text-green-500 text-sm">+2.5% so với tháng trước</span>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg shadow-[#1e3a8a]">
            <h3 className="text-gray-400 mb-2">Chi tiêu tháng này</h3>
            <p className="text-2xl font-bold text-white">2,500,000 VNĐ</p>
            <span className="text-red-500 text-sm">+5% so với tháng trước</span>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg shadow-[#1e3a8a]">
            <h3 className="text-gray-400 mb-2">Tiết kiệm</h3>
            <p className="text-2xl font-bold text-white">1,500,000 VNĐ</p>
            <span className="text-green-500 text-sm">Đạt 75% mục tiêu</span>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg shadow-[#1e3a8a]">
            <h3 className="text-white mb-4">Chi tiêu theo thời gian</h3>
            <Line data={lineChartData} options={{ responsive: true }} />
          </div>
          
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg shadow-[#1e3a8a]">
            <h3 className="text-white mb-4">Phân bổ chi tiêu</h3>
            <Pie data={pieChartData} options={{ responsive: true }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
