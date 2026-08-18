import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { GameProvider } from '@erez/boardgame-core';
import { FlipsBoard } from '@erez/flips';
import type { FlipsState, FlipsAction } from '@erez/flips';
import { KotBoard } from '@erez/king-of-tokyo';
import type { KotState, KotAction } from '@erez/king-of-tokyo';
import { useMultiplayerGame } from '../hooks/useMultiplayerGame';

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

export function ActiveGameWrapper() {
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
