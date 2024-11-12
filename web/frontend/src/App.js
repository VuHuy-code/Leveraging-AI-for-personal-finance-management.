import React, { useState } from 'react';
import './App.css';
import Home from './Home'; // Trang chủ
import Login from './Login'; // Trang đăng nhập

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Quản lý trạng thái đăng nhập
  const [userInfo, setUserInfo] = useState(null); // Lưu thông tin người dùng nếu cần

  // Hàm xử lý đăng nhập
  const handleLogin = (email, password) => {
    if (email === 'admin@hehe' && password === 'admin') {
      setIsLoggedIn(true); // Đăng nhập thành công
      setUserInfo({ email }); // Lưu thông tin người dùng (có thể mở rộng thêm)
    } else {
      alert('Thông tin đăng nhập không đúng!');
    }
  };

  return (
    <div className="App">
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Home userInfo={userInfo} />
      )}
    </div>
  );
}

export default App;