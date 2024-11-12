import React, { useState } from 'react';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password); // Gọi hàm đăng nhập từ App.js
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-r from-gray-800 via-gray-900 to-black">
      <div className="bg-white bg-opacity-20 backdrop-blur-sm p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-semibold text-center text-white mb-6">Đăng Nhập</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 mt-2 border border-gray-400 rounded-lg bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              placeholder="Nhập email của bạn"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 mt-2 border border-gray-400 rounded-lg bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              placeholder="Nhập mật khẩu của bạn"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-300 focus:outline-none"
          >
            Đăng Nhập
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
