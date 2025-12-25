/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/purity */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef } from 'react'; 
import { useNavigate } from 'react-router-dom';

import { boardTiles } from '../data/boardData';

import { db } from '../firebase';
import { ref, onValue, update } from "firebase/database";
import './Lobby.css'; 
import logo from '../img/Logo.png'; 
import iascImg from '../img/iasc/iasc.png';

import dice1 from '../img/dice1.png';
import dice2 from '../img/dice2.png';
import dice3 from '../img/dice3.png';
import dice4 from '../img/dice4.png';
import dice5 from '../img/dice5.png';
import dice6 from '../img/dice6.png';


import bgmFile from '../Audio/game_music.mp3';

const QUIZ_POOL = [
  { id: 1, image: '/img/quiz/quiz1.png', answer: 'B' },
  { id: 2, image: '/img/quiz/quiz2.png', answer: 'C' },
  { id: 3, image: '/img/quiz/quiz3.png', answer: 'B' },
  { id: 4, image: '/img/quiz/quiz4.png', answer: 'B' },
  { id: 5, image: '/img/quiz/quiz5.png', answer: 'B' },
  { id: 6, image: '/img/quiz/quiz6.png', answer: 'B' },
  { id: 7, image: '/img/quiz/quiz7.png', answer: 'B' },
  { id: 8, image: '/img/quiz/quiz8.png', answer: 'B' },
  { id: 9, image: '/img/quiz/quiz9.png', answer: 'C' },
  { id: 10, image: '/img/quiz/quiz10.png', answer: 'B' },
  { id: 11, image: '/img/quiz/quiz11.png', answer: 'B' },
  { id: 12, image: '/img/quiz/quiz12.png', answer: 'C' },
];

const JAIL_QUIZ_POOL = [
  { id: 1, image: '/img/jail/1.png', answer: 'B' },
  { id: 2, image: '/img/jail/2.png', answer: 'B' },
  { id: 3, image: '/img/jail/3.png', answer: 'B' },
  { id: 4, image: '/img/jail/4.png', answer: 'B' },
  { id: 5, image: '/img/jail/5.png', answer: 'C' },
  { id: 6, image: '/img/jail/6.png', answer: 'A' },
];

