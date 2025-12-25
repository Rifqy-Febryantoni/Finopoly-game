import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import komponen halaman
import HomePage from './components/HomePage';
import IntroductionPage from './components/IntroductionPage';
import GameRoom from './components/GameRoom';

function App() {
  return (
    <Router>
      <Routes>
        {/* Halaman Utama */}
        <Route path="/" element={<HomePage />} />
        
        {/* Halaman Introduction (Sudah di-uncomment) */}
        <Route path="/introduction" element={<IntroductionPage />} />
        
        {/* Halaman Game (Menangani Lobby -> Waiting -> Board) */}
        <Route path="/play" element={<GameRoom />} />
      </Routes>
    </Router>
  );
}

export default App;