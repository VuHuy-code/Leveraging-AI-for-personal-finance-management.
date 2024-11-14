import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home';
import Login from './Login';
import Dashboard from './Dashboard';
import Statistics from './Statistics';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('isAuthenticated')
  );

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
  };

  return (
    <div>
      <ToastContainer />
      <Router>
        <Routes>
          {/* Đường dẫn cho trang Home, nếu đã đăng nhập thì chuyển hướng tới Dashboard */}
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Home />} />

          {/* Đường dẫn cho trang Login, nếu đã đăng nhập thì chuyển hướng tới Dashboard */}
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />

          {/* Đường dẫn bảo vệ cho Dashboard */}
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                <Dashboard onLogout={handleLogout} />
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Đường dẫn bảo vệ cho Statistics */}
          <Route
            path="/statistics"
            element={
              isAuthenticated ? (
                <Statistics onLogout={handleLogout} />
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Đường dẫn cho trang không tồn tại */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
