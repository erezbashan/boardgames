import React, { useState, useEffect } from 'react';
import './GameLayout.css';
import { Modal } from './Modal';
import { ChatWindow } from './ChatWindow';
import { useGameController } from '../hooks/useGameController';
import { useGameContext } from '../hooks/GameContext';
import { GameLog } from './GameLog';
import type { BaseGameState, BasePlayer, ChatMessage, GameStatus } from '../engine/types';

export const colorizeLog = (logText: string, players: any[] = []) => {
  if (!players) players = [];
  let parts: React.ReactNode[] = [logText];
  const sortedPlayers = [...players].sort((a, b) => (b?.name?.length || 0) - (a?.name?.length || 0));
  
  sortedPlayers.forEach(p => {
    if (!p || !p.name) return;
    const newParts: React.ReactNode[] = [];
    parts.forEach(part => {
      if (typeof part === 'string') {
        const split = part.split(p.name);
        split.forEach((s, idx) => {
          newParts.push(s);
          if (idx < split.length - 1) {
            newParts.push(<span key={p.id + idx} style={{ color: p.color || 'white', fontWeight: 'bold' }}>{p.name}</span>);
          }
        });
      } else {
        newParts.push(part);
      }
    });
    parts = newParts;
  });
  return parts;
};

export interface GameLayoutProps {
  bottomAreaRatio?: number;
  gameName: string;
  
  // Content Slots
  helpText?: string;
  helpUrl?: string;
  children?: React.ReactNode; 
  settings?: React.ReactNode; 
  renderGameSpecificPlayerDetails?: (playerId: string) => React.ReactNode;
  renderGameSpecificStats?: () => React.ReactNode;
  renderLogMessage?: (msg: string, defaultRenderer: (m: string) => React.ReactNode) => React.ReactNode;
}

