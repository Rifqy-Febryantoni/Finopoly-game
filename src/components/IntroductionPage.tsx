import React from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../img/Logo.png';
import './IntroductionPage.css';
import introTitle from '../img/introduction_title.png'; 

const ARTICLES = [
  {
    title: "Financial Technology",
    desc: "Financial technology adalah istilah yang menggambarkan aplikasi mobile, perangkat lunak, dan teknologi lainnya yang memungkinkan individu maupun perusahaan mengakses serta mengelola keuangan mereka secara digital.",
    link: "https://www.ibm.com/think/topics/fintech#:~:text=Fintech%2C%20or%20financial%20technology%2C%20is,and%20manage%20their%20finances%20digitally"
  },
  {
    title: "Jenis-jenis Fintech",
    desc: "Jenis-jenis fintech yang berkembang di Indonesia serta perannya dalam mempermudah layanan dan transaksi keuangan digital. Fintech berkontribusi meningkatkan efisiensi dan inklusi keuangan masyarakat melalui inovasi teknologi.",
    link: "https://afpi.or.id/articles/detail/jenis-fintech-yang-berkembang-di-indonesia"
  },
  {
    title: "Digital Privacy",
    desc: "Digital Privacy sebagai hak individu untuk mengontrol dan melindungi data pribadi di ruang digital. Privasi digital penting untuk mencegah penyalahgunaan informasi dan menjaga keamanan aktivitas online.",
    link: "https://www.enzuzo.com/blog/digital-privacy-definition"
  },
  {
    title: "Regulasi & Perlindungan",
    desc: "Fintech di Indonesia diawasi oleh Bank Indonesia dan OJK yang mengatur layanan seperti peer-to-peer lending dan manajemen risiko agar layanan keuangan digital aman, terdaftar, dan terlindungi konsumen.",
    link: "https://afpi.or.id/articles/detail/regulator-fintech-indonesia"
  }
];

const IntroductionPage: React.FC = () => {
  const navigate = useNavigate();

  const handleHomeClick = () => {
    navigate('/');
  };

  const handlePlayClick = () => {
    navigate('/play');
  };

  return (
    <div className="introduction-container">
      <header className="bar header">
        <img src={logoImg} alt="Finopoly Logo" className="logo" />
        <nav className="nav-container">
          <span className="nav-text" onClick={handleHomeClick}>HOME</span>
          <span className="nav-text active">INTRODUCTION</span>
        </nav>
      </header>

      <main className="intro-content">
        
        <div className="title-section animate-zoomIn">
            <img 
              src={introTitle} 
              alt="Introduction" 
              className="intro-title-img" 
            />
        </div>

        <div className="section-container animate-fadeIn">
            <div className="content-card video-card-wrapper">
                <h2 className="section-title-text">FIN-TECH OVERVIEW</h2>
                
                <div className="video-placeholder">
                    <span className="video-text">PLACEHOLDER</span>
                    <div className="play-button-overlay" onClick={handlePlayClick}>
                        ▶
                    </div>
                </div>
            </div>
        </div>

        <div className="section-container animate-fadeIn">
            <div className="content-card">
                <h2 className="section-title-text">EDU-ARTICLE</h2>

                <div className="article-grid">
                    {ARTICLES.map((item, index) => (
                        <div key={index} className="article-card">
                            <h3 className="article-card-title">{item.title}</h3>
                            <p className="article-card-desc">{item.desc}</p>
                            
                            <a 
                                href={item.link} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="article-arrow"
                                title="Baca Selengkapnya"
                            >
                                ➜
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="section-container animate-fadeIn">
            <div className="content-card video-card-wrapper">
                <h2 className="section-title-text">SCAM AWARENESS</h2>
                
                <div className="video-placeholder">
                    <span className="video-text">PLACEHOLDER</span>
                    <div className="play-button-overlay" onClick={handlePlayClick}>
                        ▶
                    </div>
                </div>
              <p className="scam-text">
                  Jika anda mengalami atau menjadi korban penipuan transaksi keuangan, laporkan ke{' '}
                  <a 
                      href="https://iasc.ojk.go.id/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="scam-link"
                  >
                      sini
                  </a>.
              </p>
            </div>
        </div>

        <div className="play-btn-section animate-fadeIn">
            <div className="play-text" onClick={handlePlayClick}>
                PLAY GAME
            </div>
        </div>

      </main>

      <footer className="bar footer">
         <span style={{fontFamily: 'ui-sans-serif, system-ui, sans-serif', fontWeight: 'bold', fontSize: '14px', color: 'white'}}>FINOPOLY © 2025</span>
      </footer>
    </div>
  );
};

export default IntroductionPage;