const GameBoard = ({ roomId, myRole }: { roomId: any, myRole: any }) => {
  const navigate = useNavigate();
  
  const [gameState, setGameState] = useState<any>(null);
  const [notification, setNotification] = useState<any>(null); 
  const [statEffect, setStatEffect] = useState<any>({ p1: null, p2: null }); 
  const [animDiceValue, setAnimDiceValue] = useState(1); 
  const [isLocalRolling, setIsLocalRolling] = useState(false); 
  const [assetsLoaded, setAssetsLoaded] = useState(false); 
  const [quizSelection, setQuizSelection] = useState<any>({ selected: null, isRevealed: false }); 
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<any>(null);
  const audioRef = useRef(new Audio(bgmFile)); 
  const [isMuted, setIsMuted] = useState(false);

  const positions = gameState?.positions || { p1: 0, p2: 0 };
  const balances = {
      p1: typeof gameState?.balances?.p1 === 'number' ? gameState.balances.p1 : 1000,
      p2: typeof gameState?.balances?.p2 === 'number' ? gameState.balances.p2 : 1000
  };
  const turn = gameState?.turn || 1;
  const phase = gameState?.phase || 'IDLE';
  const serverDiceValue = gameState?.diceValue || 1;
  const ownership = gameState?.ownership || {};
  const jailedPlayers = gameState?.jailedPlayers || { p1: false, p2: false };
  const growthBoosts = {
      p1: typeof gameState?.growthBoosts?.p1 === 'number' ? gameState.growthBoosts.p1 : 0,
      p2: typeof gameState?.growthBoosts?.p2 === 'number' ? gameState.growthBoosts.p2 : 0
  };
  const interactionData = gameState?.interactionData || null;
  const winner = gameState?.winner || null;
  const playersConnected = gameState?.playersConnected || 1;
  const playerNames = gameState?.playerNames || { p1: "Player 1", p2: "Player 2" };

  const diceImages = [null, dice1, dice2, dice3, dice4, dice5, dice6];

  useEffect(() => {
    const audio = audioRef.current;
    audio.loop = true; 
    audio.volume = 0.3; 
    audio.muted = isMuted;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.log("Audio autoplay prevented by browser:", error);
      });
    }
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []); 

  const toggleMute = () => {
    const audio = audioRef.current;
    audio.muted = !audio.muted;
    setIsMuted(!isMuted);
  };

  useEffect(() => {
    const preloadImages = async () => {
        const imageUrls = [
            logo, dice1, dice2, dice3, dice4, dice5, dice6,
            
            ...boardTiles.map(t => t.image),
            
            ...boardTiles.map(t => t.assetPopup).filter(Boolean),
            
            ...boardTiles.map(t => t.infoPopup).filter(Boolean),
            ...QUIZ_POOL.map(q => q.image),
            ...JAIL_QUIZ_POOL.map(q => q.image)
        ];
        const promises = imageUrls.map((src) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = src;
                
                img.onload = resolve; 
                
                img.onerror = resolve; 
            });
        });
        await Promise.all(promises);
        setAssetsLoaded(true);
    };
    preloadImages();
  }, []);

  useEffect(() => {
    if (!roomId) return;
    const roomRef = ref(db, 'rooms/' + roomId);
    
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setGameState(data);
    });
    return () => unsubscribe();
  }, [roomId]);

  const updateDB = (updates: any) => {
    update(ref(db, 'rooms/' + roomId), updates);
  };

  useEffect(() => {
    const handleBeforeUnload = (e: any) => {
      if (!winner) { e.preventDefault(); e.returnValue = ''; return ''; }
    };
    const handlePopState = (e: any) => {
      
      if (!winner) {
        window.history.pushState(null, "", window.location.href);
        setPendingNavigation('/'); 
        setShowExitModal(true);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    window.history.pushState(null, "", window.location.href);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [winner]);

  const handleNavClick = (targetPath: any) => {
    if (winner) navigate(targetPath); else { setPendingNavigation(targetPath); setShowExitModal(true); }
  };

  const handleConfirmExit = () => {
    if (!winner) {
        const opponentKey = myRole === 1 ? 'p2' : 'p1';
        
        const opponentName = playerNames[opponentKey] || "Opponent";
        updateDB({ winner: opponentName }); 
    }
    setShowExitModal(false);
    navigate(pendingNavigation);
  };

  const handleCancelExit = () => {
    setShowExitModal(false);
    setPendingNavigation(null);
  };

  const showNotification = (message: any, type = 'info', duration = 3000) => {
    setNotification({ message, type });
    if (duration > 0) setTimeout(() => setNotification(null), duration);
  };

  const triggerStatEffect = (playerKey: any, type: any) => {
    setStatEffect((prev: any) => ({ ...prev, [playerKey]: type }));
    setTimeout(() => setStatEffect((prev: any) => ({ ...prev, [playerKey]: null })), 1000);
  };

  const calculateBoostedAmount = (baseAmount: any, playerKey: any) => {
    
    const level = growthBoosts[playerKey] || 0; 
    if (level === 0) return baseAmount;
    return Math.floor(baseAmount * (1 + (0.5 * level)));
  };

  useEffect(() => {
    if (!gameState) return;
    if (turn === myRole && phase === 'IDLE' && !winner) {
        const currentPlayerKey = turn === 1 ? 'p1' : 'p2';
        
        if (jailedPlayers[currentPlayerKey]) {
            updateDB({ phase: 'JAIL_DECISION' });
        }
    }
  }, [gameState, turn, myRole, phase, winner, jailedPlayers]);

  const handleRollDice = () => {
    if (turn !== myRole) return; 
    setIsLocalRolling(true);
    setNotification(null); 
    const shuffleInterval = setInterval(() => {
      setAnimDiceValue(Math.floor(Math.random() * 6) + 1);
    }, 100);
    setTimeout(() => {
      clearInterval(shuffleInterval);
      const finalRolled = Math.floor(Math.random() * 6) + 1;
      setAnimDiceValue(finalRolled);
      movePlayerSmoothly(finalRolled);
    }, 1000); 
  };

  const movePlayerSmoothly = (stepsRemaining: any) => {
    updateDB({ phase: 'MOVING' }); 
    setIsLocalRolling(false);
    const currentPlayerKey = turn === 1 ? 'p1' : 'p2';
    
    let trackerPos = positions[currentPlayerKey] || 0; 
    const performStep = (remaining: any) => {
        if (remaining <= 0) {
            updateDB({ diceValue: stepsRemaining }); 
            checkTileInteraction(trackerPos);
            return;
        }
        trackerPos = (trackerPos + 1) % 32;
        if (trackerPos === 0) { 
             const updates: any = {};
             const baseBonus = 100;
             const finalBonus = calculateBoostedAmount(baseBonus, currentPlayerKey);
             
             const currentBalance = Number(balances[currentPlayerKey]) || 0;
             updates[`balances/${currentPlayerKey}`] = currentBalance + finalBonus;
             updates[`positions/${currentPlayerKey}`] = trackerPos;
             updateDB(updates);
             triggerStatEffect(currentPlayerKey, 'GAIN');
             
             // --- FIX ERROR boostMsg DI SINI ---
             
             const boostMsg = growthBoosts[currentPlayerKey] > 0 ? ` (Boosted!)` : '';
             
             showNotification(`Lewat Start! +Rp ${finalBonus}${boostMsg}`, 'success', 1500);
        } else {
             updateDB({ [`positions/${currentPlayerKey}`]: trackerPos });
        }
        setTimeout(() => performStep(remaining - 1), 300);
    };
    updateDB({ diceValue: stepsRemaining }); 
    performStep(stepsRemaining);
  };

  const handleTileClick = (targetIndex: any) => {
    if (phase !== 'TRAVEL_SELECT' || turn !== myRole) return;
    const currentPlayerKey = turn === 1 ? 'p1' : 'p2';
    updateDB({ phase: 'MOVING' });
    let updates: any = { [`positions/${currentPlayerKey}`]: targetIndex };
    if (targetIndex === 0) {
        const baseBonus = 100;
        const finalBonus = calculateBoostedAmount(baseBonus, currentPlayerKey);
        
        const currentBalance = Number(balances[currentPlayerKey]) || 0;
        updates[`balances/${currentPlayerKey}`] = currentBalance + finalBonus;
        showNotification(`Terbang ke Start! +Rp ${finalBonus}`, 'success');
        triggerStatEffect(currentPlayerKey, 'GAIN');
    }
    updateDB(updates);
    setTimeout(() => checkTileInteraction(targetIndex), 500);
  };

  const checkTileInteraction = (tileIndex: any) => {
    
    const tile = boardTiles[tileIndex];
    const currentPlayerKey = turn === 1 ? 'p1' : 'p2';
    
    const owner = ownership[tileIndex];
    const basePrice = (tileIndex + 1) * 50;
    let updates: any = {};

    if (tile.type === 'TRAVEL' || tile.label === 'Travel') { updates['phase'] = 'TRAVEL_SELECT'; }
    else if (tile.type === 'JAIL' || tile.label === 'Jail') {
        updates[`jailedPlayers/${currentPlayerKey}`] = true;
        showNotification("ANDA DITAHAN! Giliran Berakhir.", 'error', 3000);
        endTurn(updates);
        return;
    }
    else if (tile.type === 'START') { endTurn(updates); return; }
    else if (tile.type === 'GROWTH') { updates = { phase: 'INTERACTION', interactionData: { type: 'GROWTH' } }; }
    else if (tile.type === 'TAX') {
        
        const tax = Math.floor(balances[currentPlayerKey] * 0.10);
        updates = { phase: 'INTERACTION', interactionData: { type: 'TAX', amount: tax } };
    }
    else if (tile.type === 'INTEREST') {
        
        const baseInterest = Math.floor(balances[currentPlayerKey] * 0.10);
        const finalInterest = calculateBoostedAmount(baseInterest, currentPlayerKey);
        updates = { phase: 'INTERACTION', interactionData: { type: 'INTEREST', amount: finalInterest, base: baseInterest } };
    }
    else if (tile.type === 'ASSET') {
        if (!owner) {
            updates = { phase: 'INTERACTION', interactionData: { type: 'ASSET_BUY', price: basePrice, name: `Sektor ${tileIndex}`, tileIndex, popupImage: tile.assetPopup } };
        } else if (owner === currentPlayerKey) {
            const baseDiv = Math.floor(basePrice * 0.1);
            const finalDiv = calculateBoostedAmount(baseDiv, currentPlayerKey);
            updates = { phase: 'INTERACTION', interactionData: { type: 'ASSET_DIVIDEND', dividend: finalDiv, base: baseDiv, name: `Sektor ${tileIndex}` } };
        } else {
            const rent = Math.floor(basePrice * 0.2);
            const acquire = basePrice * 2;
            
            if (balances[currentPlayerKey] < rent) {
                handleBankruptcy(currentPlayerKey);
                return;
            }
            updates = { phase: 'INTERACTION', interactionData: { type: 'ASSET_OWNED', rent, acquirePrice: acquire, owner, name: `Sektor ${tileIndex}`, tileIndex } };
        }
    }
    else if (tile.type === 'INFO') {
        updates = { phase: 'INTERACTION', interactionData: { type: 'INFO_POPUP', content: tile.infoPopup } };
    }
    else if (tile.type === 'QUIZ') {
        const randomQuiz = QUIZ_POOL[Math.floor(Math.random() * QUIZ_POOL.length)];
        updates = { phase: 'INTERACTION', interactionData: { type: 'QUIZ_POPUP', image: randomQuiz.image, correctAnswer: randomQuiz.answer } };
    }
    else { endTurn(updates); return; }
    updateDB(updates);
  };

  const endTurn = (extraUpdates = {}) => {
    const nextTurn = turn === 1 ? 2 : 1;
    updateDB({ ...extraUpdates, phase: 'IDLE', interactionData: null, turn: nextTurn, diceValue: 1 });
  };

  // --- HANDLERS ---
  const handleTakeBoost = () => {
    if (turn !== myRole) return;
    const playerKey = myRole === 1 ? 'p1' : 'p2';
    
    updateDB({ [`growthBoosts/${playerKey}`]: growthBoosts[playerKey] + 1 });
    showNotification("Growth Boost Bertambah!", 'success');
    endTurn();
  };
  const handlePayTax = () => {
    if (turn !== myRole) return;
    const playerKey = myRole === 1 ? 'p1' : 'p2';
    
    updateDB({ [`balances/${playerKey}`]: Math.max(0, balances[playerKey] - interactionData.amount) });
    triggerStatEffect(playerKey, 'LOSS');
    endTurn();
  };
  const handleClaimInterest = () => {
    if (turn !== myRole) return;
    const playerKey = myRole === 1 ? 'p1' : 'p2';
    const amount = interactionData.amount || interactionData.dividend;
    
    updateDB({ [`balances/${playerKey}`]: balances[playerKey] + amount });
    triggerStatEffect(playerKey, 'GAIN');
    endTurn();
  };
  const handleQuizAnswer = (choice: any) => {
    if (turn !== myRole) return;
    const isCorrect = choice === interactionData.correctAnswer;
    handleQuizResult(isCorrect);
  };
  const handleQuizResult = (isCorrect: any) => {
    const playerKey = myRole === 1 ? 'p1' : 'p2';
    if (isCorrect) {
        updateDB({ [`positions/${playerKey}`]: 24, phase: 'TRAVEL_SELECT' }); 
        showNotification("BENAR! Silakan Pilih Tujuan", 'success');
    } else {
        updateDB({ [`positions/${playerKey}`]: 8, [`jailedPlayers/${playerKey}`]: true }); 
        showNotification("SALAH! Masuk Penjara.", 'error');
        endTurn();
    }
  };
  const handleBuyAsset = () => {
    if (turn !== myRole) return;
    const { price, tileIndex } = interactionData;
    const playerKey = myRole === 1 ? 'p1' : 'p2';
    
    updateDB({ [`balances/${playerKey}`]: balances[playerKey] - price, [`ownership/${tileIndex}`]: playerKey });
    triggerStatEffect(playerKey, 'LOSS');
    endTurn();
  };
  const handlePayRent = () => {
    if (turn !== myRole) return;
    const playerKey = myRole === 1 ? 'p1' : 'p2';
    const opponentKey = myRole === 1 ? 'p2' : 'p1';
    const { rent } = interactionData;
    
    updateDB({ [`balances/${playerKey}`]: balances[playerKey] - rent, [`balances/${opponentKey}`]: balances[opponentKey] + rent });
    triggerStatEffect(playerKey, 'LOSS');
    triggerStatEffect(opponentKey, 'GAIN');
    endTurn();
  };
  const handleAcquireAsset = () => {
    if (turn !== myRole) return;
    const { acquirePrice, tileIndex } = interactionData;
    const playerKey = myRole === 1 ? 'p1' : 'p2';
    const opponentKey = myRole === 1 ? 'p2' : 'p1';
    updateDB({ 
        
        [`balances/${playerKey}`]: balances[playerKey] - acquirePrice, 
        
        [`balances/${opponentKey}`]: balances[opponentKey] + acquirePrice,
        [`ownership/${tileIndex}`]: playerKey 
    });
    triggerStatEffect(playerKey, 'LOSS');
    triggerStatEffect(opponentKey, 'GAIN');
    endTurn();
  };
  const handleJailRoll = () => {
    if (turn !== myRole) return;
    setIsLocalRolling(true);
    setTimeout(() => {
        setIsLocalRolling(false);
        const roll = Math.floor(Math.random() * 6) + 1;
        if (roll === 6) {
            const playerKey = myRole === 1 ? 'p1' : 'p2';
            updateDB({ [`jailedPlayers/${playerKey}`]: false, diceValue: 6 });
            showNotification("Bebas! (Dapat 6)", 'success');
            endTurn();
        } else {
            showNotification("Gagal (Dapat " + roll + ")", 'error');
            updateDB({ diceValue: roll });
            endTurn();
        }
    }, 1000);
  };
  const handleJailQuizInit = () => {
    if (turn !== myRole) return;
    const randomQuiz = JAIL_QUIZ_POOL[Math.floor(Math.random() * JAIL_QUIZ_POOL.length)];
    updateDB({ phase: 'JAIL_QUIZ', interactionData: { type: 'JAIL_QUIZ_POPUP', image: randomQuiz.image, correctAnswer: randomQuiz.answer } });
  };
  const handleJailQuizAnswer = (choice: any) => {
    if (turn !== myRole) return;
    const isCorrect = choice === interactionData.correctAnswer;
    const playerKey = myRole === 1 ? 'p1' : 'p2';
    if (isCorrect) {
        const roll = Math.floor(Math.random() * 6) + 1;
        
        const newPos = (positions[playerKey] + roll) % 32;
        updateDB({ [`jailedPlayers/${playerKey}`]: false, [`positions/${playerKey}`]: newPos, diceValue: roll });
        showNotification("Bebas & Jalan " + roll, 'success');
        endTurn(); 
    } else {
        showNotification("Salah! Tetap di Penjara", 'error');
        endTurn();
    }
  };
  const handleBankruptcy = (bankruptPlayer: any) => {
      const winnerKey = bankruptPlayer === 'p1' ? 'p2' : 'p1';
      
      const winnerName = playerNames[winnerKey];
      updateDB({ winner: winnerName });
  };

  const handleOptionClick = (choice: any, type: any) => { 
    if (quizSelection.isRevealed || turn !== myRole) return; 
    setQuizSelection({ selected: choice, isRevealed: true });
    setTimeout(() => {
        if (type === 'NORMAL') {
            handleQuizAnswer(choice);
        } else {
            handleJailQuizAnswer(choice);
        }
        setQuizSelection({ selected: null, isRevealed: false });
    }, 2000);
  };

  const getQuizButtonClass = (option: any) => {
    if (!quizSelection.isRevealed) {
        return "bg-white hover:bg-gray-100 text-gray-800 border-2 border-gray-200 py-3 rounded-xl font-black text-xl shadow-sm transition-all transform hover:scale-105 active:scale-95";
    }
    const correct = interactionData.correctAnswer;
    if (option === correct) return "bg-green-500 text-white border-2 border-green-600 py-3 rounded-xl font-black text-xl shadow-md scale-105";
    if (option === quizSelection.selected && option !== correct) return "bg-red-500 text-white border-2 border-red-600 py-3 rounded-xl font-black text-xl shadow-md opacity-80";
    return "bg-gray-200 text-gray-400 border-2 border-gray-300 py-3 rounded-xl font-black text-xl opacity-50 cursor-not-allowed";
  };

  const getGridPosition = (index: any) => {
    if (index <= 8) return { row: index + 1, col: 9 };
    if (index <= 16) return { row: 9, col: 9 - (index - 8) };
    if (index <= 24) return { row: 9 - (index - 16), col: 1 };
    if (index <= 31) return { row: 1, col: 1 + (index - 24) };
    return { row: 1, col: 9 };
  };

  const getTileStyle = (tileIndex: any) => {
    
    const owner = ownership[tileIndex];
    let finalClass = ""; 
    if (owner === 'p1') finalClass = 'border-blue-600 border-4 z-20'; 
    else if (owner === 'p2') finalClass = 'border-red-600 border-4 z-20';
    if (phase === 'TRAVEL_SELECT' && turn === myRole) finalClass += ' cursor-pointer animate-pulse ring-4 ring-yellow-400 z-30 opacity-90'; 
    return finalClass;
  };

  const getStatClass = (playerKey: any) => {
    let base = "flex flex-col items-center justify-center p-1 md:p-2 rounded-lg md:rounded-xl border-2 md:border-4 shadow-lg transition-all duration-500 w-16 md:w-36 ";
    const effect = statEffect[playerKey];
    
    const isJailed = jailedPlayers[playerKey];
    const isTurn = (playerKey === 'p1' && turn === 1) || (playerKey === 'p2' && turn === 2);
    if (effect === 'GAIN') return base + "bg-green-500 border-green-300 text-white scale-110 shadow-[0_0_20px_#22c55e] z-50";
    if (effect === 'LOSS') return base + "bg-orange-500 border-orange-300 text-white scale-90 z-50";
    if (isJailed) return base + "bg-gray-800 border-gray-600 text-gray-400 opacity-60 grayscale";
    if (playerKey === 'p1') {
        if (isTurn) return base + "bg-blue-600 border-blue-400 text-white scale-105 shadow-[0_0_15px_#3b82f6] ring-2 ring-blue-300 z-10";
        else return base + "bg-gray-200 border-gray-300 text-gray-400 opacity-50 grayscale scale-95";
    } 
    if (playerKey === 'p2') {
        if (isTurn) return base + "bg-red-600 border-red-400 text-white scale-105 shadow-[0_0_15px_#ef4444] ring-2 ring-red-300 z-10";
        else return base + "bg-gray-200 border-gray-300 text-gray-400 opacity-50 grayscale scale-95";
    }
    return base;
  };

  if (!assetsLoaded || playersConnected < 2) {
      return (
        <div className="game-bg-container flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mb-4"></div>
            <h2 className="text-white text-2xl font-black uppercase tracking-widest">
                {!assetsLoaded ? "MEMUAT ASET..." : "MENUNGGU LAWAN..."}
            </h2>
        </div>
      );
  }

  if (!gameState) return <div className="text-center mt-20 text-white">Syncing Data...</div>;

  if (winner) {
      const imWinner = winner === (myRole === 1 ? playerNames.p1 : playerNames.p2);
      
      return (
        <div className="game-bg-container flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-white/90 backdrop-blur-md p-10 rounded-3xl shadow-2xl border-4 border-white max-w-2xl w-full animate-zoomIn">
                <h1 className={`text-5xl font-black mb-4 uppercase ${imWinner ? 'text-green-600' : 'text-blue-500'}`}>
                    {imWinner ? "KAMU MENANG!" : "BELUM BERUNTUNG!"}
                </h1>
                <p className="text-xl font-bold text-gray-600 mb-8">
                    {imWinner ? "Selamat! Pertahankan ya." : "Tetap Semangat! Coba lagi lain kali ya."}
                </p>
                <div className="mb-8 flex justify-center">
                    <img src={iascImg} alt="IASC Logo" className="h-40 object-contain drop-shadow-md animate-bounce" />
                </div>
                {/* FIX 404 & RELOAD KE MENU */}
                <button 
                    onClick={() => window.location.href = '/'} 
                    className="bg-gray-800 text-white px-8 py-3 rounded-full font-bold hover:bg-gray-700 transition-all shadow-lg hover:scale-105"
                >
                    KEMBALI KE MENU
                </button>
            </div>
        </div>
      );
  }

  const displayDice = isLocalRolling ? animDiceValue : serverDiceValue;

  return (
    <div className="game-bg-container">
      <header className="bar header">
        <img src={logo} alt="Finopoly Logo" className="logo" />
        <nav className="nav-container">
            <span className="nav-text" onClick={() => handleNavClick('/')}>HOME</span>
            <span className="nav-text" onClick={() => handleNavClick('/introduction')}>INTRO</span>
            <button onClick={toggleMute} className="text-2xl text-white hover:text-yellow-400 transition-colors ml-4" title="Toggle Music">
               {isMuted ? "🔇" : "🔊"}
            </button>
        </nav>
      </header>

      <main className="lobby-content">
        {/* FIX ZOOM 75% DI LAPTOP */}
        <div className="relative w-full max-w-3xl mx-auto p-4 md:scale-75 md:origin-top transform transition-transform">
          <div className="grid grid-cols-9 grid-rows-9 gap-1 bg-gray-800 p-2 rounded-lg aspect-square">
            
            {boardTiles.map((tile, i) => {
              const pos = getGridPosition(i);
              
              const isP1Here = positions.p1 === i;
              
              const isP2Here = positions.p2 === i;
              const borderClass = getTileStyle(i);
              
              const owner = ownership[i];
              let overlayClass = "";
              if (owner === 'p1') overlayClass = "bg-blue-600/45"; 
              else if (owner === 'p2') overlayClass = "bg-red-600/45"; 
              return (
                <div key={tile.id} onClick={() => handleTileClick(i)} 
                    className={`${borderClass} flex items-center justify-center rounded-md overflow-hidden relative shadow-md transition-all duration-300 group`}
                    style={{ gridRow: pos.row, gridColumn: pos.col }}>
                  <img src={tile.image} alt={`Tile ${i}`} className="absolute inset-0 w-full h-full object-fill z-0" />
                  {overlayClass && <div className={`absolute inset-0 z-10 ${overlayClass} pointer-events-none transition-opacity duration-500`}></div>}
                  <div className="absolute flex gap-1 z-20 pointer-events-none">
                    {isP1Here && <div className="w-3 h-3 md:w-5 md:h-5 bg-blue-600 rounded-full border-2 border-white shadow-sm ring-2 ring-blue-300 transform -translate-x-1"></div>}
                    {isP2Here && <div className="w-3 h-3 md:w-5 md:h-5 bg-red-600 rounded-full border-2 border-white shadow-sm ring-2 ring-red-300 transform translate-x-1"></div>}
                  </div>
                </div>
              );
            })}

            <div className="bg-white col-start-2 col-end-9 row-start-2 row-end-9 m-1 rounded-lg flex flex-col justify-between shadow-inner relative overflow-hidden">
                <div className="w-full flex justify-between items-start p-2 z-10 border-b border-gray-100 bg-gray-50 bg-opacity-80">
                    <div className={getStatClass('p1')}>
                        
                        <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider block truncate w-full text-center">{playerNames.p1}</span>
                        
                        <span className="text-[10px] md:text-lg font-black">Rp {balances.p1}</span>
                        
                        {growthBoosts.p1 > 0 && <span className="text-[8px] md:text-[10px] text-green-600 font-bold block bg-green-100 rounded px-1 mt-1">Boost x{growthBoosts.p1}</span>}
                        
                        {jailedPlayers.p1 && <span className="text-[8px] md:text-[10px] text-red-600 font-bold animate-pulse">DITAHAN</span>}
                    </div>
                    <div className={getStatClass('p2')}>
                        
                        <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider block truncate w-full text-center">{playerNames.p2}</span>
                        
                        <span className="text-[10px] md:text-lg font-black">Rp {balances.p2}</span>
                        
                        {growthBoosts.p2 > 0 && <span className="text-[8px] md:text-[10px] text-green-600 font-bold block bg-green-100 rounded px-1 mt-1">Boost x{growthBoosts.p2}</span>}
                        
                        {jailedPlayers.p2 && <span className="text-[8px] md:text-[10px] text-red-600 font-bold animate-pulse">DITAHAN</span>}
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center relative p-2">
                    {notification && (
                        <div className={`absolute top-0 z-50 px-6 py-2 rounded-full shadow-lg font-bold text-sm animate-bounce border transition-all duration-300
                            ${notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-700'}`}>
                            {notification.message}
                        </div>
                    )}

                    {(phase === 'IDLE' || phase === 'MOVING') && !winner && (
                        <div className="flex flex-col items-center justify-center gap-1 md:gap-4">
                            <div className="text-[9px] md:text-sm font-bold text-gray-400 uppercase tracking-widest">
                                
                                {turn === myRole ? "GILIRAN KAMU" : `MENUNGGU ${turn === 1 ? playerNames.p1 : playerNames.p2}...`}
                            </div>
                            <div className={`w-14 h-14 md:w-40 md:h-40 bg-white border-1 border-gray-300 rounded-xl md:rounded-3xl flex items-center justify-center shadow-lg ${isLocalRolling ? 'animate-shake' : ''}`}>
                                <img src={diceImages[displayDice]} alt={`Dice ${displayDice}`} className="w-full h-full object-contain p-2" />
                            </div>
                            {turn === myRole && (
                                <button onClick={handleRollDice} disabled={isLocalRolling} 
                                    className="px-4 py-1 md:px-8 md:py-3 rounded-full font-bold shadow-lg text-white bg-blue-600 hover:bg-blue-700 transition-all transform active:scale-95 text-[10px] md:text-base">
                                    {isLocalRolling ? '...' : 'ROLL DICE'}
                                </button>
                            )}
                        </div>
                    )}

                    {phase === 'TRAVEL_SELECT' && (
                        <div className="text-center animate-pulse">
                            <div className="text-2xl md:text-4xl mb-2">✈️</div>
                            <h2 className="text-sm md:text-xl font-bold text-yellow-600">TRAVEL MODE</h2>
                            <p className="text-[10px] md:text-sm text-gray-500">Klik kotak tujuan!</p>
                        </div>
                    )}

                    {phase === 'INTERACTION' && interactionData && !winner && (
                        <div className="w-full max-w-[90%] md:max-w-md px-1 text-center animate-fadeIn">
                            {interactionData.type === 'GROWTH' && (
                                <>
                                    <h3 className="text-sm md:text-2xl font-bold mb-1 text-purple-600">GROWTH BOOST</h3>
                                    <div className="text-2xl md:text-5xl mb-2">🚀</div>
                                    <p className="text-[10px] md:text-sm font-medium text-gray-600 mb-4">Pendapatan +<span className="font-bold text-green-600">50%</span>!</p>
                                    {turn === myRole ? <button onClick={handleTakeBoost} className="w-full bg-purple-600 text-white py-2 md:py-3 rounded-lg md:rounded-xl font-bold hover:bg-purple-700 shadow-lg text-xs md:text-base">AMBIL</button> : <p className="text-gray-400 text-[10px]">Menunggu lawan...</p>}
                                </>
                            )}
                            {interactionData.type === 'TAX' && (
                                <>
                                    <h3 className="text-sm md:text-2xl font-bold mb-1 text-red-600">PAJAK</h3>
                                    <p className="text-xl md:text-4xl font-black text-gray-800 mb-4">- {interactionData.amount}</p>
                                    {turn === myRole ? <button onClick={handlePayTax} className="w-full bg-red-600 text-white py-2 md:py-3 rounded-lg md:rounded-xl font-bold hover:bg-red-700 shadow-lg text-xs md:text-base">BAYAR</button> : <p className="text-gray-400 text-[10px]">Menunggu lawan...</p>}
                                </>
                            )}
                            {interactionData.type === 'INTEREST' && (
                                <>
                                    <h3 className="text-sm md:text-2xl font-bold mb-1 text-green-600">BUNGA</h3>
                                    <p className="text-xl md:text-4xl font-black text-gray-800 mb-4">+ {interactionData.amount}</p>
                                    {turn === myRole ? <button onClick={handleClaimInterest} className="w-full bg-green-600 text-white py-2 md:py-3 rounded-lg md:rounded-xl font-bold hover:bg-green-700 shadow-lg animate-pulse text-xs md:text-base">KLAIM</button> : <p className="text-gray-400 text-[10px]">Menunggu lawan...</p>}
                                </>
                            )}
                            {interactionData.type === 'ASSET_OWNED' && (
                                <>
                                    <div className="text-[8px] md:text-[10px] font-bold text-red-500 uppercase mb-2">MILIK LAWAN</div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-red-50 p-2 rounded-lg border border-red-100">
                                            <div className="text-[8px] font-bold text-gray-400">SEWA</div>
                                            <div className="text-xs md:text-lg font-bold text-red-600 mb-1">{interactionData.rent}</div>
                                            {turn === myRole ? <button onClick={handlePayRent} className="w-full bg-red-600 text-white py-1 rounded text-[8px] font-bold">BAYAR</button> : <p className="text-gray-400 text-[8px]">Waiting...</p>}
                                        </div>
                                        <div className="bg-yellow-50 p-2 rounded-lg border border-yellow-100">
                                            <div className="text-[8px] font-bold text-gray-400">AKUISISI</div>
                                            <div className="text-xs md:text-lg font-bold text-yellow-600 mb-1">{interactionData.acquirePrice}</div>
                                            
                                            {turn === myRole ? <button onClick={handleAcquireAsset} disabled={balances[turn === 1 ? 'p1' : 'p2'] < interactionData.acquirePrice} className={`w-full text-white py-1 rounded text-[8px] font-bold ${balances[turn === 1 ? 'p1' : 'p2'] < interactionData.acquirePrice ? 'bg-gray-300' : 'bg-yellow-500'}`}>AMBIL</button> : <p className="text-gray-400 text-[8px]">Waiting...</p>}
                                        </div>
                                    </div>
                                </>
                            )}
                            {interactionData.type === 'ASSET_DIVIDEND' && (
                                <>
                                    <h3 className="text-sm md:text-xl font-bold text-green-600 mb-2">DIVIDEN</h3>
                                    <p className="text-xl md:text-4xl font-black text-gray-800 mb-4">+ {interactionData.dividend}</p>
                                    {turn === myRole ? <button onClick={handleClaimInterest} className="w-full bg-green-600 text-white py-2 md:py-3 rounded-lg md:rounded-xl font-bold shadow-lg text-xs md:text-base">AMBIL</button> : <p className="text-gray-400 text-[10px]">Menunggu lawan...</p>}
                                </>
                            )}
                        </div>
                    )}

                    {phase === 'JAIL_DECISION' && (
                        <div className="w-full max-w-[90%] animate-fadeIn">
                            <h2 className="text-sm md:text-xl font-bold text-gray-800 mb-2 md:mb-4 text-center">👮 PILIHAN PENJARA</h2>
                            {turn === myRole ? (
                                <div className="flex gap-2 justify-center">
                                    <button onClick={handleJailRoll} disabled={isLocalRolling} className="flex-1 bg-gray-800 text-white p-2 rounded-lg font-bold hover:bg-gray-700 text-[10px] md:text-sm">ROLL (1/6)</button>
                                    <button onClick={handleJailQuizInit} className="flex-1 bg-blue-600 text-white p-2 rounded-lg font-bold hover:bg-blue-700 text-[10px] md:text-sm">KUIS HUKUM</button>
                                </div>
                            ) : <p className="text-center text-gray-400 text-[10px]">Menunggu lawan...</p>}
                        </div>
                    )}
                </div>

                <div className="w-full text-center py-1 bg-gray-50 border-t border-gray-100">
                    <span className="text-[8px] md:text-[10px] text-gray-400 font-mono">
                        
                        Posisi: {playerNames.p1}({positions.p1}) | {playerNames.p2}({positions.p2})
                    </span>
                </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bar footer">
         
         <span style={{color:'white'}}>PLAYING AS {myRole === 1 ? playerNames.p1 : playerNames.p2}</span>
      </footer>

      {showExitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm">
            <div className="bg-white p-4 md:p-8 rounded-2xl shadow-2xl max-w-xs md:max-w-md text-center border-4 border-red-500 animate-bounce-small">
                <div className="text-4xl md:text-6xl mb-2 md:mb-4">⚠️</div>
                <h2 className="text-lg md:text-2xl font-black text-red-600 mb-2 uppercase">TUNGGU! JANGAN KELUAR!</h2>
                <p className="text-gray-700 font-bold mb-4 md:mb-6 text-xs md:text-base">
                    Jika kamu keluar, maka <span className="text-red-600 font-black">AKAN DIANGGAP MENYERAH!</span>
                </p>
                <div className="flex gap-2 md:gap-4 justify-center">
                    <button onClick={handleCancelExit} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl font-bold text-xs md:text-base">CANCEL</button>
                    <button onClick={handleConfirmExit} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl font-bold text-xs md:text-base">MENYERAH</button>
                </div>
            </div>
        </div>
      )}

      {phase === 'INTERACTION' && interactionData?.type === 'INFO_POPUP' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-md animate-fadeIn">
            <div className="relative bg-white p-2 rounded-2xl shadow-2xl max-w-[90%] md:max-w-lg w-full mx-4 transform transition-all animate-zoomIn border-4 border-cyan-400">
                <div className="absolute -top-3 md:-top-5 left-1/2 transform -translate-x-1/2 bg-cyan-600 text-white px-4 py-1 rounded-full font-bold shadow-md border-2 border-white tracking-widest uppercase text-[10px] md:text-sm">INFOGRAFIS</div>
                <div className="mt-4 rounded-xl overflow-hidden border border-gray-200">
                    <img src={interactionData.content} alt="Informasi Keuangan" className="w-full h-auto object-contain max-h-[30vh] md:max-h-[70vh]" />
                </div>
                <div className="mt-4 flex justify-center">
                    {turn === myRole ? (
                        <button onClick={() => endTurn()} className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 md:px-10 md:py-3 rounded-lg md:rounded-xl font-bold text-xs md:text-lg shadow-lg transition-transform transform hover:scale-105 active:scale-95">MENGERTI</button>
                    ) : <div className="text-white bg-gray-800 px-4 py-2 rounded-lg font-bold text-[10px] bg-opacity-80">Menunggu lawan membaca info...</div>}
                </div>
            </div>
        </div>
      )}

      {phase === 'INTERACTION' && interactionData?.type === 'ASSET_BUY' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-md animate-fadeIn">
            <div className="relative bg-white p-2 rounded-2xl shadow-2xl max-w-[90%] md:max-w-lg w-full mx-4 transform transition-all animate-zoomIn border-4 border-pink-500">
                <div className="absolute -top-3 md:-top-5 left-1/2 transform -translate-x-1/2 bg-pink-500 text-white px-4 py-1 rounded-full font-bold shadow-md border-2 border-white tracking-widest uppercase text-[10px] md:text-sm">SEKTOR</div>
                <div className="mt-4 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 flex justify-center">
                    {interactionData.popupImage ? (
                        <img src={interactionData.popupImage} alt="Asset Offer" className="w-full h-auto object-contain max-h-[25vh] md:max-h-[60vh]" />
                    ) : (
                        <div className="p-10 text-gray-400">Gambar Sektor Tidak Ditemukan</div>
                    )}
                </div>
                <div className="text-center mt-2 mb-2 md:mb-4">
                    <p className="text-gray-500 text-[8px] md:text-xs font-bold uppercase">HARGA SEKTOR</p>
                    <p className="text-lg md:text-3xl font-black text-green-600">Rp {interactionData.price}</p>
                </div>
                <div className="mt-2 flex gap-3 justify-center px-4 pb-2">
                    {turn === myRole ? (
                        <>
                            <button onClick={() => endTurn()} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 md:py-3 rounded-lg md:rounded-xl font-bold text-xs md:text-lg">SKIP</button>
                            
                            <button onClick={handleBuyAsset} disabled={balances[turn === 1 ? 'p1' : 'p2'] < interactionData.price} className={`flex-1 py-2 md:py-3 rounded-lg md:rounded-xl font-bold text-xs md:text-lg text-white shadow-lg ${balances[turn === 1 ? 'p1' : 'p2'] < interactionData.price ? 'bg-gray-400 cursor-not-allowed opacity-70' : 'bg-green-600 hover:bg-green-700 active:scale-95'}`}>
                                
                                {balances[turn === 1 ? 'p1' : 'p2'] < interactionData.price ? "KURANG" : "BELI"}
                            </button>
                        </>
                    ) : (
                        <div className="text-white bg-gray-800 px-4 py-2 rounded-lg font-bold text-[10px] bg-opacity-80 w-full text-center">Menunggu lawan...</div>
                    )}
                </div>
            </div>
        </div>
      )}

      {phase === 'INTERACTION' && interactionData?.type === 'QUIZ_POPUP' && turn === myRole && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-md animate-fadeIn">
            <div className="relative bg-white p-2 rounded-2xl shadow-2xl max-w-[90%] md:max-w-lg w-full mx-4 transform transition-all animate-zoomIn border-4 border-green-500">
                <div className="absolute -top-3 md:-top-5 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-1 rounded-full font-bold shadow-md border-2 border-yellow tracking-widest uppercase text-[10px] md:text-sm">QUIZ</div>
                <div className="mt-4 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 flex justify-center">
                    {interactionData.image ? (
                        <img src={interactionData.image} alt="Quiz Question" className="w-full h-auto object-contain max-h-[30vh] md:max-h-[50vh]" />
                    ) : (
                        <div className="p-10 text-gray-400">Memuat Soal...</div>
                    )}
                </div>
                <p className="text-center text-gray-500 text-[10px] md:text-sm font-bold mt-2 mb-1">PILIH JAWABAN YANG BENAR:</p>
                <div className="grid grid-cols-2 gap-2 md:gap-3 p-2">
                    {['A', 'B', 'C', 'D'].map((option) => (
                        <button
                            key={option}
                            onClick={() => handleOptionClick(option, 'NORMAL')} 
                            disabled={quizSelection.isRevealed} 
                            className={getQuizButtonClass(option)} 
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}

      {phase === 'INTERACTION' && interactionData?.type === 'QUIZ_POPUP' && turn !== myRole && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl text-center border-4 border-gray-300">
                <div className="text-4xl md:text-6xl mb-2 md:mb-4">🤔</div>
                <h2 className="text-sm md:text-2xl font-black text-gray-800 uppercase mb-2 tracking-widest">
                    
                    Menunggu <span className="text-blue-600">{turn === 1 ? playerNames.p1 : playerNames.p2}</span> menjawab Quiz
                </h2>
                <div className="mt-4 flex justify-center gap-2">
                    <span className="w-2 h-2 md:w-3 md:h-3 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 md:w-3 md:h-3 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-2 h-2 md:w-3 md:h-3 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                </div>
            </div>
        </div>
      )}
      
      {phase === 'JAIL_QUIZ' && interactionData?.type === 'JAIL_QUIZ_POPUP' && turn === myRole && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-md animate-fadeIn">
            <div className="relative bg-white p-2 rounded-2xl shadow-2xl max-w-[90%] md:max-w-lg w-full mx-4 transform transition-all animate-zoomIn border-4 border-red-500">
                <div className="absolute -top-3 md:-top-5 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-1 rounded-full font-bold shadow-md border-2 border-white tracking-widest uppercase text-[10px] md:text-sm">FRAUD QUIZ</div>
                <div className="mt-4 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 flex justify-center">
                    {interactionData.image ? (
                        <img src={interactionData.image} alt="Jail Quiz Question" className="w-full h-auto object-contain max-h-[30vh] md:max-h-[50vh]" />
                    ) : (
                        <div className="p-10 text-gray-400">Memuat Soal...</div>
                    )}
                </div>
                <p className="text-center text-gray-500 text-[10px] md:text-sm font-bold mt-2 mb-1">PILIH JAWABAN BENAR:</p>
                <div className="grid grid-cols-2 gap-2 md:gap-3 p-2">
                    {['A', 'B', 'C', 'D'].map((option) => (
                        <button
                            key={option}
                            onClick={() => handleOptionClick(option, 'JAIL')}
                            disabled={quizSelection.isRevealed}
                            className={getQuizButtonClass(option)}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}

      {phase === 'JAIL_QUIZ' && interactionData?.type === 'JAIL_QUIZ_POPUP' && turn !== myRole && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl text-center border-4 border-gray-300 animate-pulse">
                <div className="text-4xl md:text-6xl mb-2 md:mb-4">⚖️</div>
                <h2 className="text-sm md:text-2xl font-black text-gray-800 uppercase mb-2 tracking-widest">SIDANG BERLANGSUNG</h2>
                
                <p className="text-gray-600 font-bold text-xs md:text-lg">Menunggu <span className="text-blue-600">{turn === 1 ? playerNames.p1 : playerNames.p2}</span> menjawab...</p>
            </div>
        </div>
      )}

    </div>
  );
};

export default GameBoard;