import { useState, useRef, useEffect } from 'react';
import { useSocket } from './FirebaseContext';
import { db } from './engine/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import type { Card } from '@king-of-tokyo/shared';
import { marketCards } from '@king-of-tokyo/shared';
import { getCardCost } from './engine/gameEngine';
import './App.css';
import { GameOverScreen } from './GameOverScreen';

const PlayerStat = ({ value, max, icon, isHighlighted, className }: any) => {
  const prev = useRef(value);
  const dir = useRef('up');
  
  if (value !== prev.current) {
    dir.current = value > prev.current ? 'up' : 'down';
    prev.current = value;
  }
  
  const highlightClass = isHighlighted ? (dir.current === 'down' ? 'flash-down' : 'flash-up') : '';
  return <span className={`stat ${className} ${highlightClass}`} style={className === 'health' ? { display: 'inline-block', minWidth: '75px' } : undefined}>{icon === '⚡' ? <span className="energy-icon">⚡</span> : icon} {value}{max ? ` / ${max}` : ''}</span>;
};

const renderLogLine = (log: string, i: number, gameState: any, setSelectedCard: any) => {
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
      fontWeight: isTurnEnd ? 'bold' : 'normal',
      marginTop: isTurnEnd ? '4px' : '0',
      marginBottom: isTurnEnd ? '4px' : '0'
    }}>
      {(() => {
        const players = Object.values(gameState.players);
        const sortedPlayers = [...players].sort((a: any, b: any) => b.name.length - a.name.length);
        const sortedCards = [...marketCards].sort((a: any, b: any) => b.name.length - a.name.length);
        
        const renderText = (logText: string, logIndex: number): any[] => {
          if (!logText) return [];
          let elements: any[] = [logText];

          const symbols = ['⚡', '1️⃣', '2️⃣', '3️⃣'];
          for (const sym of symbols) {
            elements = elements.flatMap((el, idx1) => {
              if (typeof el !== 'string') return [el];
              const parts = el.split(sym);
              return parts.flatMap((p, idx2) => {
                const res: any[] = [p];
                if (idx2 < parts.length - 1) {
                  const key = `${logIndex}-${sym}-${idx1}-${idx2}`;
                  if (sym === '⚡') {
                    res.push(<span key={key} className="energy-icon">⚡</span>);
                  } else {
                    res.push(<span key={key} className="dice-number" style={{ color: '#00ff88' }}>{sym[0]}</span>);
                  }
                }
                return res;
              });
            });
          }

          // Handle Players
          for (const p of sortedPlayers as any[]) {
            if (p.name) {
              const regex = new RegExp(`(${p.name})`, 'g');
              elements = elements.flatMap((el, idx1) => {
                if (typeof el !== 'string') return [el];
                return el.split(regex).map((part, idx2) => {
                  if (part === p.name) return <span key={`${logIndex}-p-${p.id}-${idx1}-${idx2}`} style={{ color: p.color || 'white', fontWeight: 'bold' }}>{p.name}</span>;
                  return part;
                });
              });
            }
          }
          
          // Handle Cards
          for (const c of sortedCards as any[]) {
            if (c.name) {
              const regex = new RegExp(`(${c.name})`, 'g');
              elements = elements.flatMap((el, idx1) => {
                if (typeof el !== 'string') return [el];
                return el.split(regex).map((part, idx2) => {
                  if (part === c.name) {
                    return (
                      <span 
                        key={`${logIndex}-c-${c.id}-${idx1}-${idx2}`}
                        onClick={() => setSelectedCard(c)} 
                        style={{ cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline', fontWeight: 'bold' }}
                      >
                        {c.name}
                      </span>
                    );
                  }
                  return part;
                });
              });
            }
          }
          return elements;
        };
        return renderText(log, i);
      })()}
    </div>
  );
};

