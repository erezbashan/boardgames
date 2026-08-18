import { useParams, useNavigate } from 'react-router-dom';
import { Lobby } from '@erez/boardgame-core';

export function GameLobbyWrapper() {
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
