import React, { useState } from 'react';
import LobbyPage from './LobbyPage';
import WaitingRoomPage from './WaitingRoomPage';
import GameBoard from './GamePage';

const GameRoom = () => {
  const [stage, setStage] = useState<'LOBBY' | 'WAITING' | 'PLAYING'>('LOBBY');
  
  const [gameData, setGameData] = useState<{roomId: string | null, myRole: any, playerName: string}>({
    roomId: null,
    myRole: null, 
    playerName: ''
  });

  const handleJoinGame = (roomId: string, role: string, name: string) => {
    setGameData({ roomId, myRole: parseInt(role), playerName: name }); 
    setStage('WAITING');
  };

  const handleStartGame = () => {
    setStage('PLAYING');
  };

  const handleBackToLobby = () => {
    setGameData({ roomId: null, myRole: null, playerName: '' });
    setStage('LOBBY');
  };

  if (stage === 'LOBBY') {
    return <LobbyPage onJoinGame={handleJoinGame} />;
  }

  if (stage === 'WAITING' && gameData.roomId) {
    return (
      <WaitingRoomPage 
        roomId={gameData.roomId}
        playerRole={gameData.myRole.toString()} 
        playerName={gameData.playerName}
        onStartGame={handleStartGame}
        onBack={handleBackToLobby} 
      />
    );
  }

  if (stage === 'PLAYING' && gameData.roomId) {
    return (
      <GameBoard 
        roomId={gameData.roomId} 
        myRole={gameData.myRole} 
      />
    );
  }

  return <div>Loading...</div>;
};

export default GameRoom;