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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <FaRocket className="text-blue-400 text-2xl mr-2" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-500 font-bold text-xl">
                Finance AI
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="text-gray-600 hover:text-blue-500 px-4 py-2 rounded-full transition duration-300"
              >
                <FaSignInAlt className="inline mr-2" />
                Đăng Nhập
              </button>
              <button
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-6 py-2 rounded-full transition duration-300 flex items-center"
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
            <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
              Quản Lý Tài Chính Thông Minh <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-500">
                Với Trí Tuệ Nhân Tạo
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto">
              Tối ưu hóa tài chính cá nhân với sự hỗ trợ của AI. Phân tích thông minh, dự báo chính xác và tư vấn tài chính cá nhân hóa.
            </p>
            <div className="flex justify-center gap-6">
              <button
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-400 hover:to-teal-400 text-white font-bold py-4 px-8 rounded-full 
                         transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center"
              >
                <FaUserPlus className="mr-2" />
                Bắt Đầu Ngay
              </button>
              <button
                onClick={() => navigate('/demo')}
                className="bg-transparent border-2 border-gradient-to-r from-blue-500 to-teal-500 text-gradient-to-r from-blue-500 to-teal-500 
                         hover:bg-gradient-to-r hover:from-blue-400 hover:to-teal-400 font-bold py-4 px-8 rounded-full transition duration-300
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
      <section className="py-20 bg-gray-100/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Cách Hoạt Động</h2>
            <p className="text-xl text-gray-600">Đơn giản hóa quản lý tài chính của bạn</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[ 
              { 
                icon: <FaMobileAlt className="text-4xl text-gradient-to-r from-blue-500 to-teal-500" />, 
                title: "Kết Nối", 
                description: "Liên kết tài khoản ngân hàng và ví điện tử" 
              },
              { 
                icon: <FaChartPie className="text-4xl text-gradient-to-r from-blue-500 to-teal-500" />, 
                title: "Phân Tích", 
                description: "AI tự động phân tích giao dịch và chi tiêu" 
              },
              { 
                icon: <FaLightbulb className="text-4xl text-gradient-to-r from-blue-500 to-teal-500" />, 
                title: "Đề Xuất", 
                description: "Nhận gợi ý tối ưu hóa tài chính cá nhân" 
              },
              { 
                icon: <FaChartLine className="text-4xl text-gradient-to-r from-blue-500 to-teal-500" />, 
                title: "Theo Dõi", 
                description: "Giám sát và điều chỉnh kế hoạch tài chính" 
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200/70 flex items-center justify-center">
                    {step.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Tính Năng Nổi Bật</h2>
            <p className="text-xl text-gray-600">Trải nghiệm quản lý tài chính hiện đại</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[ 
              { 
                icon: <FaChartPie className="text-5xl text-gradient-to-r from-blue-500 to-teal-500" />, 
                title: "Phân Tích Chi Tiêu", 
                description: "AI tự động phân loại và phân tích chi tiêu. Nhận thông báo thông minh về các khoản chi bất thường." 
              },
              { 
                icon: <FaChartLine className="text-5xl text-gradient-to-r from-blue-500 to-teal-500" />, 
                title: "Dự Báo Tài Chính", 
                description: "Dự đoán xu hướng chi tiêu và đề xuất tối ưu ngân sách dựa trên AI." 
              },
              { 
                icon: <FaLightbulb className="text-5xl text-gradient-to-r from-blue-500 to-teal-500" />, 
                title: "Tư Vấn Thông Minh", 
                description: "Nhận tư vấn cá nhân hóa về cách tối ưu hóa tài chính của bạn." 
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className="bg-gray-200/80 backdrop-blur-sm rounded-xl p-8 
                         shadow-lg hover:bg-gray-200/90
                         transition-all duration-300 ease-in-out"
              >
                <div className="flex flex-col items-center text-center">
                  {feature.icon}
                  <h3 className="text-2xl font-bold text-gray-800 mt-4 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gradient-to-r from-teal-400 to-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center space-x-6 mb-4">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-blue-300">
              <FaFacebook className="text-3xl" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-blue-300">
              <FaTwitter className="text-3xl" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-purple-300">
              <FaInstagram className="text-3xl" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-blue-300">
              <FaLinkedin className="text-3xl" />
            </a>
          </div>
          <p className="text-white text-sm">Được phát triển bởi Finance AI Team</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
