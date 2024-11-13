import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home';
import Login from './Login';
import Dashboard from './Dashboard';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Hàm đăng nhập giả lập
  const handleLogin = (email, password) => {
    if (email === 'admin@hehe' && password === 'admin') {
      setIsLoggedIn(true);
    } else {
      alert('Thông tin đăng nhập không đúng!');
    }
  };

  return (
    <Router>
      <Routes>
        {/* Route đến trang Home */}
        <Route path="/" element={<Home />} />

        {/* Route đến trang Login */}
        <Route 
          path="/login" 
          element={isLoggedIn ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} 
        />

        {/* Route đến trang Dashboard (Tính Năng) */}
        <Route 
          path="/dashboard" 
          element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
