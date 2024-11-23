import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaWallet, FaChartLine, FaArrowLeft, FaPlus, FaTimes } from 'react-icons/fa';
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

function Statistics() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showModal, setShowModal] = useState(false);
  const [transactionData, setTransactionData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const categories = {
    expense: ['Ăn uống', 'Di chuyển', 'Mua sắm', 'Giải trí', 'Khác'],
    income: ['Lương', 'Thưởng', 'Đầu tư', 'Khác']
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTransactionData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Transaction Data:', transactionData);
    setShowModal(false);
    setTransactionData({
      type: 'expense',
      amount: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
  };
  
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

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-950 via-black to-blue-950">
      {/* Sidebar */}
      <div className="fixed top-0 left-0 flex flex-col w-64 h-full p-4 bg-gray-800/50 backdrop-blur-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">FinanceAI</h1>
        </div>
        
        <nav className="flex-grow space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center p-3 rounded-lg ${
              activeTab === 'overview' ? 'bg-blue-600' : 'hover:bg-gray-700/50'
            } text-white`}
          >
            <FaWallet className="mr-3" /> Tổng quan
          </button>
          
          <button 
            onClick={() => setActiveTab('transactions')}
            className={`w-full flex items-center p-3 rounded-lg ${
              activeTab === 'transactions' ? 'bg-blue-600' : 'hover:bg-gray-700/50'
            } text-white`}
          >
            <FaChartLine className="mr-3" /> Giao dịch
          </button>
        </nav>

        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center w-full p-3 mt-4 text-white rounded-lg hover:bg-gray-700/50"
        >
          <FaArrowLeft className="mr-3" /> Back
        </button>
      </div>

      {/* Main Content */}
      <div className="p-8 ml-64">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white">Xin chào, User!</h2>
            <p className="text-gray-400">Đây là tổng quan tài chính của bạn</p>
          </div>
          
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <FaPlus className="mr-2" /> Thêm giao dịch
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-lg shadow-[#1e3a8a]">
            <h3 className="mb-2 text-gray-400">Tổng số dư</h3>
            <p className="text-2xl font-bold text-white">5,000,000 VNĐ</p>
            <span className="text-sm text-green-500">+2.5% so với tháng trước</span>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-lg shadow-[#1e3a8a]">
            <h3 className="mb-2 text-gray-400">Chi tiêu tháng này</h3>
            <p className="text-2xl font-bold text-white">2,500,000 VNĐ</p>
            <span className="text-sm text-red-500">+5% so với tháng trước</span>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-lg shadow-[#1e3a8a]">
            <h3 className="mb-2 text-gray-400">Tiết kiệm</h3>
            <p className="text-2xl font-bold text-white">1,500,000 VNĐ</p>
            <span className="text-sm text-green-500">Đạt 75% mục tiêu</span>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-lg shadow-[#1e3a8a]">
            <h3 className="mb-4 text-white">Chi tiêu theo thời gian</h3>
            <Line data={lineChartData} options={{ responsive: true }} />
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-lg shadow-[#1e3a8a]">
            <h3 className="mb-4 text-white">Phân bổ chi tiêu</h3>
            <Pie data={pieChartData} options={{ responsive: true }} />
          </div>
        </div>

        {/* Transaction Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md p-6 shadow-lg bg-gray-800/95 backdrop-blur-sm rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Thêm Giao Dịch Mới</h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm text-gray-300">Loại giao dịch</label>
                  <select
                    name="type"
                    value={transactionData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="expense">Chi tiêu</option>
                    <option value="income">Thu nhập</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-sm text-gray-300">Số tiền (VNĐ)</label>
                  <input
                    type="number"
                    name="amount"
                    value={transactionData.amount}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập số tiền..."
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm text-gray-300">Danh mục</label>
                  <select
                    name="category"
                    value={transactionData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Chọn danh mục</option>
                    {categories[transactionData.type].map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-sm text-gray-300">Ngày</label>
                  <input
                    type="date"
                    name="date"
                    value={transactionData.date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm text-gray-300">Mô tả</label>
                  <textarea
                    name="description"
                    value={transactionData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập mô tả..."
                    rows="3"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Lưu
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Statistics;