export const GameLayout: React.FC<GameLayoutProps> = ({
  bottomAreaRatio = 45,
  gameName,
  helpText,
  helpUrl,
  settings,
  children,
  renderGameSpecificPlayerDetails,
  renderGameSpecificStats,
  renderLogMessage
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const { gameState, myPlayerId, dispatch, onLeaveGame } = useGameContext();
  const { handleStart, handleAddBot, handleSendMessage, handleNewGame, handleRemovePlayer } = useGameController(dispatch, gameState);
  
  const { status, players: playersMap, playerOrder, currentPlayerIndex, chatMessages, logs } = gameState;
  const myIndex = playerOrder.indexOf(myPlayerId);
  const displayOrder = myIndex >= 0 ? [...playerOrder.slice(myIndex), ...playerOrder.slice(0, myIndex)] : playerOrder;
  const players = displayOrder.map((id: string) => playersMap[id]);
  

  const currentPlayerId = playerOrder[currentPlayerIndex];

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
          {status === 'Lobby' && playerOrder.length > 1 && (
            <button className="btn primary" onClick={handleStart}>Start Game</button>
          )}
          {status === 'Lobby' && (
            <button className="btn secondary" onClick={handleAddBot}>Add Bot</button>
          )}
          {(status === 'Lobby' || status === 'Playing') && (
            <button className="btn secondary" onClick={() => setShowSettings(true)}>Settings</button>
          )}
          {status === 'Finished' && (
            <button className="btn primary" onClick={handleNewGame}>New Game</button>
          )}
          {status === 'Finished' && renderGameSpecificStats && (
            <button className="btn secondary" onClick={() => setShowStats(true)}>Stats</button>
          )}
          <button className="btn secondary" onClick={() => setShowShare(true)}>Share</button>
          
          <button className="btn danger" onClick={onLeaveGame}>
            {status === 'Playing' ? 'Quit Game' : 'Back to Lobby'}
          </button>
          <button className="btn secondary" onClick={() => setShowHelp(true)}>Help</button>
        </div>
      </div>

      {/* MAIN AREA */}
      <div className="game-main-area">
        {/* LEFT PANE */}
        <div className="game-left-pane">
          <div className="game-stage-area" style={{ flex: 100 - bottomAreaRatio, overflowY: status === 'Lobby' ? 'auto' : 'hidden', position: 'relative' }}>
            {status === 'Lobby' && settings}
            {status !== 'Lobby' && (
              <>
                {status === 'Finished' && (
                  <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 500, padding: '15px 40px', background: gameState.winnerId === myPlayerId ? '#22c55e' : 'rgba(0,0,0,0.8)', color: 'white', borderRadius: '12px', textAlign: 'center', fontSize: '32px', fontWeight: 'bold', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '2px solid rgba(255,255,255,0.2)' }}>
                    {gameState.winnerId === myPlayerId ? "🏆 You Won!" : `🏆 Winner: ${gameState.winnerId && playersMap[gameState.winnerId] ? playersMap[gameState.winnerId].name : 'Unknown'}`}
                  </div>
                )}
                {children}
              </>
            )}
          </div>
          <div className="game-bottom-area" style={{ flex: bottomAreaRatio }}>
            <div className="game-log-wrapper">
              {(() => {
                                let recentLogsStartIndex = 0;
                let myName = '';
                if (myPlayerId && gameState?.players && gameState.players[myPlayerId]) {
                  myName = gameState.players[myPlayerId].name || '';
                }
                
                let foundMyLastTurn = false;
                for (let i = logs.length - 1; i >= 0; i--) {
                  recentLogsStartIndex = i;
                  if (logs[i].includes(`'s Turn ---`)) {
                    if (myName && logs[i].includes(myName)) {
                      // Found the start of my most recent turn
                      foundMyLastTurn = true;
                      break;
                    }
                  }
                }
                // Fallback if we couldn't find my turn (e.g. spectator or start of game)
                if (!foundMyLastTurn) {
                  let turnsFound = 0;
                  for (let i = logs.length - 1; i >= 0; i--) {
                    if (logs[i].includes(`'s Turn ---`)) {
                      turnsFound++;
                      recentLogsStartIndex = i;
                      if (turnsFound === 2) {
                        break;
                      }
                    }
                  }
                }
                
                if (logs.length - recentLogsStartIndex < 5) {
                   recentLogsStartIndex = Math.max(0, logs.length - 10);
                }
                const renderedAllLogs = logs.map((l: string, index: number) => <span key={`msg-${index}`}>{renderLogMessage ? renderLogMessage(l, (m) => colorizeLog(m, players)) : colorizeLog(l, players)}</span>);
                const renderedRecentLogs = renderedAllLogs.slice(recentLogsStartIndex);
                return <GameLog logs={renderedRecentLogs} allLogs={renderedAllLogs} rawLogs={logs} />;
              })()}
            </div>
            <div className="game-chat-wrapper">
              <ChatWindow 
                messages={chatMessages} 
                onSendMessage={(msg) => handleSendMessage(msg, playersMap[myPlayerId]?.name || 'You', playersMap[myPlayerId]?.color)} 
              />
            </div>
          </div>
        </div>

        {/* RIGHT PANE (Players) */}
        <div className="game-right-pane">
          {players.map((p: any) => {
            const isPlaying = p.id === currentPlayerId && status === 'Playing';
            const isMe = p.id === myPlayerId;
            const isWinner = p.id === gameState.winnerId;
            return (
              <div key={p.id} className={`player-card ${isPlaying ? 'is-playing' : ''} ${isWinner ? 'is-winner' : ''}`} style={{ borderLeftColor: p.color || 'rgba(255,255,255,0.1)', borderLeftWidth: p.color ? '4px' : '1px', position: 'relative' }}>
                <div className="player-card-header">
                  <span className="player-name" style={{ color: p.color || 'white' }}>
                    {p.name} 
                    {p.isBot && <span title={`Bot Strategy: ${p.botStrategy || 'random'}`}>🤖</span>} 
                    {isMe && <span style={{ color: 'gray', fontSize: '0.8em' }}>(You)</span>}
                  </span>
                  
                  {isWinner && <span className="winner-banner">🏆 Winner</span>}
                  {isPlaying && <span className="playing-banner">Playing</span>}
                  {status === 'Lobby' && !isMe && (
                    <button 
                      className="btn danger" 
                      style={{ padding: '2px 6px', fontSize: '10px', marginLeft: 'auto' }}
                      onClick={() => handleRemovePlayer(p.id)}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="player-card-content">
                  {renderGameSpecificPlayerDetails && renderGameSpecificPlayerDetails(p.id)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODALS */}
      <Modal isOpen={showSettings} title="Game Settings" onClose={() => setShowSettings(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Shared Settings */}
          <div>
            <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px' }}>General Settings</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Speed of Play:</label>
              <select 
                className="modern-input"
                style={{ width: '150px' }}
                
                value={gameState.settings?.gameSpeed || 'Normal'}
                onChange={e => dispatch({ type: 'UPDATE_SETTINGS', payload: { ...gameState.settings, gameSpeed: e.target.value } })}
              >
                <option value="Slow">Slow</option>
                <option value="Normal">Normal</option>
                <option value="Fast">Fast</option>
                <option value="Ultra">Ultra</option>
              </select>
            </div>
            
          </div>

          {/* Game Specific Settings */}
          {settings && (
            <div>
              <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px' }}>Game Rules</h4>
              {settings}
            </div>
          )}
        </div>
      </Modal>

      <Modal isOpen={showHelp} title="Help" onClose={() => setShowHelp(false)}>
        <p style={{ lineHeight: '1.6', fontSize: '1.1rem' }}>{helpText || "No help text provided for this game."}</p>
        {helpUrl && (
          <div style={{ marginTop: '20px' }}>
            <a href={helpUrl} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold' }}>
              Read the full rules on Wikipedia
            </a>
          </div>
        )}
        <div style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
          <p style={{ color: 'gray' }}>Got feedback or found a bug?</p>
          <a href={`mailto:erez.bashan@gmail.com?subject=Feedback%20for%20game%20${encodeURIComponent(gameName)}`} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold' }}>Email erez.bashan@gmail.com</a>
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
        {renderGameSpecificStats && renderGameSpecificStats()}
      </Modal>

    </div>
  );
};
