import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaUser, FaGoogle, FaFacebook } from 'react-icons/fa';
import { toast } from 'react-toastify';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (formData.password !== formData.confirmPassword) {
        toast.error('Mật khẩu không khớp!');
        return;
      }

      // Giả lập API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Đăng ký thành công!');
      navigate('/login');
    } catch (error) {
      toast.error('Đã có lỗi xảy ra!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gradient-to-r from-blue-950 via-black to-blue-950 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-gray-900/70 backdrop-blur-md rounded-xl p-10 shadow-[0_4px_15px_0px_rgba(0,119,255,0.3),0_4px_15px_0px_rgba(0,255,200,0.3)]">
        <div className="text-center">
          <h2 className="pb-1 text-4xl font-bold text-white">
            Đăng Ký
          </h2>
          <p className="mt-4 text-gray-300">
            Đã có tài khoản?{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-medium text-blue-400 hover:text-cyan-400"
            >
              Đăng nhập
            </button>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="relative">
              <span className="absolute inset-y-0 flex items-center left-4">
                <FaUser className="text-blue-400" />
              </span>
              <input
                name="fullName"
                type="text"
                required
                placeholder="Họ và tên"
                className="w-full py-3 pl-12 pr-4 text-gray-100 border-none rounded-full bg-gray-800/70 focus:ring-2 focus:ring-blue-500"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <span className="absolute inset-y-0 flex items-center left-4">
                <FaEnvelope className="text-blue-400" />
              </span>
              <input
                name="email"
                type="email"
                required
                placeholder="Địa chỉ email"
                className="w-full py-3 pl-12 pr-4 text-gray-100 border-none rounded-full bg-gray-800/70 focus:ring-2 focus:ring-blue-500"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <span className="absolute inset-y-0 flex items-center left-4">
                <FaLock className="text-blue-400" />
              </span>
              <input
                name="password"
                type="password"
                required
                placeholder="Mật khẩu"
                className="w-full py-3 pl-12 pr-4 text-gray-100 border-none rounded-full bg-gray-800/70 focus:ring-2 focus:ring-blue-500"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <span className="absolute inset-y-0 flex items-center left-4">
                <FaLock className="text-blue-400" />
              </span>
              <input
                name="confirmPassword"
                type="password"
                required
                placeholder="Xác nhận mật khẩu"
                className="w-full py-3 pl-12 pr-4 text-gray-100 border-none rounded-full bg-gray-800/70 focus:ring-2 focus:ring-blue-500"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-full text-white font-bold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Đang xử lý...' : 'Đăng Ký'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <p className="text-center text-gray-300">Hoặc đăng ký với</p>
          <div className="flex justify-center gap-4 mt-4">
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-6 py-3 text-gray-100 transition-transform duration-300 rounded-full bg-gray-800/70 hover:bg-gray-700 hover:scale-105"
            >
              <FaGoogle className="text-red-500" />
              Google
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-6 py-3 text-gray-100 transition-transform duration-300 rounded-full bg-gray-800/70 hover:bg-gray-700 hover:scale-105"
            >
              <FaFacebook className="text-blue-500" />
              Facebook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;