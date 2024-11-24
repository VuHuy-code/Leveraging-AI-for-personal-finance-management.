import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaGoogle, FaFacebook } from 'react-icons/fa';
import { toast } from 'react-toastify';
import authService from './authService';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authService.login(email, password);
      toast.success('Đăng nhập thành công!');
      onLogin();
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gradient-to-r from-blue-950 via-black to-blue-950 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-gray-900/70 backdrop-blur-md rounded-xl p-10 shadow-[0_4px_15px_0px_rgba(0,119,255,0.3),0_4px_15px_0px_rgba(0,255,200,0.3)]">
        <div className="text-center">
          <h2 className="pb-1 text-4xl font-bold text-white">
            Đăng Nhập
          </h2>
          <p className="mt-4 text-gray-300">
            Hoặc{' '}
            <button
              onClick={() => navigate('/')}
              className="font-medium text-blue-400 hover:text-cyan-400"
            >
              quay lại trang chủ
            </button>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email-address" className="sr-only">
              Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 flex items-center left-4">
                <FaEnvelope className="text-blue-400" />
              </span>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                placeholder="Địa chỉ email"
                className="w-full py-3 pl-12 pr-4 text-gray-100 border-none rounded-full bg-gray-800/70 focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="sr-only">
              Mật khẩu
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 flex items-center left-4">
                <FaLock className="text-blue-400" />
              </span>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Mật khẩu"
                className="w-full py-3 pl-12 pr-4 text-gray-100 border-none rounded-full bg-gray-800/70 focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 text-sm text-gray-400"
              >
                Ghi nhớ đăng nhập
              </label>
            </div>
            <button
              type="button"
              className="text-sm text-blue-400 hover:text-cyan-400"
            >
              Quên mật khẩu?
            </button>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-full text-white font-bold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <p className="text-center text-gray-300">Hoặc đăng nhập với</p>
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

export default Login;