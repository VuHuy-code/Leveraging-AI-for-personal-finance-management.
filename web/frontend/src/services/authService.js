import axios from 'axios';

const API_URL = 'https://congenial-fiesta-p5r7r4vq47r396p7-5000.app.github.dev/api/auth/';

const register = async (fullName, email, password) => {
  try {
    const response = await axios.post(`${API_URL}register`, {
      fullName,
      email,
      password
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error('Đã có lỗi xảy ra!');
    }
  }
};
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 5000
});


const requestPasswordReset = async (email) => {
  try {
    console.log('Sending reset request for email:', email);
    const response = await axiosInstance.post('forgot-password', { email });
    console.log('Reset response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Full error:', error);
    if (!error.response) {
      throw new Error('Không thể kết nối đến server. Vui lòng thử lại sau!');
    }
    throw new Error(error.response?.data?.message || 'Đã có lỗi xảy ra!');
  }
};

const resetPassword = async (token, newPassword) => {
  try {
    const response = await axiosInstance.post('reset-password', { token, newPassword });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Đã có lỗi xảy ra!');
  }
};

const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}login`, { email, password });
    if (response && response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error('Đã có lỗi xảy ra!');
    }
  }
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('user'));
};

const saveToken = (token) => {
  localStorage.setItem('token', token);
};

const saveUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

const authService = {
  register,
  requestPasswordReset,
  resetPassword,
  saveToken,
  saveUser,
  login,
  logout,
  getCurrentUser,
};

export default authService;