function App() {
  const { connected, gameState, playerId, createGame, joinGame, quitGame, returnToLobby, addBot, startGame, rollDice, keepDice, resolveDice, answerPrompt, yieldTokyo, buyCard, sweepCards, endTurn, sendChat } = useSocket();
  const [username, setUsername] = useState(localStorage.getItem('kot_username') || '');
  const [gameIdInput, setGameIdInput] = useState(() => {
    return new URLSearchParams(window.location.search).get('game') || '';
  });
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [localSettings, setLocalSettings] = useState<{ maxHealth: number, startingHealth: number, startingEnergy: number, winningVP: number, startingDice: number, copiesPerCard: number, excludedCards: string[] }>({ maxHealth: 10, startingHealth: 10, startingEnergy: 0, winningVP: 20, startingDice: 6, copiesPerCard: 1, excludedCards: [] });
  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);
  

  useEffect(() => {
    let timerId: any;
    if (gameState?.status === "GameOver") {
      timerId = setTimeout(() => {
        setShowStats(true);
      }, 5000);
    } else {
      setShowStats(false);
    }
    return () => clearTimeout(timerId);
  }, [gameState?.status]);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [showFullChat, setShowFullChat] = useState(false);
  const [chatText, setChatText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const initialPlayerIdRef = useRef<string | null>(localStorage.getItem('kot_playerId') || null);
  const [pendingGames, setPendingGames] = useState<{id: string, players: number}[]>([]);

  useEffect(() => {
    if (!gameState) {
      const q = query(collection(db, 'games'), where('status', '==', 'Lobby'));
      const unsub = onSnapshot(q, (snapshot) => {
        const games: any[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          games.push({ id: doc.id, players: Object.keys(data.players || {}).length });
        });
        setPendingGames(games);
      });
      return () => unsub();
    }
  }, [gameState]);

  useEffect(() => {
    if (gameState?.id) {
      window.history.replaceState(null, '', `?game=${gameState.id}`);
    }
  }, [gameState?.id]);

  useEffect(() => {
    import('firebase/firestore').then(({ doc, onSnapshot }) => {
      const unsub = onSnapshot(doc(db, 'settings', 'version'), (docSnap) => {
        const APP_VERSION = 7; // Increment this to force all clients to reload
        if (docSnap.exists() && docSnap.data().value > APP_VERSION) {
          window.location.reload();
        }
      });
      return () => unsub();
    });
  }, []);

  useEffect(() => {
    if (connected && playerId) {
      const urlParams = new URLSearchParams(window.location.search);
      const gameParam = urlParams.get('game');
      if (gameParam && !gameState) {
        joinGame(gameParam, username, playerId);
      }
    }
  }, [connected, playerId]); // Re-join the room anytime we reconnect or initialize playerId

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
        {pendingGames.length > 0 && (
          <div className="lobby-card glass-panel" style={{ marginTop: '20px' }}>
            <h3 style={{ margin: '0 0 10px 0', textAlign: 'center' }}>Pending Games</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pendingGames.map(pg => (
                <div key={pg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '4px' }}>
                  <span>{pg.id} ({pg.players} players)</span>
                  <button onClick={() => { setGameIdInput(pg.id); joinGame(pg.id, username); }} disabled={!username} className="btn secondary" style={{ padding: '4px 12px', fontSize: '12px' }}>Join</button>
                </div>
              ))}
            </div>
          </div>
        )}
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
            <button onClick={() => startGame(gameState.id, localSettings)} className="btn primary">Start Game</button>
          </div>
        )}
        {gameState.status === "GameOver" && (
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setShowStats(true)} className="btn primary">View Stats</button>
            <button onClick={() => returnToLobby(gameState.id)} className="btn primary">Rematch (Keep Players)</button>
            <button onClick={() => window.location.href = '/'} className="btn danger">New Game</button>
            <button onClick={() => quitGame(gameState.id)} className="btn secondary">Back to Lobby</button>
          </div>
        )}
        <div style={{ display: "flex", gap: "8px", marginLeft: "16px" }}>
          <button onClick={() => setShowHelp(true)} className="btn secondary">Help</button>
          {gameState.status !== 'Lobby' && <button onClick={() => setShowSettings(true)} className="btn secondary">Options</button>}
          {gameState.status !== 'GameOver' && <button onClick={() => quitGame(gameState.id)} className="btn danger">Leave Game</button>}
        </div>
      </header>

      <div className="board-layout">
        <div className="left-column" style={{ gap: '8px' }}>
          {gameState.status === 'Lobby' && (
            <div className="glass-panel" style={{ padding: '16px', color: 'white', width: 'fit-content' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>Game Settings</h3>
                <button 
                  className="btn outline sm"
                  onClick={() => setLocalSettings({ maxHealth: 10, startingHealth: 10, startingEnergy: 0, winningVP: 20, startingDice: 6, copiesPerCard: 1, excludedCards: [] })}
                >
                  Restore defaults
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 60px', gap: '12px 16px', alignItems: 'center' }}>
                <label style={{ display: 'contents' }}>
                  <span>Starting Dice:</span>
                  <input type="number" min="1" max="10" value={localSettings.startingDice || 6} onChange={e => setLocalSettings(s => ({...s, startingDice: parseInt(e.target.value)||6}))} style={{ width: '60px', padding: '4px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid #555' }} />
                </label>
                <label style={{ display: 'contents' }}>
                  <span>Starting Health:</span>
                  <input type="number" min="1" max="20" value={localSettings.startingHealth} onChange={e => setLocalSettings(s => ({...s, startingHealth: parseInt(e.target.value)||10}))} style={{ width: '60px', padding: '4px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid #555' }} />
                </label>
                <label style={{ display: 'contents' }}>
                  <span>Starting Energy:</span>
                  <input type="number" min="0" max="99" value={localSettings.startingEnergy} onChange={e => setLocalSettings(s => ({...s, startingEnergy: parseInt(e.target.value)||0}))} style={{ width: '60px', padding: '4px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid #555' }} />
                </label>
                <label style={{ display: 'contents' }}>
                  <span>Max Health:</span>
                  <input type="number" min="1" max="30" value={localSettings.maxHealth} onChange={e => setLocalSettings(s => ({...s, maxHealth: parseInt(e.target.value)||10}))} style={{ width: '60px', padding: '4px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid #555' }} />
                </label>
                <label style={{ display: 'contents' }}>
                  <span>Winning VP:</span>
                  <input type="number" min="1" max="50" value={localSettings.winningVP} onChange={e => setLocalSettings(s => ({...s, winningVP: parseInt(e.target.value)||20}))} style={{ width: '60px', padding: '4px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid #555' }} />
                </label>
                <label style={{ display: 'contents' }}>
                  <span>Copies per Card:</span>
                  <input type="number" min="1" max="99" value={localSettings.copiesPerCard} onChange={e => setLocalSettings(s => ({...s, copiesPerCard: parseInt(e.target.value)||1}))} style={{ width: '60px', padding: '4px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid #555' }} />
                </label>
              </div>
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>Include Cards:</span>
                  <div>
                    <button onClick={() => setLocalSettings(s => ({ ...s, excludedCards: [] }))} className="btn secondary" style={{ padding: '2px 8px', fontSize: '11px', marginRight: '4px' }}>All</button>
                    <button onClick={() => setLocalSettings(s => ({ ...s, excludedCards: marketCards.map(c => c.id) }))} className="btn secondary" style={{ padding: '2px 8px', fontSize: '11px' }}>None</button>
                  </div>
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '8px', border: '1px solid #555', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {[...marketCards].sort((a, b) => a.name.localeCompare(b.name)).map(card => (
                    <label key={card.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                      <input 
                        type="checkbox" 
                        checked={!localSettings.excludedCards.includes(card.id)}
                        onChange={e => {
                          const isChecked = e.target.checked;
                          setLocalSettings(s => ({
                            ...s,
                            excludedCards: isChecked 
                              ? s.excludedCards.filter(id => id !== card.id)
                              : [...s.excludedCards, card.id]
                          }));
                        }}
                      />
                      <span>{card.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
          {(gameState.status === 'Playing' || gameState.status === 'GameOver') && (
            <>
              <div className="market-board glass-panel" style={{ padding: '8px' }}>
                <div className="cards-list" style={{ display: 'flex', gap: '8px', overflowX: 'auto', overflowY: 'hidden', alignItems: 'flex-start' }}>
                  {gameState.marketCards.map(card => {
                    const myEnergy = gameState.players[playerId!]?.energy || 0;
                    const isMyTurn = gameState.currentTurnPlayerId === playerId;
                    const discountedCost = playerId ? getCardCost(gameState as any, playerId, card.cost) : card.cost;
                    const canBuy = isMyTurn && myEnergy >= discountedCost && !gameState.isAnimating;
                    return (
                      <div key={card.id} className="card-item glass-panel" style={{ width: '160px', height: '180px', flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '8px', cursor: 'pointer' }} onClick={() => setSelectedCard(card)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <strong style={{ fontSize: '13px', lineHeight: '1.2' }}>{card.name}</strong>
                          <span className="stat energy" style={{ fontSize: '13px', padding: '2px 6px' }}>
                            {discountedCost < card.cost ? (
                              <><span style={{ textDecoration: 'line-through', opacity: 0.6, marginRight: '4px' }}>{card.cost}</span>{discountedCost} <span className="energy-icon">⚡</span></>
                            ) : (
                              <>{card.cost} <span className="energy-icon">⚡</span></>
                            )}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', flex: 1, marginBottom: '8px', color: 'rgba(255,255,255,0.7)' }}>
                          <em>{card.type}</em><br/>
                          {card.description}
                        </div>
                        <button 
                          className="btn primary"
                          disabled={!canBuy || gameState.status === 'GameOver'}
                          onClick={(e) => { e.stopPropagation(); buyCard(gameState.id, card.id); }}
                          style={{ width: '100%', padding: '6px' }}
                        >
                          Buy for {discountedCost} <span className="energy-icon">⚡</span>
                        </button>
                      </div>
                    );
                  })}
                  
                  
                  {gameState.currentTurnPlayerId === playerId && gameState.rollsLeft === 0 && !gameState.isAnimating && (
                    <div style={{ padding: '8px', display: gameState.status === 'GameOver' ? 'none' : 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
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
                        className="btn warning"
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
                                const faceIcons: Record<string, any> = {
                                  '1': <span className="dice-number" style={{ color: '#00ff88' }}>1</span>,
                                  '2': <span className="dice-number" style={{ color: '#00ff88' }}>2</span>,
                                  '3': <span className="dice-number" style={{ color: '#00ff88' }}>3</span>,
                                  'Heart': '❤️',
                                  'Lightning': <span className="energy-icon">⚡</span>,
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
                  <div style={{ display: gameState.status === 'GameOver' ? 'none' : 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-start' }}>
                    {gameState.currentTurnPlayerId === playerId && gameState.status === 'Playing' ? (
                      (() => {
                        return (
                          <>
                            {gameState.rollsLeft === 3 && (
                              <button onClick={() => rollDice(gameState.id)} className="btn primary" style={{ animationDelay: `-${Date.now() % 1500}ms` }} disabled={gameState.isAnimating}>
                                Roll Dice
                              </button>
                            )}
                            
                            {(gameState.rollsLeft > 0 && gameState.rollsLeft < 3) ? (
                              <>
                                <button onClick={() => rollDice(gameState.id)} className="btn primary" style={{ animationDelay: `-${Date.now() % 1500}ms` }} disabled={gameState.isAnimating}>
                                  Reroll ({gameState.rollsLeft} left)
                                </button>
                                <button onClick={() => resolveDice(gameState.id)} className="btn warning" disabled={gameState.isAnimating}>
                                  Done
                                </button>
                              </>
                            ) : null}
                          </>
                        );
                      })()
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
                      let myMatches = 0;
                      let totalTurns = 0;
                      const targetMyMatches = gameState.currentTurnPlayerId === playerId ? 2 : 1;
                      
                      let lastTurnIdx = -1;
                      let fifthTurnIdx = -1;

                      for (let i = 0; i < logs.length; i++) {
                        const l = logs[i];
                        if (l.startsWith('TURN_START:') || l === 'Game started!') {
                          totalTurns++;
                          if (totalTurns === 6 && fifthTurnIdx === -1) {
                            fifthTurnIdx = i; // Include the 5th turn start completely
                          }
                          if ((l === `TURN_START:${myName}` || l === 'Game started!') && lastTurnIdx === -1) {
                            myMatches++;
                            if (myMatches === targetMyMatches) {
                              lastTurnIdx = i;
                            }
                          }
                        }
                      }
                      
                      if (fifthTurnIdx === -1) fifthTurnIdx = logs.length - 1;
                      if (lastTurnIdx === -1) lastTurnIdx = logs.length - 1;
                      
                      const maxIdx = Math.max(lastTurnIdx, fifthTurnIdx);
                      const recentLogs = logs.slice(0, maxIdx + 1);
                      
                      return recentLogs.map((log, i) => renderLogLine(log, i, gameState, setSelectedCard));
                    })()}
                  </div>
                </div>

                <div className="chat-panel glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '12px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '14px' }}>Chat</h3>
                    <button onClick={() => setShowFullChat(true)} className="btn secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>View All</button>
                  </div>
                  <div className="chat-messages" style={{ flex: 1, overflowY: 'hidden', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                    {(() => {
                        const msgs = (gameState as any).chatMessages || [];
                        const recent = msgs.slice(Math.max(msgs.length - 8, 0));
                        return recent.map((msg: any, i: number) => (
                          <div key={i} style={{ background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '6px' }}>
                            {(() => {
                              const senderPlayer = Object.values(gameState.players).find(p => p.name === msg.sender);
                              const color = senderPlayer?.color || 'var(--primary)';
                              return <><strong style={{ color }}>{msg.sender}:</strong> {msg.text}</>;
                            })()}
                          </div>
                        ));
                    })()}
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
              <div key={p.id} className={`player-card glass-panel ${p.id === gameState.currentTurnPlayerId ? 'active-turn' : ''} ${isMePlayer ? 'is-me' : ''} ${p.inTokyo ? 'in-tokyo' : ''} ${p.id === gameState.winner ? 'winner-card' : ''} ${p.health <= 0 ? 'player-dead' : ''}`} style={{ marginBottom: '8px' }}>
                <div className="player-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    {p.isBot && <span style={{ marginRight: '4px' }}>🤖</span>}
                    <strong style={{ color: p.color || 'white' }}>{p.name}</strong> 
                    {p.poisonTokens > 0 && <span title="Click for info" onClick={() => setSelectedCard({ id: 't1', name: 'Poison Token', description: 'Take 1 damage at the end of your turn for each Poison token you have. You can heal poison instead of health using ❤️.', type: 'Keep', cost: 0, effect: {} })} className="token-icon" style={{ cursor: 'pointer', marginLeft: '6px', color: '#ff4444', fontWeight: 'bold', display: 'inline-block', animation: 'poison-pop 0.3s ease-out' }} key={'p'+p.poisonTokens}>{Array(p.poisonTokens).fill('☠️').join('')}</span>}
                    {(p.shrinkTokens || 0) > 0 && (
                      <span title="Click for info" onClick={() => setSelectedCard({ id: 't2', name: 'Shrink Token', description: 'Roll one less die for each Shrink token you have. You can discard a Shrink token instead of healing health using ❤️.', type: 'Keep', cost: 0, effect: {} })} className="token-icon" style={{ cursor: 'pointer', marginLeft: '6px', display: 'inline-flex', gap: '2px', animation: gameState.currentTurnPlayerId === p.id && gameState.rollsLeft > 0 ? 'shake 0.5s infinite' : 'none' }} key={'s'+p.shrinkTokens}>
                        {Array(p.shrinkTokens).fill(0).map((_, idx) => (
                          <span key={idx} style={{ position: 'relative', display: 'inline-block', width: '20px', height: '20px', fontSize: '16px' }}>
                            <span style={{ position: 'absolute', top: 0, left: 0 }}>🎲</span>
                            <span style={{ position: 'absolute', top: '-3px', left: '-3px', fontSize: '18px', color: 'red', textShadow: '0 0 2px black' }}>🚫</span>
                          </span>
                        ))}
                      </span>
                    )}
                    {gameState.status === 'Lobby' && p.isBot && (
                      <button 
                        onClick={() => quitGame(gameState.id, p.id)}
                        style={{ marginLeft: '8px', padding: '2px 8px', background: 'var(--danger)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                        title="Remove Bot"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <div className="player-stats" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  <PlayerStat className="health" icon="❤️" value={Math.max(0, p.health)} max={p.maxHealth || 10} isHighlighted={gameState.highlightedStats?.some(s => s.playerId === p.id && s.stat === 'health')} />
                  <PlayerStat className="vp" icon="⭐" value={p.victoryPoints} isHighlighted={gameState.highlightedStats?.some(s => s.playerId === p.id && s.stat === 'vp')} />
                  <PlayerStat className="energy" icon="⚡" value={p.energy} isHighlighted={gameState.highlightedStats?.some(s => s.playerId === p.id && s.stat === 'energy')} />
                </div>
                {p.cards && p.cards.length > 0 && (
                  <div className="player-cards" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                    {p.cards.map(c => (
                      <div key={c.id} onClick={() => setSelectedCard(c)} className={`player-card-item ${gameState.highlightedStats?.some(s => s.playerId === p.id && s.stat === `card:${c.id}`) ? 'flash-card' : ''}`}>
                        {c.name}
                      </div>
                    ))}
                  </div>
                )}
                
                <div style={{ position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                  {p.id === gameState.currentTurnPlayerId && p.health > 0 && gameState.status !== 'GameOver' && (
                    <div style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', color: 'black', background: 'var(--primary)', padding: '4px 12px', borderRadius: '4px', fontWeight: '900', letterSpacing: '1px', border: '1px solid rgba(255, 255, 255, 0.5)', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', textShadow: '0 1px 2px rgba(255,255,255,0.5)', animation: 'playing-pulse 2s infinite' }}>
                      PLAYING ◀️
                    </div>
                  )}
                  {p.id === gameState.winner ? (
                    <div className="tokyo-badge" style={{ background: '#fbbf24', color: '#78350f', borderColor: '#f59e0b', boxShadow: '0 0 20px rgba(251, 191, 36, 0.8)', animation: 'pulse-glow 1.5s infinite' }}>WINNER 🏆</div>
                  ) : p.health <= 0 ? (
                    <div className="tokyo-badge" style={{ background: 'var(--danger)', color: 'white', borderColor: '#7f1d1d', boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)' }}>DEAD</div>
                  ) : p.inTokyo ? (
                    <div className="tokyo-badge">
                      {p.inTokyoBay ? 'IN TOKYO BAY' : 'IN TOKYO CITY'}
                    </div>
                  ) : null}
                </div>

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
              <span className="stat energy" style={{ fontSize: '18px' }}>
                Cost:{' '}
                {playerId && getCardCost(gameState as any, playerId, selectedCard.cost) < selectedCard.cost ? (
                  <><span style={{ textDecoration: 'line-through', opacity: 0.6, marginRight: '4px' }}>{selectedCard.cost}</span>{getCardCost(gameState as any, playerId, selectedCard.cost)} <span className="energy-icon">⚡</span></>
                ) : (
                  <>{selectedCard.cost} <span className="energy-icon">⚡</span></>
                )}
              </span>
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
              <button className="btn primary" style={{ animationDelay: `-${Date.now() % 1500}ms` }} onClick={() => yieldTokyo(gameState.id, true)}>Yield</button>
              <button className="btn secondary" onClick={() => yieldTokyo(gameState.id, false)}>Stay</button>
            </div>
          </div>
        </div>
      )}

      {playerId && gameState.pendingPrompts?.some(p => p.playerId === playerId) && (
        <div style={{ position: 'fixed', top: '100px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, pointerEvents: 'none' }}>
          <div className="glass-panel" style={{ textAlign: 'center', padding: '24px', pointerEvents: 'auto', border: '2px solid var(--primary)', boxShadow: '0 0 30px rgba(139, 92, 246, 0.4)' }}>
            <h2 style={{ color: 'var(--primary)', marginTop: 0 }}>Decision Required!</h2>
            <p style={{ fontSize: '18px', marginBottom: '24px' }}>
              {gameState.pendingPrompts.find(p => p.playerId === playerId)?.question}
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              {gameState.pendingPrompts.find(p => p.playerId === playerId)?.options.map(opt => (
                <button 
                  key={opt.value} 
                  className={`btn ${opt.buttonClass || 'primary'}`} 
                  onClick={() => answerPrompt(gameState.id, gameState.pendingPrompts!.find(p => p.playerId === playerId)!.promptId, opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}



      {showSettings && gameState.status !== 'Lobby' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="glass-panel" style={{ position: 'relative', padding: '32px', maxWidth: '400px', width: '100%', color: 'white', textAlign: 'center' }}>
            <button onClick={() => setShowSettings(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>✕</button>
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>Game Options</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Starting Dice:</span>
                <strong>{gameState.settings?.startingDice || 6}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Starting Health:</span>
                <strong>{gameState.settings?.startingHealth || 10}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Starting Energy:</span>
                <strong>{gameState.settings?.startingEnergy || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Max Health:</span>
                <strong>{gameState.settings?.maxHealth || 10}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Winning VP:</span>
                <strong>{gameState.settings?.winningVP || 20}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Copies per Card:</span>
                <strong>{gameState.settings?.copiesPerCard || 1}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Excluded Cards:</span>
                <strong>{gameState.settings?.excludedCards?.length || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Deck Size:</span>
                <strong>{gameState.deckCount + gameState.marketCards.length}</strong>
              </div>
            </div>
            <button className="btn primary" onClick={() => setShowSettings(false)} style={{ marginTop: '24px', width: '100%' }}>Close</button>
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
                <br/><span className="dice-number" style={{ color: '#00ff88' }}>1</span>, <span className="dice-number" style={{ color: '#00ff88' }}>2</span>, <span className="dice-number" style={{ color: '#00ff88' }}>3</span>: Three of a kind gives that many VP. Extra gives +1 VP.
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
      
      {showFullChat && (
        <div className="modal-overlay" onClick={() => setShowFullChat(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" onClick={e => e.stopPropagation()} style={{ width: '500px', height: '600px', cursor: 'default', padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0 }}>Full Chat</h2>
              <button className="btn secondary" onClick={() => setShowFullChat(false)} style={{ padding: '4px 8px', fontSize: '12px' }}>Close</button>
            </div>
            <div className="log-messages full-log" style={{ overflowY: 'auto', flex: 1, paddingRight: '10px' }}>
              {((gameState as any).chatMessages || []).map((msg: any, i: number) => {
                  const senderPlayer = Object.values(gameState.players).find(p => p.name === msg.sender);
                  const color = senderPlayer?.color || 'var(--primary)';
                  return (
                    <div key={i} style={{ background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '6px', marginBottom: '6px' }}>
                      <strong style={{ color }}>{msg.sender}:</strong> {msg.text}
                    </div>
                  );
              })}
              <div ref={chatBottomRef} />
            </div>
          </div>
        </div>
      )}


      

      {showStats && gameState.status === "GameOver" && (
        <GameOverScreen 
          gameState={gameState} 
           
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
              {gameState.logs.slice().reverse().map((log, i) => renderLogLine(log, i, gameState, setSelectedCard))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
