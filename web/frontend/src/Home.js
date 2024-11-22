import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css'
import './App.css';
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
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: false,
    });

    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      
      setVisible(
        (prevScrollPos > currentScrollPos && currentScrollPos > 100) || 
        currentScrollPos < 10
      );
      
      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollPos]);

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-950 via-black to-blue-950">
      {/* Navigation Bar */}
      <nav className={`fixed top-0 w-full bg-transparent backdrop-blur-sm hover:bg-white/5 transition-all duration-300 z-50 ${
        visible ? 'transform translate-y-0' : 'transform -translate-y-full'
      }`}>
        <div className="px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaRocket className="mr-2 text-2xl text-blue-400" />
              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Finance AI
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-gray-300 transition duration-300 rounded-full hover:text-blue-400"
              >
                <FaSignInAlt className="inline mr-2" />
                Đăng Nhập
              </button>
              <button
                onClick={() => navigate('/register')}
                className="flex items-center px-6 py-2 text-white transition duration-300 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
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
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center">
          <h1 className="mb-6 text-5xl font-bold text-gray-100 md:text-6xl" data-aos="fade-up" data-aos-delay="100"data-aos-mirror="true" data-aos-once="false">
  Quản Lý Tài Chính Thông Minh <br />
  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
    Với Trí Tuệ Nhân Tạo
  </span>
</h1>
<p className="max-w-3xl mx-auto mb-10 text-xl text-gray-300 md:text-2xl" data-aos="fade-up" data-aos-delay="200" data-aos-mirror="true" data-aos-once="false">
  Tối ưu hóa tài chính cá nhân với sự hỗ trợ của AI. Phân tích thông minh, dự báo chính xác và tư vấn tài chính cá nhân hóa.
</p>
<div className="flex flex-col items-center justify-center gap-6 sm:flex-row" data-aos="fade-up" data-aos-delay="300"data-aos-mirror="true" data-aos-once="false">
  <button
    onClick={() => navigate('/register')}
    className="flex items-center justify-center px-8 py-4 font-bold text-white transition duration-300 ease-in-out transform rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 hover:scale-105"
  >
    <FaUserPlus className="mr-2" />
    Bắt Đầu Ngay
  </button>
  <button
    onClick={() => navigate('/demo')}
    className="flex items-center justify-center px-8 py-4 font-bold text-blue-400 transition duration-300 bg-transparent border-2 rounded-full hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-500 hover:text-white"
  >
    <FaRocket className="mr-2" />
    Xem Demo
  </button>
</div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-black" data-aos="fade-up">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="pb-1 text-4xl font-bold text-transparent mb-7 bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Cách Hoạt Động
            </h2>
            <p className="mb-6 text-xl text-gray-300">Đơn giản hóa quản lý tài chính của bạn</p>
          </div>

          <div className="grid gap-8 md:grid-cols-4">
            {[
              { icon: <FaMobileAlt className="text-4xl text-blue-400" />, title: "Kết Nối", description: "Liên kết tài khoản ngân hàng và ví điện tử" },
              { icon: <FaChartPie className="text-4xl text-blue-400" />, title: "Phân Tích", description: "AI tự động phân tích giao dịch và chi tiêu" },
              { icon: <FaLightbulb className="text-4xl text-blue-400" />, title: "Đề Xuất", description: "Nhận gợi ý tối ưu hóa tài chính cá nhân" },
              { icon: <FaChartLine className="text-4xl text-blue-400" />, title: "Theo Dõi", description: "Giám sát và điều chỉnh kế hoạch tài chính" }
            ].map((step, index) => (
              <div key={index} className="text-center" data-aos="fade-up" data-aos-delay={index * 100}>
                <div className="flex justify-center mb-4">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-800/70">
                    {step.icon}
                  </div>
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-100">{step.title}</h3>
                <p className="text-gray-300">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
<section id="features" className="py-20 bg-gradient-to-br from-black to-gray-900" data-aos="slide-up">
  <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
    <div className="mb-16 text-center">
      <h2 className="pb-1 mb-6 text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
        Tính Năng Nổi Bật
      </h2>
      <p className="text-lg text-gray-300">Trải nghiệm quản lý tài chính hiện đại</p>
    </div>

    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {[
        {
          icon: <FaChartPie className="text-4xl text-blue-400" />,
          title: "Phân Tích Chi Tiêu",
          description:
            "AI tự động phân loại và phân tích chi tiêu. Nhận thông báo thông minh về các khoản chi bất thường.",
        },
        {
          icon: <FaChartLine className="text-4xl text-blue-400" />,
          title: "Dự Báo Tài Chính",
          description:
            "Dự đoán xu hướng chi tiêu và đề xuất tối ưu ngân sách dựa trên AI.",
        },
        {
          icon: <FaLightbulb className="text-4xl text-blue-400" />,
          title: "Tư Vấn Thông Minh",
          description:
            "Nhận tư vấn cá nhân hóa về cách tối ưu hóa tài chính của bạn.",
        },
      ].map((feature, index) => (
        <div
          key={index}
          className="card"
          data-aos="zoom-in"
          data-aos-delay={index * 100}
        >
          <div className="flex flex-col items-center text-center card-content">
            {feature.icon}
            <h3 className="mt-4 mb-2 text-xl font-bold text-white">{feature.title}</h3>
            <p className="text-gray-300">{feature.description}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>

      {/* Footer */}
      <footer className="py-8 bg-gradient-to-br from-black to-gray-900">
        <div className="px-4 mx-auto text-center max-w-7xl sm:px-6 lg:px-8">
          <div className="flex justify-center mb-4 space-x-6">
            {[
              { icon: <FaFacebook className="text-xl" />, link: "https://facebook.com" },
              { icon: <FaTwitter className="text-xl" />, link: "https://twitter.com" },
              { icon: <FaInstagram className="text-xl" />, link: "https://instagram.com" },
              { icon: <FaLinkedin className="text-xl" />, link: "https://linkedin.com" }
            ].map((social, index) => (
              <a
                key={index}
                href={social.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 transition-colors duration-300 hover:text-blue-400"
              >
                {social.icon}
              </a>
            ))}
          </div>
          <p className="text-gray-300">&copy; 2024 Finance AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;