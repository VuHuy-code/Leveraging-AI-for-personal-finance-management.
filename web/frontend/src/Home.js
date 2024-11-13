import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaSignInAlt,
  FaChartPie, 
  FaRocket, 
  FaMobileAlt, 
  FaLightbulb,
  FaChartLine,
  FaUserPlus,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin
} from 'react-icons/fa';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <FaRocket className="text-blue-400 text-2xl mr-2" />
              <span className="text-white font-bold text-xl">Finance AI</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="text-gray-300 hover:text-white px-4 py-2 rounded-full transition duration-300"
              >
                <FaSignInAlt className="inline mr-2" />
                Đăng Nhập
              </button>
              <button
                onClick={() => navigate('/register')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition duration-300 flex items-center"
              >
                <FaUserPlus className="mr-2" />
                Đăng Ký
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Quản Lý Tài Chính Thông Minh <br />
              <span className="text-blue-400">Với Trí Tuệ Nhân Tạo</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
              Tối ưu hóa tài chính cá nhân với sự hỗ trợ của AI. Phân tích thông minh, dự báo chính xác và tư vấn tài chính cá nhân hóa.
            </p>
            <div className="flex justify-center gap-6">
              <button
                onClick={() => navigate('/register')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full 
                         transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center"
              >
                <FaUserPlus className="mr-2" />
                Bắt Đầu Ngay
              </button>
              <button
                onClick={() => navigate('/demo')}
                className="bg-transparent border-2 border-blue-400 text-blue-400 hover:bg-blue-400/10 
                         font-bold py-4 px-8 rounded-full transition duration-300
                         flex items-center justify-center"
              >
                <FaRocket className="mr-2" />
                Xem Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-900/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Cách Hoạt Động</h2>
            <p className="text-xl text-gray-300">Đơn giản hóa quản lý tài chính của bạn</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: <FaMobileAlt className="text-4xl text-blue-400" />,
                title: "Kết Nối",
                description: "Liên kết tài khoản ngân hàng và ví điện tử"
              },
              {
                icon: <FaChartPie className="text-4xl text-green-400" />,
                title: "Phân Tích",
                description: "AI tự động phân tích giao dịch và chi tiêu"
              },
              {
                icon: <FaLightbulb className="text-4xl text-yellow-400" />,
                title: "Đề Xuất",
                description: "Nhận gợi ý tối ưu hóa tài chính cá nhân"
              },
              {
                icon: <FaChartLine className="text-4xl text-purple-400" />,
                title: "Theo Dõi",
                description: "Giám sát và điều chỉnh kế hoạch tài chính"
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-gray-800/60 flex items-center justify-center">
                    {step.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-gray-300">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Tính Năng Nổi Bật</h2>
            <p className="text-xl text-gray-300">Trải nghiệm quản lý tài chính hiện đại</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <FaChartPie className="text-5xl text-blue-400" />,
                title: "Phân Tích Chi Tiêu",
                description: "AI tự động phân loại và phân tích chi tiêu. Nhận thông báo thông minh về các khoản chi bất thường."
              },
              {
                icon: <FaChartLine className="text-5xl text-green-400" />,
                title: "Dự Báo Tài Chính",
                description: "Dự đoán xu hướng chi tiêu và đề xuất tối ưu ngân sách dựa trên AI."
              },
              {
                icon: <FaLightbulb className="text-5xl text-purple-400" />,
                title: "Tư Vấn Thông Minh",
                description: "Nhận tư vấn cá nhân hóa về cách tối ưu hóa tài chính của bạn."
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-8 
                         shadow-lg shadow-blue-900/20
                         hover:transform hover:scale-102 hover:bg-gray-800/60
                         transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center">
                  {feature.icon}
                  <h3 className="text-2xl font-bold text-white mt-4 mb-2">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-300">
            <p className="mb-4">&copy; 2024 Finance AI. Tất cả quyền được bảo lưu.</p>
            <div className="flex justify-center gap-6 mb-6">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-400">
                <FaFacebook className="text-3xl" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                <FaTwitter className="text-3xl" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-400">
                <FaInstagram className="text-3xl" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-500">
                <FaLinkedin className="text-3xl" />
              </a>
            </div>
            <div className="text-sm">
              <a href="/privacy-policy" className="text-gray-400 hover:text-white mr-6">Chính Sách Bảo Mật</a>
              <a href="/terms-of-service" className="text-gray-400 hover:text-white">Điều Khoản Dịch Vụ</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
