import React, { useEffect, useState } from 'react';
import type { FlipsState, FlipsAction } from '../engine/reducer';
import type { BasePlayer } from '@erez/boardgame-core';
import { GameLayout, GameLog, BOT_NAMES } from '@erez/boardgame-core';

interface FlipsBoardProps {
  gameState: FlipsState;
  myPlayerId: string;
  dispatch: (action: FlipsAction) => void;
  onLeaveGame: () => void;
}

export const FlipsBoard: React.FC<FlipsBoardProps> = ({ gameState, myPlayerId, dispatch, onLeaveGame }) => {
  const { status, targetScore, players, playerOrder, currentPlayerIndex, winnerId, lastFlipResult, chatMessages } = gameState;
  const [logs, setLogs] = useState<React.ReactNode[]>([]);

  // Base players for framework
  const basePlayers: BasePlayer[] = playerOrder.map((id) => players[id]);

  const currentPlayerId = playerOrder[currentPlayerIndex];
  const isMyTurn = currentPlayerId === myPlayerId;
  const iAmWinner = winnerId === myPlayerId;

  // Track logs
  useEffect(() => {
    if (lastFlipResult) {
      const p = players[lastFlipResult.playerId];
      const resultText = lastFlipResult.isHeads ? 'Heads (+1)' : 'Tails';
      setLogs(prev => [
        ...prev, 
        <span key={prev.length}><strong style={{color: p.color}}>{p.name}</strong> flipped {resultText}</span>, 
        '---'
      ]);
    }
  }, [lastFlipResult, players]);

  const isHost = playerOrder.length > 0 && playerOrder[0] === myPlayerId;

  // Bot Auto-Play Logic & Chatter (Only Host runs this to prevent duplicate actions)
  useEffect(() => {
    if (!isHost) return;
    
    if (status === 'Playing' && currentPlayerId) {
      const currentPlayer = players[currentPlayerId];
      if (currentPlayer.isBot) {
        const timer = setTimeout(() => {
          const isHeads = Math.random() > 0.5;
          dispatch({ type: 'FLIP_COIN', payload: { playerId: currentPlayerId, isHeads } });
        }, 1500);

        // Random chatter
        const humanSpoke = chatMessages.some(m => m.sender === players[myPlayerId]?.name);
        if (!humanSpoke && Math.random() > 0.7) {
          const chatTimer = setTimeout(() => {
            const msgs = ["I'm feeling lucky!", "Tails never fails...", "Beep boop, calculating flip...", "You humans stand no chance!"];
            const msg = msgs[Math.floor(Math.random() * msgs.length)];
            dispatch({ type: 'SEND_CHAT_MESSAGE', payload: { sender: currentPlayer.name, text: msg, color: currentPlayer.color } });
          }, 800);
          return () => { clearTimeout(timer); clearTimeout(chatTimer); }
        }

        return () => clearTimeout(timer);
      }
    }
  }, [status, currentPlayerId, players, dispatch, chatMessages, isHost, myPlayerId]);

  const handleStart = () => dispatch({ type: 'START_GAME' });
  const handleAddBot = () => {
    const botId = 'bot-' + Math.random().toString(36).substring(2, 6);
    const botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    dispatch({ type: 'JOIN_GAME', payload: { playerId: botId, name: botName, isBot: true } });
  };
  const handleFlip = () => {
    if (!isMyTurn || status !== 'Playing') return;
    const isHeads = Math.random() > 0.5;
    dispatch({ type: 'FLIP_COIN', payload: { playerId: myPlayerId, isHeads } });
  };

  const renderSettings = () => (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <div style={{ margin: '20px' }}>
        <label style={{ fontSize: '18px', marginRight: '10px' }}>Target Score to Win:</label>
        <input 
          type="number" 
          value={targetScore} 
          onChange={e => dispatch({ type: 'SET_TARGET_SCORE', payload: { targetScore: parseInt(e.target.value) || 1 } })}
          disabled={status !== 'Lobby'}
          className="modern-input" 
          style={{ width: '100px', display: 'inline-block' }}
        />
      </div>
      {status === 'Lobby' && <p style={{ color: 'gray' }}>Waiting for the host to start the game...</p>}
    </div>
  );

  const renderGraphics = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '20px' }}>
      {status === 'Finished' && (
        <div style={{ padding: '15px 40px', background: iAmWinner ? '#22c55e' : 'rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', marginBottom: '30px', textAlign: 'center', fontSize: '32px', fontWeight: 'bold' }}>
          {iAmWinner ? "🏆 You Won!" : `Winner: ${players[winnerId!].name}`}
        </div>
      )}

      {lastFlipResult && (
        <div style={{ marginBottom: '40px', fontSize: '24px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px' }}>
          <strong style={{ color: players[lastFlipResult.playerId]?.color }}>
            {players[lastFlipResult.playerId].name}
          </strong> flipped a coin and got: 
          <div style={{ 
            color: lastFlipResult.isHeads ? '#4ade80' : '#ef4444', 
            marginTop: '10px', 
            fontWeight: 'bold',
            fontSize: '48px'
          }}>
            {lastFlipResult.isHeads ? 'HEADS (+1)' : 'TAILS'}
          </div>
        </div>
      )}

      {status !== 'Finished' && (
        <button 
          className="btn primary"
          onClick={handleFlip} 
          disabled={!isMyTurn || status !== 'Playing'}
          style={{ 
            padding: '30px 60px', 
            fontSize: '32px', 
            cursor: isMyTurn && status === 'Playing' ? 'pointer' : 'not-allowed',
            opacity: isMyTurn && status === 'Playing' ? 1 : 0.5,
            borderRadius: '16px',
            boxShadow: isMyTurn && status === 'Playing' ? '0 0 30px rgba(74, 222, 128, 0.4)' : 'none'
          }}
        >
          {isMyTurn && status === 'Playing' ? "🎲 FLIP COIN" : "Waiting for turn..."}
        </button>
      )}
    </div>
  );

  const renderPlayerDetails = (playerId: string) => {
    const p = players[playerId];
    return (
      <div style={{ marginTop: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: '36px', fontWeight: 'bold', color: p.score >= targetScore ? '#4ade80' : 'white' }}>
          {p.score} <span style={{ fontSize: '14px', color: 'gray', fontWeight: 'normal' }}>pts</span>
        </div>
      </div>
    );
  };

  const renderStats = () => {
    const maxTurns = Math.max(1, ...Object.values(players).map(p => p.pointsHistory.length - 1));
    const sortedPlayers = [...playerOrder].sort((a, b) => players[b].score - players[a].score);
    
    // Compute exact SVG dimensions
    const svgWidth = Math.max(600, maxTurns * 60);
    const svgHeight = 200;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        {/* Top: Stats Table */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0' }}>Final Standings</h3>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                <th style={{ padding: '10px' }}>Player</th>
                <th style={{ padding: '10px' }}>Points</th>
                <th style={{ padding: '10px' }}>Heads</th>
                <th style={{ padding: '10px' }}>Tails</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((id, index) => {
                const p = players[id];
                return (
                  <tr key={id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '10px', color: p.color, fontWeight: 'bold' }}>
                      {index === 0 && '🏆 '} {p.name}
                    </td>
                    <td style={{ padding: '10px', fontSize: '1.2em', fontWeight: 'bold' }}>{p.score}</td>
                    <td style={{ padding: '10px', color: '#4ade80' }}>{p.headsCount}</td>
                    <td style={{ padding: '10px', color: '#ef4444' }}>{p.tailsCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom: Line Graph */}
        <div>
          <h3 style={{ margin: '0 0 15px 0' }}>Points Progression</h3>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px', overflowX: 'auto' }}>
            <svg width={svgWidth} height={svgHeight} style={{ overflow: 'visible', margin: '10px' }}>
              {/* Axes */}
              <line x1="0" y1={svgHeight} x2={svgWidth} y2={svgHeight} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
              <line x1="0" y1="0" x2="0" y2={svgHeight} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
              
              {playerOrder.map(id => {
                const p = players[id];
                const color = p.color || 'white';
                
                // Construct polyline points using absolute pixels
                const points = p.pointsHistory.map((pts, idx) => {
                  const x = (idx / maxTurns) * svgWidth;
                  const y = svgHeight - ((pts / targetScore) * svgHeight);
                  return `${x},${y}`;
                }).join(' ');

                return (
                  <g key={id}>
                    <polyline fill="none" stroke={color} strokeWidth="4" strokeLinejoin="round" points={points} />
                    {p.pointsHistory.map((pts, idx) => {
                      const x = (idx / maxTurns) * svgWidth;
                      const y = svgHeight - ((pts / targetScore) * svgHeight);
                      return <circle key={idx} cx={x} cy={y} r="5" fill={color} />;
                    })}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    );
  };

  const handleSendMessage = (msg: string) => {
    dispatch({ type: 'SEND_CHAT_MESSAGE', payload: { sender: players[myPlayerId]?.name || 'You', text: msg, color: players[myPlayerId]?.color } });
  };

  return (
    <GameLayout
      gameName="Flips"
      status={status}
      players={basePlayers}
      currentPlayerId={currentPlayerId}
      chatMessages={chatMessages}
      onSendMessage={handleSendMessage}
      onStartGame={status === 'Lobby' ? handleStart : undefined}
      onAddBot={status === 'Lobby' ? handleAddBot : undefined}
      onNewGame={() => onLeaveGame()} // Navigate back to lobby to reset
      onLeaveGame={onLeaveGame}
      helpText="Flips: First to target points wins! Click FLIP COIN to test your luck."
      renderSettings={renderSettings}
      renderGraphics={renderGraphics}
      renderPlayerDetails={renderPlayerDetails}
      renderLog={() => <GameLog logs={logs} />}
      renderStats={renderStats}
    />
  );
};
