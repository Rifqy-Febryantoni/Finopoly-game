import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css'; 
import logoImg from '../img/Logo.png';
import homeTitle from '../img/home_title.png'; 

const TEAM_MEMBERS = [
  { name: "Keyla Giyanda N.", nim: "NIM 1705623013", photo: "/img/team_profile/Keyla.jpeg" },
  { name: "Akbar Maulana", nim: "NIM 1705623107", photo: "/img/team_profile/Akbar.JPG" },
  { name: "Elsa Ramalia", nim: "NIM 1705623118", photo: "/img/team_profile/Elsa.jpeg" },
  { name: "Marcelino S. P.", nim: "NIM 1705623136", photo: "/img/team_profile/marcel.jpeg" },
];
const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleIntroductionClick = () => {
    navigate('/introduction');
  };

  const handleStartClick = () => {
    console.log("Start Clicked!");
    navigate('/introduction'); 
  };

  return (
    <div className="home-container">
      <header className="bar header">
        <img src={logoImg} alt="Finopoly Logo" className="logo" />
        <div className="nav-container">
          <div className="nav-text" onClick={handleHomeClick}>HOME</div>
          <div className="nav-text" onClick={handleIntroductionClick}>INTRODUCTION</div>
        </div>
      </header>

      <main className="main-content">
        
        <div className="hero-section">
          
          <img 
            src={homeTitle} 
            alt="Game Title" 
            className="home-title-img animate-zoomIn" 
          />

          <div className="start-text" onClick={handleStartClick}>
            START
          </div>
        </div>

        {/* <div className="team-section animate-fadeIn">
          <h2 className="team-title">DISUSUN OLEH:</h2>
          
          <div className="team-grid">
            {TEAM_MEMBERS.map((member, index) => (
              <div key={index} className="team-card">
                
                <div className="team-info">
                  <h3 className="team-name">{member.name}</h3>
                  <p className="team-nim">{member.nim}</p>
                </div>

                <div className="team-photo-container">
                  <img 
                    src={member.photo} 
                    alt={member.name} 
                    className="team-photo" 
                  />
                </div>

              </div>
            ))}
          </div>
        </div> */}

      </main>

      <footer className="bar footer">
         <span style={{fontFamily: 'ui-sans-serif, system-ui, sans-serif', fontWeight: 'bold', fontSize: '14px', color: 'white'}}>FINOPOLY © 2025</span>
      </footer>
    </div>
  );
};

export default HomePage;