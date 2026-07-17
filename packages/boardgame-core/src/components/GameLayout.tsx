import React, { useState, useEffect } from 'react';
import './GameLayout.css';
import { Modal } from './Modal';
import { ChatWindow } from './ChatWindow';
import type { BasePlayer, ChatMessage, GameStatus } from '../engine/types';

export interface GameLayoutProps {
  gameName: string;
  status: GameStatus;
  players: BasePlayer[];
  currentPlayerId?: string;
  chatMessages?: ChatMessage[];
  
  // Actions
  onStartGame?: () => void;
  onAddBot?: () => void;
  onLeaveGame?: () => void;
  onNewGame?: () => void;
  onSendMessage?: (msg: string) => void;
  
  // Content Slots
  helpText?: string;
  renderSettings?: () => React.ReactNode;
  renderGraphics?: () => React.ReactNode;
  renderPlayerDetails?: (playerId: string) => React.ReactNode;
  renderChat?: () => React.ReactNode;
  renderLog?: () => React.ReactNode;
  renderStats?: () => React.ReactNode;
}

export const GameLayout: React.FC<GameLayoutProps> = ({
  gameName,
  status,
  players,
  currentPlayerId,
  onStartGame,
  onAddBot,
  onLeaveGame,
  onNewGame,
  onSendMessage,
  helpText,
  renderSettings,
  renderGraphics,
  renderPlayerDetails,
  chatMessages,
  renderLog,
  renderStats
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Auto-show stats after 2 seconds when finished
  useEffect(() => {
    if (status === 'Finished') {
      const timer = setTimeout(() => setShowStats(true), 2000);
      return () => clearTimeout(timer);
    } else {
      setShowStats(false);
    }
  }, [status]);

  return (
    <div className="game-layout-container">
      {/* TOP BAR */}
      <div className="game-top-bar">
        <h1 className="game-title">{gameName}</h1>
        <div className="game-top-actions">
          {status === 'Lobby' && onStartGame && (
            <button className="btn primary" onClick={onStartGame}>Start Game</button>
          )}
          {status === 'Lobby' && onAddBot && (
            <button className="btn secondary" onClick={onAddBot}>Add Bot</button>
          )}
          {status === 'Playing' && renderSettings && (
            <button className="btn secondary" onClick={() => setShowSettings(true)}>Settings</button>
          )}
          {status === 'Finished' && onNewGame && (
            <button className="btn primary" onClick={onNewGame}>New Game</button>
          )}
          {status === 'Finished' && renderStats && (
            <button className="btn secondary" onClick={() => setShowStats(true)}>Stats</button>
          )}
          <button className="btn secondary" onClick={() => setShowShare(true)}>Share</button>
          
          {onLeaveGame && (
            <button className="btn danger" onClick={onLeaveGame}>
              {status === 'Playing' ? 'Quit Game' : 'Back to Lobby'}
            </button>
          )}
          <button className="btn secondary" onClick={() => setShowHelp(true)}>Help</button>
        </div>
      </div>

      {/* MAIN AREA */}
      <div className="game-main-area">
        {/* LEFT PANE */}
        <div className="game-left-pane">
          <div className="game-stage-area">
            {status === 'Lobby' && renderSettings && renderSettings()}
            {status !== 'Lobby' && renderGraphics && renderGraphics()}
          </div>
          <div className="game-bottom-area">
            <div className="game-log-wrapper">
              {renderLog && renderLog()}
            </div>
            <div className="game-chat-wrapper">
              {chatMessages && onSendMessage && (
                <ChatWindow messages={chatMessages} onSendMessage={onSendMessage} />
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANE (Players) */}
        <div className="game-right-pane">
          <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px' }}>
            Players ({players.length})
          </h3>
          
          {players.map(p => {
            const isPlaying = p.id === currentPlayerId && status === 'Playing';
            return (
              <div key={p.id} className={`player-card ${isPlaying ? 'is-playing' : ''} ${p.isWinner ? 'is-winner' : ''}`} style={{ borderLeftColor: p.color || 'rgba(255,255,255,0.1)', borderLeftWidth: p.color ? '4px' : '1px' }}>
                <div className="player-card-header">
                  <span className="player-name">
                    {p.name} {p.isBot && <span title="Bot">🤖</span>} {p.isWinner && <span title="Winner" style={{ marginLeft: '5px' }}>🏆</span>}
                  </span>
                  {isPlaying && <span className="playing-banner">Playing</span>}
                </div>
                <div className="player-card-content">
                  {renderPlayerDetails && renderPlayerDetails(p.id)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODALS */}
      <Modal isOpen={showSettings} title="Game Settings" onClose={() => setShowSettings(false)}>
        {renderSettings && renderSettings()}
      </Modal>

      <Modal isOpen={showHelp} title="Help" onClose={() => setShowHelp(false)}>
        <p style={{ lineHeight: '1.6', fontSize: '1.1rem' }}>{helpText || "No help text provided for this game."}</p>
        <div style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
          <p style={{ color: 'gray' }}>Got feedback or found a bug?</p>
          <a href="mailto:erez.bashan@gmail.com" target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold' }}>Email erez.bashan@gmail.com</a>
        </div>
      </Modal>

      <Modal isOpen={showShare} title="Share Game" onClose={() => setShowShare(false)}>
        <p>Invite your friends to play!</p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <input className="modern-input" value={window.location.href} readOnly style={{ flex: 1, padding: '10px' }} />
          <button className="btn primary" onClick={() => navigator.clipboard.writeText(window.location.href)}>Copy</button>
        </div>
      </Modal>

      <Modal isOpen={showStats} title="Game Stats" onClose={() => setShowStats(false)} width="800px">
        {renderStats && renderStats()}
      </Modal>

    </div>
  );
};
