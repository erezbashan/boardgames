import React, { useState } from 'react';
import './Lobby.css';

export interface PendingGame {
  id: string;
  gameType: string;
  playersCount: number;
  status: string;
}

export interface LobbyProps {
  title?: string;
  initialUsername?: string;
  pendingGames?: PendingGame[];
  onCreateGame: (username: string) => void;
  onJoinGame: (gameId: string, username: string) => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  title = "Game Lobby",
  initialUsername = "",
  pendingGames = [],
  onCreateGame,
  onJoinGame
}) => {
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('boardgames_username') || initialUsername;
  });

  const handleUsernameChange = (val: string) => {
    setUsername(val);
    localStorage.setItem('boardgames_username', val);
  };

  const handleCreate = () => {
    if (username.trim()) onCreateGame(username.trim());
  };

  const handleJoin = (targetGameId: string) => {
    if (username.trim()) {
      onJoinGame(targetGameId, username.trim());
    }
  };

  return (
    <div className="lobby-container">
      <h1 className="lobby-title">{title}</h1>
      
      <div className="lobby-card glass-panel">
        <input 
          type="text" 
          placeholder="Your Name" 
          value={username} 
          onChange={e => handleUsernameChange(e.target.value)}
          className="modern-input"
          autoComplete="off"
        />
        <button 
          onClick={handleCreate} 
          disabled={!username.trim()} 
          className="btn primary"
        >
          Create New Game
        </button>
      </div>

      {pendingGames.length > 0 && (
        <div className="lobby-card glass-panel" style={{ marginTop: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', textAlign: 'center' }}>Open Games</h3>
          <div className="pending-games-list">
            {pendingGames.map(game => (
              <div key={game.id} className="pending-game-item">
                <div className="game-info">
                  <span className="game-id">{game.id}</span>
                  <span className="game-meta">{game.playersCount} players waiting</span>
                </div>
                <button 
                  onClick={() => handleJoin(game.id)} 
                  disabled={!username.trim()} 
                  className="btn secondary" 
                  style={{ padding: '8px 16px', fontSize: '14px' }}
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
