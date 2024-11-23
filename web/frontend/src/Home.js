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
<nav className={`fixed top-0 w-full bg-transparent transition-all duration-300 z-50 ${
  visible ? 'transform translate-y-0' : 'transform -translate-y-full'
}`}>
  <div className="container mx-auto">
    <div className="flex items-center justify-between px-10 py-6">
      <div className="flex items-center">
        <FaRocket className="mr-3 text-3xl text-blue-400" />
        <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
          Finance AI
        </span>
      </div>
      <div className="flex items-center space-x-6">
        <button
          onClick={() => navigate('/login')}
          className="py-3 text-lg text-gray-300 transition duration-300 rounded-full px-7 hover:text-blue-400"
        >
          <FaSignInAlt className="inline mr-3 text-xl" />
          Đăng Nhập
        </button>
        <button
          onClick={() => navigate('/register')}
          className="flex items-center px-8 py-3 text-lg text-white transition duration-300 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
        >
          <FaUserPlus className="mr-3 text-xl" />
          Đăng Ký
        </button>
      </div>
    </div>
  </div>
</nav>
      {/* Hero Section */}
      <section className="relative w-full min-h-[100vh] flex items-center justify-center">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url("/background.gif")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: '0.4',
            mixBlendMode: 'overlay'
          }}
        />
        
        <div className="container relative z-10 w-full px-4 mx-auto">
          <div className="text-center">
            <h1 className="mb-16 text-4xl font-bold text-gray-100 md:text-5xl lg:text-6xl" data-aos="fade-up" data-aos-delay="100">
              Quản Lý Tài Chính Thông Minh <br className="mb-6" />
              <span className="block pb-2 mt-8 mb-16 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Với Trí Tuệ Nhân Tạo
              </span>
            </h1>
            
            <div className="flex justify-center mt-8" data-aos="fade-up" data-aos-delay="300">
              <button
                onClick={() => navigate('/register')}
                className="relative px-16 py-6 text-xl font-bold transition duration-300 transform bg-transparent border-2 rounded-full group text-white/80 border-white/30 hover:bg-gradient-to-r hover:from-white/10 hover:to-blue-400/10 hover:border-white/50 backdrop-blur-sm hover:text-white hover:scale-105"
              >
                <div className="absolute inset-0 rounded-full bg-blue-600/5 backdrop-blur-sm"></div>
                <span className="relative flex items-center justify-center">
                  <FaUserPlus className="mr-3 text-2xl" />
                  Bắt Đầu Ngay
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full py-8 bg-gradient-to-br from-gray-900 to-black" data-aos="fade-up">
        <div className="container px-4 mx-auto">
          <div className="mb-8 text-center">
            <h2 className="mb-3 text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Cách Hoạt Động
            </h2>
            <p className="text-base text-gray-300">Đơn giản hóa quản lý tài chính của bạn</p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {[
              { icon: <FaMobileAlt className="text-3xl text-blue-400" />, title: "Kết Nối", description: "Liên kết tài khoản ngân hàng và ví điện tử" },
              { icon: <FaChartPie className="text-3xl text-blue-400" />, title: "Phân Tích", description: "AI tự động phân tích giao dịch và chi tiêu" },
              { icon: <FaLightbulb className="text-3xl text-blue-400" />, title: "Đề Xuất", description: "Nhận gợi ý tối ưu hóa tài chính cá nhân" },
              { icon: <FaChartLine className="text-3xl text-blue-400" />, title: "Theo Dõi", description: "Giám sát và điều chỉnh kế hoạch tài chính" }
            ].map((step, index) => (
              <div key={index} className="text-center" data-aos="fade-up" data-aos-delay={index * 100}>
                <div className="flex justify-center mb-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-800/70">
                    {step.icon}
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-100">{step.title}</h3>
                <p className="text-sm text-gray-300">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-8 bg-gradient-to-br from-black to-gray-900">
        <div className="container px-4 mx-auto" data-aos="slide-up">
          <div className="mb-8 text-center">
            <h2 className="mb-3 text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Tính Năng Nổi Bật
            </h2>
            <p className="text-base text-gray-300">Trải nghiệm quản lý tài chính hiện đại</p>
          </div>

          <div className="grid gap-8 px-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <FaChartPie className="text-3xl text-blue-400" />,
                title: "Phân Tích Chi Tiêu",
                description:
                  "AI tự động phân loại và phân tích chi tiêu. Nhận thông báo về các khoản chi bất thường.",
              },
              {
                icon: <FaChartLine className="text-3xl text-blue-400" />,
                title: "Dự Báo Tài Chính",
                description:
                  "Dự đoán xu hướng chi tiêu và đề xuất tối ưu ngân sách dựa trên AI.",
              },
              {
                icon: <FaLightbulb className="text-3xl text-blue-400" />,
                title: "Tư Vấn Thông Minh",
                description:
                  "Nhận tư vấn cá nhân hóa về cách tối ưu hóa tài chính của bạn.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-4 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg shadow-[#1e3a8a] min-h-[220px] flex flex-col items-center justify-center mx-auto w-full max-w-sm"
                data-aos="zoom-in"
                data-aos-delay={index * 100}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="p-2.5 rounded-full bg-gray-800/70">
                    {feature.icon}
                  </div>
                  <h3 className="mt-3 mb-2 text-lg font-bold text-white">{feature.title}</h3>
                  <p className="text-sm text-gray-300">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 bg-gradient-to-br from-black to-gray-900">
        <div className="container px-4 mx-auto text-center">
          <div className="flex justify-center mb-3 space-x-4">
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