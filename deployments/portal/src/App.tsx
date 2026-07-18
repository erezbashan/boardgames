import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Lobby } from '@erez/boardgame-core';
import { FlipsBoard } from '@erez/flips';
import type { FlipsState, FlipsAction } from '@erez/flips';
import { KotBoard } from '@erez/king-of-tokyo';
import type { KotState, KotAction } from '@erez/king-of-tokyo';
import { useMultiplayerGame } from './hooks/useMultiplayerGame';

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

  const formattedTitle = gameType === 'king-of-tokyo' ? 'King of Tokyo Lobby' : 'Flips Lobby';

  return (
    <Lobby 
      title={formattedTitle}
      onCreateGame={handleCreateGame}
      onJoinGame={handleJoinGame}
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<GameSelector />} />
      <Route path="/:gameType" element={<GameLobbyWrapper />} />
      <Route path="/:gameType/:gameId" element={<ActiveGameWrapper />} />
    </Routes>
  );
}

export default App;
