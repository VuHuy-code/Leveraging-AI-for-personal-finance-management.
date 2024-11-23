import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaArrowLeft, FaTrash, FaEdit } from 'react-icons/fa';

function Savings() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [savingsGoals, setSavingsGoals] = useState([
    {
      id: 1,
      title: 'Mua laptop mới',
      targetAmount: 25000000,
      currentAmount: 15000000,
      deadline: '2024-12-31',
      category: 'Công nghệ',
      priority: 'Cao'
    },
    {
      id: 2,
      title: 'Du lịch Đà Nẵng',
      targetAmount: 15000000,
      currentAmount: 5000000,
      deadline: '2024-12-12',
      category: 'Du lịch',
      priority: 'Trung bình'
    }
  ]);

  const [newGoal, setNewGoal] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '',
    deadline: '',
    category: '',
    priority: 'Trung bình'
  });

  const getPriorityValue = (priority) => {
    switch (priority) {
      case 'Cao':
        return 3;
      case 'Trung bình':
        return 2;
      case 'Thấp':
        return 1;
      default:
        return 0;
    }
  };

  const sortedSavingsGoals = [...savingsGoals].sort((a, b) => {
    return getPriorityValue(b.priority) - getPriorityValue(a.priority);
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewGoal(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingGoal) {
      setSavingsGoals(prev => 
        prev.map(goal => 
          goal.id === editingGoal.id 
            ? { ...newGoal, id: goal.id } 
            : goal
        )
      );
    } else {
      setSavingsGoals(prev => [
        ...prev,
        { ...newGoal, id: Date.now() }
      ]);
    }
    setShowModal(false);
    setEditingGoal(null);
    setNewGoal({
      title: '',
      targetAmount: '',
      currentAmount: '',
      deadline: '',
      category: '',
      priority: 'Trung bình'
    });
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setNewGoal(goal);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setSavingsGoals(prev => prev.filter(goal => goal.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-950 via-black to-blue-950">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 text-white rounded-lg hover:bg-gray-700/50"
            >
              <FaArrowLeft className="text-xl text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white">
              Mục Tiêu Tiết Kiệm
            </h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 space-x-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <FaPlus className="text-white" />
            <span>Thêm Mục Tiêu</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedSavingsGoals.map(goal => (
            <div
              key={goal.id}
              className="p-6 transition-transform duration-300 transform bg-gray-800/50 backdrop-blur-sm rounded-xl hover:scale-105 shadow-lg shadow-[#1e3a8a]"
            >
              <div className="flex justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">{goal.title}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(goal)}
                    className="p-2 text-white hover:text-gray-300"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="p-2 text-white hover:text-gray-300"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-white">Mục tiêu: {goal.targetAmount.toLocaleString()}₫</p>
                <p className="text-white">Hiện tại: {goal.currentAmount.toLocaleString()}₫</p>
                <p className="text-white">Hạn chót: {new Date(goal.deadline).toLocaleDateString()}</p>
                <p className="text-white">Danh mục: {goal.category}</p>
                <p className="text-white">
                  Độ ưu tiên: {' '}
                  <span className={`font-medium ${
                    goal.priority === 'Cao' ? 'text-red-500' : 
                    goal.priority === 'Trung bình' ? 'text-yellow-500' : 
                    'text-green-500'
                  }`}>
                    {goal.priority}
                  </span>
                </p>
              </div>
              <div className="relative pt-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="inline-block px-2 py-1 text-xs font-semibold text-white uppercase bg-blue-600 rounded-full">
                      Tiến độ
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="inline-block text-xs font-semibold text-white">
                      {Math.round((goal.currentAmount / goal.targetAmount) * 100)}%
                    </span>
                  </div>
                </div>
                <div className="flex h-2 mb-4 overflow-hidden text-xs bg-gray-700 rounded">
                  <div
                    style={{ width: `${(goal.currentAmount / goal.targetAmount) * 100}%` }}
                    className="flex flex-col justify-center text-center text-white bg-blue-600 shadow-none whitespace-nowrap"
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md p-8 bg-gray-800 rounded-xl shadow-lg shadow-[#1e3a8a]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  {editingGoal ? 'Chỉnh Sửa Mục Tiêu' : 'Thêm Mục Tiêu Mới'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingGoal(null);
                  }}
                  className="text-white hover:text-gray-300"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block mb-1 text-sm text-white">Tên mục tiêu</label>
                  <input
                    type="text"
                    name="title"
                    value={newGoal.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm text-white">Số tiền mục tiêu</label>
                  <input
                    type="number"
                    name="targetAmount"
                    value={newGoal.targetAmount}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm text-white">Số tiền hiện tại</label>
                  <input
                    type="number"
                    name="currentAmount"
                    value={newGoal.currentAmount}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm text-white">Hạn chót</label>
                  <input
                    type="date"
                    name="deadline"
                    value={newGoal.deadline}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm text-white">Danh mục</label>
                  <input
                    type="text"
                    name="category"
                    value={newGoal.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm text-white">Độ ưu tiên</label>
                  <select
                    name="priority"
                    value={newGoal.priority}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Cao">Cao</option>
                    <option value="Trung bình">Trung bình</option>
                    <option value="Thấp">Thấp</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingGoal(null);
                    }}
                    className="px-4 py-2 text-white bg-gray-700 rounded-lg hover:bg-gray-600"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    {editingGoal ? 'Cập Nhật' : 'Thêm'}
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

export default Savings;