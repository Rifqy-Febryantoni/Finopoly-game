import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { db } from '../firebase'; 
import { ref, set, get, child } from "firebase/database";
import './Lobby.css'; 
import logo from '../img/Logo.png'; 
import lobbyTitle from '../img/lobby_title.png'; 

interface LobbyProps {
  onJoinGame: (roomId: string, role: string, name: string) => void;
}

const LobbyPage: React.FC<LobbyProps> = ({ onJoinGame }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'MENU' | 'HOST' | 'JOIN'>('MENU');
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generateRoomId = () => Math.floor(1000 + Math.random() * 9000).toString();

  const handleHostGame = async () => {
    if (!playerName.trim()) { setError("Nama tidak boleh kosong!"); return; }
    setIsLoading(true); setError('');
    const newRoomId = generateRoomId();
    try {
      const snapshot = await get(child(ref(db), `rooms/${newRoomId}`));
      if (snapshot.exists()) { handleHostGame(); return; }
      
      await set(ref(db, 'rooms/' + newRoomId), {
        players: { p1: { name: playerName, balance: 1500, position: 0, isReady: true } },
        playerNames: { p1: playerName, p2: "Waiting..." },
        positions: { p1: 0, p2: 0 }, 
        turn: 1, phase: 'IDLE', playersConnected: 1, status: 'WAITING'
      });

      onJoinGame(newRoomId, '1', playerName);
    } catch (err) { console.error(err); setError("Gagal membuat room."); } finally { setIsLoading(false); }
  };

  const handleJoinGame = async () => {
    if (!playerName.trim() || !roomId.trim()) { setError("Nama dan Room ID harus diisi!"); return; }
    setIsLoading(true); setError('');
    try {
      const roomRef = ref(db, `rooms/${roomId}`);
      const snapshot = await get(roomRef);
      if (!snapshot.exists()) { setError("Room ID tidak ditemukan!"); setIsLoading(false); return; }
      const data = snapshot.val();
      if (data.playersConnected >= 2) { setError("Room sudah penuh!"); setIsLoading(false); return; }
      
      await set(child(roomRef, 'players/p2'), { name: playerName, balance: 1500, position: 0, isReady: true });
      await set(child(roomRef, 'playerNames/p2'), playerName);
      await set(child(roomRef, 'positions/p2'), 0);
      await set(child(roomRef, 'playersConnected'), 2);
      await set(child(roomRef, 'status'), 'READY');

      onJoinGame(roomId, '2', playerName);
    } catch (err) { console.error(err); setError("Gagal join room."); } finally { setIsLoading(false); }
  };

  return (
    <div className="game-bg-container">
      <header className="bar header">
        <img src={logo} alt="Finopoly Logo" className="logo" />
        <nav className="nav-container">
          <span className="nav-text" onClick={() => navigate('/')}>HOME</span>
          <span className="nav-text" onClick={() => navigate('/introduction')}>INTRODUCTION</span>
        </nav>
      </header>

      <main className="lobby-content">
        <img src={lobbyTitle} alt="Lobby" className="lobby-title-img animate-zoomIn" />
        <div className="glass-panel animate-zoomIn">
          {mode === 'MENU' && (
            <>
              <h2 className="text-3xl font-black mb-6 text-white drop-shadow-md">SELECT MODE</h2>
              <button onClick={() => setMode('HOST')} className="action-btn btn-blue mb-4 hover:scale-105 transition-transform">HOST GAME</button>
              <div className="text-white font-bold my-2 text-sm opacity-80">OR</div>
              <button onClick={() => setMode('JOIN')} className="action-btn btn-green hover:scale-105 transition-transform">JOIN GAME</button>
            </>
          )}

          {mode === 'HOST' && (
            <>
              <h2 className="text-3xl font-black mb-2 text-white drop-shadow-md">HOST GAME</h2>
              <p className="text-white text-sm mb-6 opacity-90">Isi Nama lalu Click Start.</p>
              <input type="text" placeholder="NAME" className="custom-input" maxLength={12} value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
              {error && <div className="error-msg">{error}</div>}
              <button onClick={handleHostGame} disabled={isLoading} className="action-btn btn-blue mt-4">{isLoading ? "CREATING..." : "START"}</button>
              <button onClick={() => { setMode('MENU'); setError(''); }} className="text-white font-bold mt-4 underline text-sm hover:text-gray-200">BACK TO MENU</button>
            </>
          )}

          {mode === 'JOIN' && (
            <>
              <h2 className="text-3xl font-black mb-2 text-white drop-shadow-md">JOIN GAME</h2>
              <p className="text-white text-sm mb-6 opacity-90">Isi Nama & Room ID.</p>
              <input type="text" placeholder="NAME" className="custom-input mb-3" maxLength={12} value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
              <input type="number" placeholder="ROOM ID" className="custom-input" value={roomId} onChange={(e) => setRoomId(e.target.value)} />
              {error && <div className="error-msg">{error}</div>}
              <button onClick={handleJoinGame} disabled={isLoading} className="action-btn btn-green mt-4">{isLoading ? "JOINING..." : "START"}</button>
              <button onClick={() => { setMode('MENU'); setError(''); }} className="text-white font-bold mt-4 underline text-sm hover:text-gray-200">BACK TO MENU</button>
            </>
          )}
        </div>
      </main>
      <footer className="bar footer">
         <span style={{fontFamily: 'ui-sans-serif, system-ui, sans-serif', fontWeight: 'bold', fontSize: '14px', color: 'white'}}>FINOPOLY © 2025</span>
      </footer>
    </div>
  );
};

export default LobbyPage;