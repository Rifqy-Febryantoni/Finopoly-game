import React, { useEffect, useRef } from 'react'; 
import { db } from '../firebase';
import { ref, onValue, update, remove } from "firebase/database";
import './Lobby.css'; 
import logo from '../img/Logo.png'; 
import lobbyTitle from '../img/lobby_title.png';

interface WaitingRoomProps {
    roomId: string;
    playerRole: string;
    playerName: string;
    onStartGame: () => void;
    onBack: () => void; 
}

const WaitingRoomPage: React.FC<WaitingRoomProps> = ({ roomId, playerRole, playerName, onStartGame, onBack }) => {
  const [roomData, setRoomData] = React.useState<any>(null);
  const isLeavingRef = useRef(false);

  useEffect(() => {
    if (!roomId) return;
    const roomRef = ref(db, `rooms/${roomId}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        if (!isLeavingRef.current) { alert("Room telah dibubarkan oleh Host."); }
        onBack(); return;
      }
      setRoomData(data);
      if (data.status === 'PLAYING') { onStartGame(); }
    });
    return () => unsubscribe();
  }, [roomId, onStartGame, onBack]);

  const handleStartClick = () => {
    if (playerRole !== '1') return; 
    update(ref(db, `rooms/${roomId}`), { status: 'PLAYING' });
  };

  const handleLeaveRoom = async () => {
    if (!roomId) return;
    isLeavingRef.current = true; 
    try {
      if (playerRole === '1') { await remove(ref(db, `rooms/${roomId}`)); } 
      else {
        const updates: any = {};
        updates[`rooms/${roomId}/players/p2`] = null;
        updates[`rooms/${roomId}/playerNames/p2`] = "Waiting...";
        updates[`rooms/${roomId}/playersConnected`] = 1;
        updates[`rooms/${roomId}/status`] = "WAITING";
        await update(ref(db), updates);
      }
      onBack();
    } catch (error) { console.error(error); isLeavingRef.current = false; }
  };

  const p1Name = roomData?.playerNames?.p1 || "Unknown";
  const p2Name = roomData?.playerNames?.p2 || "Waiting...";
  const isP2Connected = roomData?.playersConnected >= 2;

  if (!roomData) return <div className="game-bg-container"><div className="text-white text-center mt-20">Loading Room...</div></div>;

  return (
    <div className="game-bg-container">
      <header className="bar header">
        <img src={logo} alt="Finopoly Logo" className="logo" />
        <nav className="nav-container">
            <span className="nav-text opacity-50 cursor-not-allowed">HOME</span>
            <span className="nav-text opacity-50 cursor-not-allowed">INTRODUCTION</span>
        </nav>
      </header>

      <main className="lobby-content">
        <img src={lobbyTitle} alt="Lobby" className="lobby-title-img animate-zoomIn" style={{ width: '400px', marginBottom: '10px' }} />

        <div className="glass-panel animate-zoomIn" style={{ padding: '25px', width: '450px', marginTop: '0' }}>
            <h2 className="text-2xl font-black text-white mb-2 drop-shadow-md">WAITING ROOM</h2>
            
            <div className="text-center mb-6">
                <span className="text-gray-300 font-bold text-xs uppercase tracking-widest">ROOM ID</span>
                <div className="text-4xl font-black text-yellow-400 tracking-wider drop-shadow-sm select-all">{roomId}</div>
            </div>

            <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center border-b border-white/20 pb-2">
                    <span className="font-bold text-white text-md">PLAYER 1</span>
                    <span className={`text-md font-black ${playerRole === '1' ? 'text-green-400' : 'text-white'}`}>{p1Name} {playerRole === '1' && "(YOU)"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/20 pb-2">
                    <span className="font-bold text-white text-md">PLAYER 2</span>
                    {isP2Connected ? (
                         <span className={`text-md font-black ${playerRole === '2' ? 'text-green-400' : 'text-white'}`}>{p2Name} {playerRole === '2' && "(YOU)"}</span>
                    ) : (
                        <span className="text-md font-bold text-yellow-400 animate-pulse italic">Menunggu...</span>
                    )}
                </div>
            </div>

            <div className="waiting-message" style={{ fontSize: '14px', marginBottom: '20px' }}>
                {isP2Connected ? <span className="text-green-400">READY!</span> : "WAITING FOR PLAYER 2..."}
            </div>

            <div className="flex flex-col gap-2">
                {playerRole === '1' && (
                    <button onClick={handleStartClick} disabled={!isP2Connected} className={`action-btn ${isP2Connected ? 'btn-green' : 'bg-gray-500 cursor-not-allowed opacity-50'}`} style={{ fontSize: '20px', padding: '10px' }}>MULAI</button>
                )}
                {playerRole === '2' && (<div className="text-white font-bold text-xs p-2 mb-1">Menunggu Host...</div>)}
                <button onClick={handleLeaveRoom} className="text-red-400 font-bold hover:text-red-300 text-sm underline mt-2">KELUAR</button>
            </div>
        </div>
      </main>
      <footer className="bar footer">
         <span style={{fontFamily: 'ui-sans-serif, system-ui, sans-serif', fontWeight: 'bold', fontSize: '14px', color: 'white'}}>FINOPOLY © 2025</span>
      </footer>
    </div>
  );
};

export default WaitingRoomPage;