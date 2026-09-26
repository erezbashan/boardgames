import { useParams, useNavigate } from 'react-router-dom';
import { Lobby } from '@erez/boardgame-core';
import type { PendingGame } from '@erez/boardgame-core';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export function GameLobbyWrapper() {
  const { gameType } = useParams();
  const navigate = useNavigate();
  const [pendingGames, setPendingGames] = useState<PendingGame[]>([]);

  useEffect(() => {
    if (!gameType) return;
    const q = query(
      collection(db, 'games'), 
      where('gameType', '==', gameType),
      where('state.status', '==', 'Lobby')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const games: PendingGame[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.state) {
          // Count only real humans (isBot is false)
          const humanCount = Object.values(data.state.players || {}).filter((p: any) => !p.isBot).length;
          games.push({
            id: doc.id,
            gameType: data.gameType,
            playersCount: humanCount,
            status: data.state.status
          });
        }
      });
      setPendingGames(games);
    });
    return () => unsubscribe();
  }, [gameType]);

  const handleCreateGame = (username: string) => {
    console.log(`Create ${gameType} game with username:`, username);
    const mockId = Math.random().toString(36).substring(2, 8).toUpperCase();
    navigate(`/${gameType}/${mockId}`, { state: { username } });
  };

  const handleJoinGame = (gameId: string, username: string) => {
    console.log(`Join ${gameType} game:`, gameId, "as", username);
    navigate(`/${gameType}/${gameId}`, { state: { username } });
  };

  const formattedTitle = gameType === 'king-of-tokyo' ? 'King of Tokyo' : gameType === 'acquire' ? 'Acquire' : gameType === 'splendor' ? 'Splendor' : gameType === 'dominion' ? 'Dominion' : 'Flips';

  return (
    <Lobby 
      title={formattedTitle}
      onCreateGame={handleCreateGame}
      onJoinGame={handleJoinGame}
      onGoHome={() => navigate('/')}
      pendingGames={pendingGames}
    />
  );
}
