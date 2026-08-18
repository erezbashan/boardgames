import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './firebase';
import { Lobby } from '@erez/boardgame-core';
import { FlipsBoard, flipsReducer, initialFlipsState } from '@erez/flips';
import type { FlipsState, FlipsAction } from '@erez/flips';
import { KotBoard, kingOfTokyoReducer, initialKotState } from '@erez/king-of-tokyo';
import type { KotState, KotAction } from '@erez/king-of-tokyo';
import { useMultiplayerGame } from './hooks/useMultiplayerGame';
import { SimulationDashboard } from '@erez/boardgame-core';

function GameSelector() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '40px', color: 'white', backgroundColor: '#1a1a2e', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '40px' }}>Erez Boardgames</h1>
      <div style={{ display: 'flex', gap: '20px' }}>
        <div 
          onClick={() => navigate('/flips')}
          style={{ background: 'rgba(255,255,255,0.1)', padding: '30px', borderRadius: '16px', cursor: 'pointer', textAlign: 'center', minWidth: '200px' }}
        >
          <h2>Flips</h2>
          <p>A simple test game</p>
        </div>
        <div 
          onClick={() => navigate('/king-of-tokyo')}
          style={{ background: 'rgba(255,255,255,0.1)', padding: '30px', borderRadius: '16px', cursor: 'pointer', textAlign: 'center', minWidth: '200px' }}
        >
          <h2>King of Tokyo</h2>
          <p>The main event</p>
        </div>
      </div>
    </div>
  );
}

function GameLobbyWrapper() {
  const { gameType } = useParams();
  const navigate = useNavigate();

  const handleCreateGame = (username: string) => {
    console.log(`Create ${gameType} game with username:`, username);
    const mockId = Math.random().toString(36).substring(2, 8).toUpperCase();
    navigate(`/${gameType}/${mockId}`, { state: { username } });
  };

  const handleJoinGame = (gameId: string, username: string) => {
    console.log(`Join ${gameType} game:`, gameId, "as", username);
    navigate(`/${gameType}/${gameId}`, { state: { username } });
  };

  const formattedTitle = gameType === 'king-of-tokyo' ? 'King of Tokyo' : 'Flips';

  return (
    <Lobby 
      title={formattedTitle}
      onCreateGame={handleCreateGame}
      onJoinGame={handleJoinGame}
      onGoHome={() => navigate('/')}
      pendingGames={gameType === 'flips' ? [
        { id: "FLIP-111", gameType: "Flips", playersCount: 1, status: "Lobby" }
      ] : [
        { id: "KOT-123", gameType: "King of Tokyo", playersCount: 2, status: "Lobby" }
      ]}
    />
  );
}

import { GameProvider } from '@erez/boardgame-core';

function ActiveFlipsGame({ gameId, username }: { gameId: string, username: string }) {
  const { gameState, myPlayerId, dispatchToBackend, error } = useMultiplayerGame<FlipsState, FlipsAction>(gameId, 'flips', username);
  const navigate = useNavigate();

  if (error) {
    return <div style={{ color: 'white', padding: '40px' }}>Error: {error}</div>;
  }

  if (!gameState || !myPlayerId) {
    return <div style={{ color: 'white', padding: '40px' }}>Loading game from Firebase...</div>;
  }

  const value = {
    gameState,
    myPlayerId,
    dispatch: dispatchToBackend as any,
    onLeaveGame: () => navigate('/flips')
  };

  return (
    <GameProvider value={value}>
      <FlipsBoard />
    </GameProvider>
  );
}

function ActiveKotGame({ gameId, username }: { gameId: string, username: string }) {
  const { gameState, myPlayerId, dispatchToBackend, error } = useMultiplayerGame<KotState, KotAction>(gameId, 'king-of-tokyo', username);
  const navigate = useNavigate();

  if (error) return <div style={{ color: 'white', padding: '40px' }}>Error: {error}</div>;
  if (!gameState || !myPlayerId) return <div style={{ color: 'white', padding: '40px' }}>Loading game from Firebase...</div>;

  const value = {
    gameState,
    myPlayerId,
    dispatch: dispatchToBackend as any,
    onLeaveGame: () => navigate('/king-of-tokyo')
  };

  return (
    <GameProvider value={value}>
      <KotBoard />
    </GameProvider>
  );
}

