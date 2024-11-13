import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaGoogle, FaFacebook } from 'react-icons/fa';
import { toast } from 'react-toastify';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Giả lập đăng nhập
      if (email === 'admin@hehe' && password === '123456') {
        toast.success('Đăng nhập thành công!');
        navigate('/dashboard');
      } else {
        toast.error('Email hoặc mật khẩu không đúng!');
      }
    } catch (error) {
      toast.error('Đã có lỗi xảy ra!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-10 rounded-xl shadow-2xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Đăng Nhập
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Hoặc{' '}
            <button
              onClick={() => navigate('/')}
              className="font-medium text-blue-400 hover:text-blue-300"
            >
              quay lại trang chủ
            </button>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10
                           border border-gray-600 placeholder-gray-500 text-white
                           rounded-t-md focus:outline-none focus:ring-blue-500
                           focus:border-blue-500 focus:z-10 sm:text-sm
                           bg-gray-700"
                  placeholder="Địa chỉ email"
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
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10
                           border border-gray-600 placeholder-gray-500 text-white
                           rounded-b-md focus:outline-none focus:ring-blue-500
                           focus:border-blue-500 focus:z-10 sm:text-sm
                           bg-gray-700"
                  placeholder="Mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500
                         border-gray-600 rounded bg-gray-700"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                Ghi nhớ đăng nhập
              </label>
            </div>

            <div className="text-sm">
              <button
                type="button"
                className="font-medium text-blue-400 hover:text-blue-300"
              >
                Quên mật khẩu?
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent
                       text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                       ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-gray-400">
                  Hoặc đăng nhập với
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-600
                         rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700
                         hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2
                         focus:ring-gray-500"
              >
                <FaGoogle className="mr-2 h-5 w-5 text-red-500" />
                Google
              </button>
              <button
                type="button"
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-600
                         rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700
                         hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2
                         focus:ring-gray-500"
              >
                <FaFacebook className="mr-2 h-5 w-5 text-blue-500" />
                Facebook
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;