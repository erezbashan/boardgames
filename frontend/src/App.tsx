import { useState, useRef, useEffect } from 'react';
import { useSocket } from './SocketContext';
import type { Card } from '@king-of-tokyo/shared';
import type React from 'react';
import './App.css';
import { GameOverScreen } from './GameOverScreen';

function App() {
  const { connected, gameState, playerId, createGame, joinGame, quitGame, returnToLobby, addBot, startGame, rollDice, keepDice, resolveDice, yieldTokyo, buyCard, sweepCards, endTurn, sendChat } = useSocket();
  const [username, setUsername] = useState(localStorage.getItem('kot_username') || '');
  const [gameIdInput, setGameIdInput] = useState(() => {
    return new URLSearchParams(window.location.search).get('game') || '';
  });
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);
  

  useEffect(() => {
    if (gameState?.status === "GameOver") {
      setTimeout(() => {
        setShowStats(true);
      }, 3000);
    } else {
      setShowStats(false);
    }
  }, [gameState?.status]);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [chatText, setChatText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);
    const initialPlayerIdRef = useRef<string | null>(localStorage.getItem('kot_playerId') || null);

  useEffect(() => {
    if (gameState?.id) {
      window.history.replaceState(null, '', `?game=${gameState.id}`);
    } else {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [gameState?.id]);

  useEffect(() => {
    if (connected) {
      const urlParams = new URLSearchParams(window.location.search);
      const gameParam = urlParams.get('game');
      if (gameParam) {
        // Use the current playerId if we have one (from before disconnect), otherwise fallback to the initial one
        const currentId = playerId || initialPlayerIdRef.current || undefined;
        joinGame(gameParam, username, currentId);
      }
    }
  }, [connected]); // Re-join the room anytime we reconnect

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState?.chatMessages?.length]);

  if (!connected) {
    return <div className="loading-screen">Connecting to server...</div>;
  }

  const handleCreateGame = () => {
    localStorage.setItem('kot_username', username);
    createGame(username);
  };

  const handleJoinGame = () => {
    localStorage.setItem('kot_username', username);
    joinGame(gameIdInput, username, initialPlayerIdRef.current || undefined);
  };

  if (!gameState) {
    return (
      <div className="lobby-container">
        <h1>King of Tokyo</h1>
        <div className="lobby-card glass-panel">
          <input 
            type="text" 
            placeholder="Your Name" 
            value={username} 
            onChange={e => setUsername(e.target.value)}
            className="modern-input"
          />
          <button onClick={handleCreateGame} disabled={!username} className="btn primary">Create Game</button>
          
          <div className="divider">OR</div>
          
          <input 
            type="text" 
            placeholder="Game ID" 
            value={gameIdInput} 
            onChange={e => setGameIdInput(e.target.value)}
            className="modern-input"
          />
          <button onClick={handleJoinGame} disabled={!username || !gameIdInput} className="btn secondary">Join Game</button>
        </div>
      </div>
    );
  }

  // GAME BOARD VIEW
  return (
    <div className="game-container">
      <header className="game-header glass-panel">
        <h1 className="logo" style={{ margin: 0, fontSize: '24px' }}>👑 King of Tokyo</h1>
        <div style={{ flex: 1 }}></div>
        {gameState.status === 'Lobby' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => addBot(gameState.id)} className="btn secondary">Add Bot</button>
            <button onClick={() => startGame(gameState.id)} className="btn primary">Start Game</button>
          </div>
        )}
        {gameState.status === "GameOver" && (
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setShowStats(true)} className="btn primary">View Stats</button>
            <button onClick={() => returnToLobby(gameState.id)} className="btn danger">Return to Lobby</button>
          </div>
        )}
        <div style={{ display: "flex", gap: "8px", marginLeft: "16px" }}>
          <button onClick={() => setShowHelp(true)} className="btn secondary">Help</button>
          <button onClick={() => quitGame(gameState.id)} className="btn danger">Quit</button>
        </div>
      </header>

      <div className="board-layout">
        <div className="left-column" style={{ gap: '8px' }}>
          {(gameState.status === 'Playing' || gameState.status === 'GameOver') && (
            <>
              <div className="market-board glass-panel" style={{ padding: '8px' }}>
                <div className="cards-list" style={{ display: 'flex', gap: '8px', overflowX: 'auto', alignItems: 'flex-start' }}>
                  {gameState.marketCards.map(card => {
                    const myEnergy = gameState.players[playerId!]?.energy || 0;
                    const isMyTurn = gameState.currentTurnPlayerId === playerId;
                    const isBuyPhase = isMyTurn && gameState.rollsLeft === 0 && !gameState.isAnimating;
                    const canBuy = isMyTurn && myEnergy >= card.cost && !gameState.isAnimating;
                    return (
                      <div key={card.id} className="card-item glass-panel" style={{ width: '160px', height: '180px', flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '8px', cursor: 'pointer' }} onClick={() => setSelectedCard(card)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <strong>{card.name}</strong>
                          <span className="stat energy">{card.cost} ⚡</span>
                        </div>
                        <div style={{ fontSize: '11px', flex: 1, marginBottom: '8px', color: 'rgba(255,255,255,0.7)' }}>
                          <em>{card.type}</em><br/>
                          {card.description}
                        </div>
                        <button 
                          className={`btn primary ${canBuy && isBuyPhase ? 'flash' : ''}`}
                          disabled={!canBuy || gameState.status === 'GameOver'}
                          onClick={(e) => { e.stopPropagation(); buyCard(gameState.id, card.id); }}
                          style={{ width: '100%', padding: '6px' }}
                        >
                          Buy
                        </button>
                      </div>
                    );
                  })}
                  
                  
                  {gameState.currentTurnPlayerId === playerId && gameState.rollsLeft === 0 && !gameState.isAnimating && gameState.status !== 'GameOver' && (
                    <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                      <button 
                        onClick={() => sweepCards(gameState.id)} 
                        className="btn secondary"
                        disabled={!gameState.players[playerId!] || gameState.players[playerId!].energy < 2 || (gameState as any).deckCount === 0}
                        style={{ whiteSpace: 'nowrap', width: '100%' }}
                      >
                        Sweep (2 ⚡)
                      </button>
                      <button 
                        onClick={() => endTurn(gameState.id)} 
                        className="btn warning flash"
                        style={{ whiteSpace: 'nowrap', padding: '16px 24px', fontSize: '16px', width: '100%' }}
                      >
                        End Turn
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="dice-display glass-panel" style={{ padding: '8px' }}>
                <div className="dice-container" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '16px' }}>
                  <div /> {/* Left empty space to keep dice centered */}
                  
                  {/* Dice renderer */}
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    {gameState.currentDice.length > 0 ? (
                      gameState.currentDice.map(die => (
                        <div key={die.id} className="die-wrapper" style={{ animation: 'roll-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                          <div 
                            className={`die ${die.kept ? 'kept' : ''} ${gameState.highlightedDice?.includes(die.id) ? 'animating' : ''}`}
                            style={{ position: 'relative' }}
                            onClick={() => {
                              if (gameState.currentTurnPlayerId === playerId && gameState.rollsLeft < 3 && gameState.rollsLeft > 0) {
                                const newKept = die.kept 
                                  ? gameState.currentDice.filter(d => d.kept && d.id !== die.id).map(d => d.id)
                                  : [...gameState.currentDice.filter(d => d.kept).map(d => d.id), die.id];
                                keepDice(gameState.id, newKept);
                              }
                            }}
                          >
                            {die.kept && <div style={{ position: 'absolute', top: -6, right: -6, fontSize: '14px', background: 'rgba(0,0,0,0.8)', borderRadius: '50%', padding: '2px 4px', boxShadow: '0 0 5px rgba(0,0,0,0.5)' }}>🔒</div>}
                            <span style={{ fontSize: '24px' }}>
                              {(() => {
                                const faceIcons: Record<string, string> = {
                                  '1': '1️⃣',
                                  '2': '2️⃣',
                                  '3': '3️⃣',
                                  'Heart': '❤️',
                                  'Lightning': '⚡',
                                  'Claw': '💥'
                                };
                                return faceIcons[die.face as string];
                              })()}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      /* Empty placeholders */
                      (() => {
                        const activeP = gameState.players[gameState.currentTurnPlayerId || ''];
                        const extraDice = activeP?.cards?.reduce((sum: number, c: any) => sum + (c.effect?.extraDie || 0), 0) || 0;
                        const numDice = 6 + extraDice;
                        return Array.from({ length: numDice }).map((_, idx) => (
                          <div key={idx} className="die empty" style={{ opacity: 0.3 }}>
                            <span style={{ fontSize: '24px' }}>❓</span>
                          </div>
                        ));
                      })()
                    )}
                  </div>
                  
                  {/* Inline Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-start' }}>
                    {gameState.currentTurnPlayerId === playerId && gameState.status === 'Playing' ? (
                      <>
                        {gameState.rollsLeft === 3 && (
                          <button onClick={() => rollDice(gameState.id)} className="btn primary flash" disabled={gameState.isAnimating}>
                            Roll Dice
                          </button>
                        )}
                        
                        {gameState.rollsLeft > 0 && gameState.rollsLeft < 3 && (
                          <>
                            <button onClick={() => rollDice(gameState.id)} className="btn primary flash" disabled={gameState.isAnimating}>
                              Reroll ({gameState.rollsLeft} left)
                            </button>
                            <button onClick={() => resolveDice(gameState.id)} className="btn warning flash" disabled={gameState.isAnimating}>
                              Done
                            </button>
                          </>
                        )}
                        
                        {gameState.rollsLeft === 0 && (
                          <span className="muted" style={{ paddingLeft: '8px' }}>Buy cards or End Turn above ☝️</span>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Chat and Logs Row */}
              <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: '250px' }}>
                <div className="game-logs glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '14px' }}>Recent Logs</h3>
                    <button onClick={() => setShowAllLogs(true)} className="btn secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>View All</button>
                  </div>
                  <div className="log-entries" style={{ flex: 1, overflowY: 'auto', fontSize: '13px', lineHeight: '1.4', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {(() => {
                      const myName = gameState.players[playerId!]?.name || username || '';
                      const logs = gameState.logs.slice().reverse();
                      let matches = 0;
                      const targetMatches = gameState.currentTurnPlayerId === playerId ? 2 : 1;
                      const lastTurnIdx = logs.findIndex(l => {
                        if (l === `TURN_START:${myName}` || l === `Turn ended. It is now ${myName}'s turn.` || l === 'Game started!') {
                          matches++;
                          return matches === targetMatches;
                        }
                        return false;
                      });
                      const recentLogs = lastTurnIdx !== -1 ? logs.slice(0, lastTurnIdx + 1) : logs;
                      
                      return recentLogs.map((log, i) => {
                        if (log.startsWith('TURN_START:')) {
                          return (
                            <div key={i} style={{ 
                              margin: '12px 0 4px 0', 
                              borderBottom: '1px solid rgba(255,255,255,0.15)'
                            }}></div>
                          );
                        }
                        
                        if (log.startsWith('BUY_CARD:')) {
                          const parts = log.split('BUY_CARD:')[1];
                          const firstColon = parts.indexOf(':');
                          const pName = parts.substring(0, firstColon);
                          const cardJson = parts.substring(firstColon + 1);
                          let card: any = null;
                          try { card = JSON.parse(cardJson); } catch (e) {}
                          
                          return (
                            <div key={i} style={{ 
                              padding: '6px', 
                              background: 'rgba(0,0,0,0.2)', 
                              borderRadius: '4px', 
                            }}>
                              {pName} bought{' '}
                              <span 
                                onClick={() => card && setSelectedCard(card)} 
                                style={{ 
                                  cursor: 'pointer', 
                                  color: 'var(--primary)', 
                                  textDecoration: 'underline',
                                  fontWeight: 'bold'
                                }}
                              >
                                {card?.name || 'a card'}
                              </span>
                              .
                            </div>
                          );
                        }
                        
                        const isTurnEnd = log.startsWith('Turn ended.');
                        return (
                          <div key={i} style={{ 
                            padding: '6px', 
                            background: isTurnEnd ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)', 
                            borderRadius: '4px', 
                            fontWeight: isTurnEnd ? 'bold' : 'normal'
                          }}>
                            {(() => {
                      const players = Object.values(gameState.players);
                      // Sort by name length descending so we match longer names first
                      const sortedPlayers = [...players].sort((a,b) => b.name.length - a.name.length);
                      
                      const renderLog = (logText: string): React.ReactNode => {
                        for (const p of sortedPlayers) {
                          if (p.name && logText.includes(p.name)) {
                            const split = logText.split(p.name);
                            return (
                              <>
                                {renderLog(split[0])}
                                <span style={{ color: p.color || 'white', fontWeight: 'bold' }}>{p.name}</span>
                                {renderLog(split.slice(1).join(p.name))}
                              </>
                            );
                          }
                        }
                        return logText;
                      };
                      return renderLog(log);
                    })()}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                <div className="chat-panel glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '12px' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Chat</h3>
                  <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                    {(gameState as any).chatMessages?.map((msg: any, i: number) => (
                      <div key={i} style={{ background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '6px' }}>
                        {(() => {
                          const senderPlayer = Object.values(gameState.players).find(p => p.name === msg.sender);
                          const color = senderPlayer?.color || 'var(--primary)';
                          return <><strong style={{ color }}>{msg.sender}:</strong> {msg.text}</>;
                        })()}
                      </div>
                    ))}
                    <div ref={chatBottomRef} />
                  </div>
                  <form onSubmit={e => { e.preventDefault(); sendChat(gameState.id, chatText); setChatText(''); }} style={{ display: 'flex', gap: '4px' }}>
                    <input type="text" value={chatText} onChange={e => setChatText(e.target.value)} className="modern-input" placeholder="Type a message..." style={{ flex: 1, padding: '6px', fontSize: '13px' }} />
                    <button type="submit" disabled={!chatText.trim()} className="btn primary" style={{ padding: '6px 12px' }}>Send</button>
                  </form>
                </div>
              </div>

            </>
          )}
        </div>

        <div className="right-column" style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minWidth: '280px', minHeight: 0 }}>
          <div className="players-list" style={{ flex: 1, overflowY: 'auto' }}>
            {(() => {
              const ordered = gameState.playerOrder.map(id => gameState.players[id]).filter(Boolean);
              Object.values(gameState.players).forEach(p => {
                if (!ordered.find(o => o.id === p.id)) ordered.push(p);
              });
              const isMe = (p: any) => p.id === playerId || p.name === username;
              const meIndex = ordered.findIndex(isMe);
              if (meIndex > 0) {
                return [...ordered.slice(meIndex), ...ordered.slice(0, meIndex)];
              }
              return ordered;
            })().map(p => {
              const isMePlayer = p.id === playerId || p.name === username;
              return (
              <div key={p.id} className={`player-card glass-panel ${p.id === gameState.currentTurnPlayerId && gameState.status !== 'GameOver' ? 'active-turn' : ''} ${isMePlayer ? 'is-me' : ''} ${p.inTokyo ? 'in-tokyo' : ''} ${p.id === gameState.winner ? 'winner-card' : ''}`} style={{ marginBottom: '8px', opacity: p.health <= 0 ? 0.5 : 1, filter: p.health <= 0 ? 'grayscale(100%)' : 'none' }}>
                <div className="player-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <strong style={{ color: p.color || 'white' }}>{p.name}</strong> {p.isBot && '🤖'} 
                    {p.poisonTokens > 0 && <span style={{ marginLeft: '6px', color: '#ff4444', fontWeight: 'bold', display: 'inline-block', animation: 'poison-pop 0.3s ease-out' }} key={p.poisonTokens}>{Array(p.poisonTokens).fill('☠️').join('')}</span>}
                  </div>
                  {p.id === gameState.currentTurnPlayerId && p.health > 0 && (
                    <div style={{ animation: 'flash-btn 1.5s infinite', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: 'bold' }}>
                      <span style={{ fontSize: '12px' }}>PLAYING</span> ◀️
                    </div>
                  )}
                </div>
                <div className="player-stats" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  <span className={`stat health ${gameState.highlightedStats?.some(s => s.playerId === p.id && s.stat === 'health') ? 'flash' : ''}`} style={{ display: 'inline-block', minWidth: '75px' }}>❤️ {Math.max(0, p.health)} / {p.maxHealth || 10}</span>
                  <span className={`stat vp ${gameState.highlightedStats?.some(s => s.playerId === p.id && s.stat === 'vp') ? 'flash' : ''}`}>⭐ {p.victoryPoints}</span>
                  <span className={`stat energy ${gameState.highlightedStats?.some(s => s.playerId === p.id && s.stat === 'energy') ? 'flash' : ''}`}>⚡ {p.energy}</span>
                </div>
                {p.cards && p.cards.length > 0 && (
                  <div className="player-cards" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                    {p.cards.map(c => (
                      <div key={c.id} onClick={() => setSelectedCard(c)} style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', border: '1px solid rgba(255,255,255,0.2)' }}>
                        🎴 {c.name}
                      </div>
                    ))}
                  </div>
                )}
                
                {p.id === gameState.winner ? (
                  <div className="tokyo-badge" style={{ background: '#fbbf24', color: '#78350f', borderColor: '#f59e0b', boxShadow: '0 0 20px rgba(251, 191, 36, 0.8)', animation: 'pulse-glow 1.5s infinite' }}>WINNER 🏆</div>
                ) : p.health <= 0 ? (
                  <div className="tokyo-badge" style={{ background: 'var(--danger)', color: 'white', borderColor: '#7f1d1d', boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)' }}>DEAD</div>
                ) : p.inTokyo ? (
                  <div className="tokyo-badge">IN TOKYO</div>
                ) : null}

              </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedCard && (
        <div className="modal-overlay" onClick={() => setSelectedCard(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card-item glass-panel" style={{ width: '300px', cursor: 'default' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{selectedCard.name}</h3>
            <div style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '16px', fontSize: '14px' }}><em>{selectedCard.type}</em></div>
            <p style={{ fontSize: '16px', lineHeight: '1.4' }}>{selectedCard.description}</p>
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="stat energy" style={{ fontSize: '18px' }}>Cost: {selectedCard.cost} ⚡</span>
              <button className="btn secondary" onClick={() => setSelectedCard(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {playerId && gameState.pendingYields?.includes(playerId) && (
        <div style={{ position: 'fixed', top: '100px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, pointerEvents: 'none' }}>
          <div className="glass-panel" style={{ textAlign: 'center', padding: '24px', pointerEvents: 'auto', border: '2px solid var(--warning)', boxShadow: '0 0 30px rgba(234, 179, 8, 0.4)' }}>
            <h2 style={{ color: 'var(--warning)', marginTop: 0 }}>You took damage in Tokyo!</h2>
            <p style={{ fontSize: '18px', marginBottom: '24px' }}>Do you want to yield Tokyo to your attacker?</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button className="btn primary flash" onClick={() => yieldTokyo(gameState.id, true)}>Yield</button>
              <button className="btn secondary flash" onClick={() => yieldTokyo(gameState.id, false)}>Stay</button>
            </div>
          </div>
        </div>
      )}

      {showHelp && (
        <div className="modal-overlay" onClick={() => setShowHelp(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ width: '400px', cursor: 'default', padding: '24px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>How to Play</h2>
            <ul style={{ paddingLeft: '20px', lineHeight: '1.5' }}>
              <li><strong>Objective:</strong> Be the first to 20 Victory Points (⭐) or be the last monster standing!</li>
              <li><strong>Turn:</strong> Roll the dice up to 3 times. Keep or reroll any dice.</li>
              <li><strong>Dice:</strong> 
                <br/>1️⃣, 2️⃣, 3️⃣: Three of a kind gives that many VP. Extra gives +1 VP.
                <br/>❤️: Heal 1 damage (not in Tokyo).
                <br/>⚡: Gain 1 Energy to buy cards.
                <br/>💥: Deal 1 damage. If in Tokyo, damage all others. If outside, damage monster in Tokyo.
              </li>
              <li><strong>Tokyo:</strong> Start turn there = +2 VP. Enter there = +1 VP.</li>
              <li><strong>Yielding:</strong> When attacked in Tokyo, you can yield. The attacker then takes your place.</li>
            </ul>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <a href="https://en.wikipedia.org/wiki/King_of_Tokyo#Gameplay" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>📖 Read full official rules</a>
              <a href="mailto:feedback@example.com" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>✉️ Send feedback</a>
            </div>
            <div style={{ marginTop: '32px', textAlign: 'right' }}>
              <button className="btn primary" onClick={() => setShowHelp(false)}>Got it!</button>
            </div>
          </div>
        </div>
      )}


      

      {showStats && gameState.status === "GameOver" && (
        <GameOverScreen 
          gameState={gameState} 
          onLobbyReturn={() => returnToLobby(gameState.id)} 
          onClose={() => setShowStats(false)} 
        />
      )}

      {showAllLogs && (
        <div className="modal-overlay" onClick={() => setShowAllLogs(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ width: '500px', height: '600px', cursor: 'default', padding: '24px', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0 }}>Full Game Log</h2>
              <button className="btn secondary" onClick={() => setShowAllLogs(false)}>Close</button>
            </div>
            <div className="log-entries" style={{ flex: 1, overflowY: 'auto', fontSize: '14px', lineHeight: '1.4', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {gameState.logs.slice().reverse().map((log, i) => {
                const isTurnEnd = log.startsWith('Turn ended.');
                return (
                  <div key={i} style={{ 
                    padding: '8px', 
                    background: isTurnEnd ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)', 
                    borderRadius: '6px', 
                    fontWeight: isTurnEnd ? 'bold' : 'normal',
                    borderTop: isTurnEnd ? '2px solid rgba(255,255,255,0.4)' : 'none',
                    borderBottom: isTurnEnd ? '2px solid rgba(255,255,255,0.4)' : 'none',
                    marginTop: isTurnEnd ? '4px' : '0',
                    marginBottom: isTurnEnd ? '4px' : '0'
                  }}>
                    {log}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