function ActiveGameWrapper() {
  const { gameType, gameId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.username || 'Guest';

  if (gameType === 'flips') {
    return <ActiveFlipsGame gameId={gameId!} username={username} />;
  }
  
  if (gameType === 'king-of-tokyo') {
    return <ActiveKotGame gameId={gameId!} username={username} />;
  }

  return (
    <div style={{ padding: '40px', color: 'white', backgroundColor: '#1a1a2e', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1>Playing {gameType?.toUpperCase()}</h1>
      <p>Game ID: {gameId}</p>
      <p>Player Name: {username}</p>
      <button 
        onClick={() => navigate(`/${gameType}`)} 
        style={{ padding: '10px 20px', cursor: 'pointer', marginTop: '20px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white' }}
      >
        Leave Game
      </button>
    </div>
  );
}

function SimulationWrapper() {
  const { gameType, simId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const handleStartGeneticSim = async (config: any) => {
    // If it's a Q-learning route, we use the q-learning callable
    const isQLearning = location.pathname.includes('/qlearning');
    const funcName = isQLearning ? 'startQLearningEvolution' : 'startGeneticEvolution';
    const startSim = httpsCallable(functions, funcName);
    const result = await startSim({ ...config, gameType });
    return (result.data as any).simId;
  };

  const handleListenGeneticSim = (simId: string, cb: (data: any) => void) => {
    import('firebase/firestore').then(({ doc, onSnapshot }) => {
      const unsubscribe = onSnapshot(doc(db, 'genetic_simulations', simId), (snapshot) => {
        cb(snapshot.data());
      });
      return unsubscribe;
    });
    return () => {};
  };

  const handleListGeneticSims = (gt: string, cb: (sims: any[]) => void) => {
    import('firebase/firestore').then(({ collection, query, where, onSnapshot, orderBy }) => {
      const isQLearning = location.pathname.includes('/qlearning');
      
      let q = query(collection(db, 'genetic_simulations'), where('gameType', '==', gt), orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        let sims = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (isQLearning) sims = sims.filter((s: any) => s.method === 'q-learning');
        else sims = sims.filter((s: any) => s.method !== 'q-learning');
        cb(sims);
      });
      return unsubscribe;
    });
    return () => {};
  };

  const handleStopGeneticSim = async (id: string) => {
    const { doc, updateDoc } = await import('firebase/firestore');
    await updateDoc(doc(db, 'genetic_simulations', id), { status: 'paused' });
  };

  const handleResumeGeneticSim = async (id: string) => {
    const { doc, updateDoc } = await import('firebase/firestore');
    await updateDoc(doc(db, 'genetic_simulations', id), { status: 'running' });
  };

  const handleDeleteGeneticSim = async (id: string) => {
    const { doc, deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'genetic_simulations', id));
  };

  const handleNavigateToSim = (id: string) => {
    const isQLearning = location.pathname.includes('/qlearning');
    const pathBase = isQLearning ? '/simulation/qlearning' : '/simulation/genetic';
    if (id) {
      navigate(`${pathBase}/${gameType}/${id}`);
    } else {
      navigate(`${pathBase}/${gameType}`);
    }
  };

  let viewType: 'head-to-head' | 'genetic-list' | 'genetic-detail' | 'tournament-list' | 'tournament-detail' = 'head-to-head';
  if (location.pathname.includes('/genetic') || location.pathname.includes('/qlearning')) {
    viewType = simId ? 'genetic-detail' : 'genetic-list';
  } else if (location.pathname.includes('/tournament')) {
    viewType = simId ? 'tournament-detail' : 'tournament-list';
  }

  const commonProps = {
    simId,
    viewType,
    onStartGeneticSim: handleStartGeneticSim,
    onListenGeneticSim: handleListenGeneticSim,
    onListGeneticSims: handleListGeneticSims,
    onStopGeneticSim: handleStopGeneticSim,
    onNavigateToSim: handleNavigateToSim,
    onResumeGeneticSim: handleResumeGeneticSim,
    onDeleteGeneticSim: handleDeleteGeneticSim,
    
    // Quick tournament specific overrides
    onStartTournament: async () => {
      const startSim = httpsCallable(functions, 'startTournament');
      const result = await startSim({ gameType });
      return (result.data as any).simId;
    },
    onListTournamentSims: (gt: string, cb: (sims: any[]) => void) => {
      import('firebase/firestore').then(({ collection, query, where, onSnapshot, orderBy }) => {
        let q = query(collection(db, 'tournament_simulations'), where('gameType', '==', gt), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          let sims = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          cb(sims);
        });
        return unsubscribe;
      });
      return () => {};
    },
    onListenTournamentSim: (id: string, cb: (data: any) => void) => {
      import('firebase/firestore').then(({ doc, onSnapshot }) => {
        const unsubscribe = onSnapshot(doc(db, 'tournament_simulations', id), (snapshot) => {
          cb(snapshot.data());
        });
        return unsubscribe;
      });
      return () => {};
    },
    onNavigateToTournament: (id: string) => {
      if (id) navigate(`/simulation/tournament/${gameType}/${id}`);
      else navigate(`/simulation/tournament/${gameType}`);
    },
    onStopTournament: async (id: string) => {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'tournament_simulations', id), { status: 'paused' });
    },
    onResumeTournament: async (id: string) => {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'tournament_simulations', id), { status: 'running' });
    },
    onDeleteTournament: async (id: string) => {
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'tournament_simulations', id));
    }
  };

  if (gameType === 'flips') {
    return <SimulationDashboard gameName="Flips" gameType="flips" reducer={flipsReducer as any} initialState={initialFlipsState} {...commonProps} />;
  }
  
  if (gameType === 'king-of-tokyo') {
    return <SimulationDashboard gameName="King of Tokyo" gameType="king-of-tokyo" reducer={kingOfTokyoReducer as any} initialState={initialKotState} {...commonProps} />;
  }

  return <div style={{ color: 'white', padding: '40px' }}>Unknown game type for simulation</div>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<GameSelector />} />
      <Route path="/:gameType" element={<GameLobbyWrapper />} />
      <Route path="/:gameType/:gameId" element={<ActiveGameWrapper />} />
      <Route path="/simulation/head-to-head/:gameType" element={<SimulationWrapper />} />
      <Route path="/simulation/genetic/:gameType" element={<SimulationWrapper />} />
      <Route path="/simulation/genetic/:gameType/:simId" element={<SimulationWrapper />} />
      <Route path="/simulation/qlearning/:gameType" element={<SimulationWrapper />} />
      <Route path="/simulation/qlearning/:gameType/:simId" element={<SimulationWrapper />} />
      <Route path="/simulation/tournament/:gameType" element={<SimulationWrapper />} />
      <Route path="/simulation/tournament/:gameType/:simId" element={<SimulationWrapper />} />
    </Routes>
  );
}

export default App;
