import React from 'react';
import type { KotState, KotAction } from '../engine/reducer';
import { GameLayout, useGameContext } from '@erez/boardgame-core';
import { KotStats } from './KotStats';

const styles = `
  @keyframes dice-roll {
    0% { transform: rotate(0deg) scale(1); }
    50% { transform: rotate(180deg) scale(1.2); }
    100% { transform: rotate(360deg) scale(1); }
  }
  .dice-rolling {
    animation: dice-roll 0.5s ease-in-out;
  }
  @keyframes pulse-green {
    0% { transform: scale(1); color: #4ade80; }
    50% { transform: scale(2.5); color: #4ade80; }
    100% { transform: scale(1); color: inherit; }
  }
  @keyframes pulse-red {
    0% { transform: scale(1); color: #ef4444; }
    50% { transform: scale(2.5); color: #ef4444; }
    100% { transform: scale(1); color: inherit; }
  }
  .pulse-green { animation: pulse-green 1.5s ease-out; }
  .pulse-red { animation: pulse-red 1.5s ease-out; }
`;

const LightningIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" style={{ verticalAlign: 'middle' }}>
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const AnimatedCounter = ({ value, icon, color, suffix, width }: { value: number, icon: React.ReactNode, color: string, suffix?: string, width?: string }) => {
  const prevValue = React.useRef(value);
  const [animClass, setAnimClass] = React.useState('');

  React.useEffect(() => {
    if (value > prevValue.current) {
      setAnimClass('pulse-green');
      const timer = setTimeout(() => setAnimClass(''), 1500);
      prevValue.current = value;
      return () => clearTimeout(timer);
    } else if (value < prevValue.current) {
      setAnimClass('pulse-red');
      const timer = setTimeout(() => setAnimClass(''), 1500);
      prevValue.current = value;
      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <div style={{ color, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', width, minWidth: width }}>
      <span>{icon}</span>
      <span className={animClass} style={{ display: 'inline-block', transition: 'all 0.3s', fontFamily: width ? 'monospace' : 'inherit' }}>
        {value}{suffix}
      </span>
    </div>
  );
};

import { CARD_REGISTRY, ALL_CARD_IDS } from '../engine/cards/registry';
import { dispatchEvent } from '../engine/reducer';

const renderSettings = (settings: any, dispatch: any, status: string) => {
  const currentSettings = {
    maxHealth: settings?.maxHealth || 10,
    maxVp: settings?.maxVp || 20,
    cardsPerType: settings?.cardsPerType || 1,
    activeCards: settings?.activeCards || ['acid_attack', 'alien_metabolism', 'alpha_monster']
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <div style={{ margin: '10px 20px' }}>
        <label style={{ fontSize: '18px', marginRight: '10px' }}>Max/Initial Health:</label>
        <input 
          type="number" 
          value={currentSettings.maxHealth} 
          onChange={e => dispatch({ type: 'UPDATE_SETTINGS', payload: { ...currentSettings, maxHealth: parseInt(e.target.value) || 10 } })}
          disabled={status !== 'Lobby'}
          className="modern-input"
          style={{ width: '100px', display: 'inline-block' }}
        />
      </div>
      <div style={{ margin: '10px 20px' }}>
        <label style={{ fontSize: '18px', marginRight: '10px' }}>VPs to Win:</label>
        <input 
          type="number" 
          value={currentSettings.maxVp} 
          onChange={e => dispatch({ type: 'UPDATE_SETTINGS', payload: { ...currentSettings, maxVp: parseInt(e.target.value) || 20 } })}
          disabled={status !== 'Lobby'}
          className="modern-input"
          style={{ width: '100px', display: 'inline-block' }}
        />
      </div>

      <div style={{ margin: '20px auto', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '20px', maxWidth: '400px' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Deck Configuration</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
          <label style={{ fontSize: '16px', marginRight: '10px' }}>Copies per Card:</label>
          <input 
            type="number" 
            value={currentSettings.cardsPerType} 
            onChange={e => dispatch({ type: 'UPDATE_SETTINGS', payload: { ...currentSettings, cardsPerType: parseInt(e.target.value) || 1 } })}
            disabled={status !== 'Lobby'}
            className="modern-input"
            style={{ width: '60px', display: 'inline-block' }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
          <button 
            disabled={status !== 'Lobby'} 
            onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { ...currentSettings, activeCards: ALL_CARD_IDS } })}
            style={{ padding: '4px 8px', fontSize: '12px', background: 'transparent', color: '#60a5fa', border: '1px solid #60a5fa', borderRadius: '4px', cursor: status === 'Lobby' ? 'pointer' : 'default', opacity: status === 'Lobby' ? 1 : 0.5 }}
          >
            Select All
          </button>
          <button 
            disabled={status !== 'Lobby'} 
            onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { ...currentSettings, activeCards: [] } })}
            style={{ padding: '4px 8px', fontSize: '12px', background: 'transparent', color: '#60a5fa', border: '1px solid #60a5fa', borderRadius: '4px', cursor: status === 'Lobby' ? 'pointer' : 'default', opacity: status === 'Lobby' ? 1 : 0.5 }}
          >
            Select None
          </button>
        </div>
        <div style={{ maxHeight: '200px', overflowY: 'auto', textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', display: 'inline-block', width: '100%' }}>
          {ALL_CARD_IDS.map(id => {
            const isActive = currentSettings.activeCards.includes(id);
            return (
              <div key={id} style={{ padding: '4px 0' }}>
                <label style={{ cursor: status === 'Lobby' ? 'pointer' : 'default', opacity: status === 'Lobby' ? 1 : 0.5 }}>
                  <input 
                    type="checkbox" 
                    checked={!!isActive} 
                    disabled={status !== 'Lobby'}
                    onChange={(e) => {
                      const newActive = e.target.checked 
                        ? [...currentSettings.activeCards, id]
                        : currentSettings.activeCards.filter((c: string) => c !== id);
                      dispatch({ type: 'UPDATE_SETTINGS', payload: { ...currentSettings, activeCards: newActive } });
                    }}
                    style={{ marginRight: '8px' }}
                  />
                  {CARD_REGISTRY[id].name} <span style={{ color: 'gray', fontSize: '12px' }}>({CARD_REGISTRY[id].cost}⚡)</span>
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {status === 'Lobby' && <p style={{ color: 'gray' }}>Waiting for the host to start the game...</p>}
      {status !== 'Lobby' && <p style={{ color: 'gray', fontSize: '12px' }}>Settings can only be changed in the Lobby.</p>}
    </div>
  );
};

export const KotBoard: React.FC = () => {
  const { gameState, myPlayerId, dispatch } = useGameContext<KotState, KotAction>();
  const { status, players, dice, rollCount, prompt, playerOrder, currentPlayerIndex, settings } = gameState;

  const [keptDiceIds, setKeptDiceIds] = React.useState<string[]>([]);
  const isMyTurn = playerOrder[currentPlayerIndex] === myPlayerId;

  const [highlightedCards, setHighlightedCards] = React.useState<string[]>([]);
  const prevLogsLength = React.useRef(gameState.logs?.length || 0);

  React.useEffect(() => {
    if (gameState.logs && gameState.logs.length > prevLogsLength.current) {
      const newLogs = gameState.logs.slice(prevLogsLength.current);
      const highlighted: string[] = [];
      newLogs.forEach(log => {
        ALL_CARD_IDS.forEach(cId => {
          if (log.includes(CARD_REGISTRY[cId].name)) {
            highlighted.push(cId);
          }
        });
      });
      if (highlighted.length > 0) {
        setHighlightedCards(highlighted);
        setTimeout(() => setHighlightedCards([]), 2000);
      }
      prevLogsLength.current = gameState.logs.length;
    }
  }, [gameState.logs?.length]);

  // Clear local kept dice when turn ends/begins
  React.useEffect(() => {
    if (rollCount === 0) {
      setKeptDiceIds([]);
    }
  }, [rollCount]);

  const handleRoll = () => {
    if (!isMyTurn || status !== 'Playing' || prompt) return;
    dispatch({ type: 'ROLL_DICE', payload: { playerId: myPlayerId, keptDiceIds } });
  };

  const handleResolve = () => {
    if (!isMyTurn || status !== 'Playing' || rollCount === 0 || prompt) return;
    dispatch({ type: 'RESOLVE_DICE', payload: { playerId: myPlayerId } });
  };

  const toggleKeep = (diceId: string) => {
    if (!isMyTurn || status !== 'Playing' || rollCount === 0 || rollCount >= 3 || prompt) return;
    setKeptDiceIds(prev => prev.includes(diceId) ? prev.filter(id => id !== diceId) : [...prev, diceId]);
  };

  const getDiceFace = (val: string) => {
    switch (val) {
      case 'Heart': return <span style={{color: '#ef4444', textShadow: '0 0 5px rgba(0,0,0,0.5)'}}>❤️</span>;
      case 'Energy': return <span style={{color: '#06b6d4', filter: 'drop-shadow(0 0 5px rgba(0,0,0,0.5))'}}><LightningIcon /></span>;
      case 'Smash': return <span style={{color: '#f97316', textShadow: '0 0 5px rgba(0,0,0,0.5)'}}>💥</span>;
      case '1': return <span style={{color: 'white', textShadow: '0 0 5px rgba(0,0,0,0.5)'}}>1</span>;
      case '2': return <span style={{color: 'white', textShadow: '0 0 5px rgba(0,0,0,0.5)'}}>2</span>;
      case '3': return <span style={{color: 'white', textShadow: '0 0 5px rgba(0,0,0,0.5)'}}>3</span>;
      default: return '?';
    }
  };

  const renderPromptsAndControls = () => {
    if (status !== 'Playing') return null;

    // 1. If there's an active prompt for ME
    if (prompt && prompt.playerId === myPlayerId) {
      return (
        <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '20px', borderRadius: '12px', border: '1px solid #ef4444', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 15px 0' }}>{prompt.text}</h3>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
            {prompt.options.map((opt, i) => (
              <button key={i} className="btn primary" style={{ width: '160px', height: '60px', fontSize: '20px' }} onClick={() => dispatch(opt.action as KotAction)}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // 2. If it's MY turn and NO prompt
    if (isMyTurn && !prompt) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end', minHeight: '60px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {rollCount > 0 && rollCount < 3 && (
              <button className="btn" onClick={handleResolve} style={{ width: '160px', height: '60px', fontSize: '20px', background: '#10b981', color: 'white', border: 'none' }}>
                Done
              </button>
            )}
            {rollCount < 3 && (
              <button className="btn primary" onClick={handleRoll} style={{ width: '160px', height: '60px', fontSize: '20px' }}>
                 Roll ({3 - rollCount})
              </button>
            )}
            {rollCount >= 3 && (
              <div style={{ width: '330px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', background: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }}>
                Resolving...
              </div>
            )}
          </div>
        </div>
      );
    }

    // 3. Not my turn / Waiting
    let message = "Waiting for game to start...";
    if (prompt) {
      message = `Waiting for ${players[prompt.playerId]?.name} to decide...`;
    } else if (playerOrder[currentPlayerIndex]) {
      message = `Waiting for ${players[playerOrder[currentPlayerIndex]]?.name}'s turn...`;
    }

    return (
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '18px', fontStyle: 'italic', padding: '20px' }}>
        {message}
      </div>
    );
  };

  const [selectedCard, setSelectedCard] = React.useState<string | null>(null);

  const renderGraphics = () => {
    if (status !== 'Playing' && status !== 'Finished') return null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px', boxSizing: 'border-box' }}>
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        
        {/* Top Row: Cards and Prompts */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', minHeight: '200px' }}>
          {/* Top Left: Cards Market */}
          <div style={{ flex: 1, border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '12px', padding: '15px', display: 'flex', gap: '15px', alignItems: 'flex-start', justifyContent: 'flex-start', background: 'rgba(0,0,0,0.2)', flexWrap: 'wrap' }}>
            {gameState.market?.map((cardId, i) => {
              const card = CARD_REGISTRY[cardId];
              if (!card) return null;

              let displayCost = card.cost;
              if (isMyTurn && prompt?.text === 'Buy Phase') {
                const evalPayload = { playerId: myPlayerId, cardOwnerId: myPlayerId, cost: card.cost };
                dispatchEvent(gameState, 'BUY_CARD_EVAL', evalPayload);
                displayCost = evalPayload.cost || 0;
              }
              const canAfford = (players[myPlayerId]?.energy || 0) >= displayCost;
              const alreadyOwned = players[myPlayerId]?.cards?.includes(cardId);
              const canBuy = isMyTurn && prompt?.text === 'Buy Phase' && canAfford && !alreadyOwned;

              return (
                <div 
                  key={`${cardId}-${i}`}
                  style={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px', padding: '15px', width: '220px', height: '320px', flex: '0 0 auto', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', boxSizing: 'border-box' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{card.name}</div>
                    <div style={{ fontSize: '12px', color: 'gray', padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>{card.type}</div>
                  </div>
                  
                  <div style={{ fontSize: '14px', flex: 1, marginBottom: '15px', color: '#cbd5e1', overflowY: 'auto' }}>{card.description}</div>
                  
                  {isMyTurn && prompt?.text === 'Buy Phase' && (
                    <button 
                      disabled={!canBuy}
                      onClick={() => dispatch({ type: 'BUY_CARD', payload: { playerId: myPlayerId, cardId } })}
                      style={{ 
                        padding: '12px 10px', width: '100%', fontSize: '16px', fontWeight: 'bold', borderRadius: '6px',
                        background: canBuy ? '#3b82f6' : 'rgba(255,255,255,0.1)', 
                        color: canBuy ? 'white' : 'gray', 
                        border: canBuy ? 'none' : '1px solid gray',
                        cursor: canBuy ? 'pointer' : 'default',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      {alreadyOwned ? 'Already Owned' : (
                        <span>
                          Buy 
                          {displayCost < card.cost ? (
                            <span style={{ marginLeft: '8px' }}>
                              <s style={{ color: 'rgba(255,255,255,0.5)', marginRight: '4px' }}>{card.cost}</s>
                              {displayCost} ⚡
                            </span>
                          ) : (
                            <span style={{ marginLeft: '8px' }}>{card.cost} ⚡</span>
                          )}
                        </span>
                      )}
                    </button>
                  )}
                  {(!isMyTurn || prompt?.text !== 'Buy Phase') && (
                    <div style={{ textAlign: 'center', padding: '12px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', color: 'gray', fontWeight: 'bold' }}>
                      Cost: {card.cost} ⚡
                    </div>
                  )}
                </div>
              );
            })}
            {(!gameState.market || gameState.market.length === 0) && (
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '18px', fontWeight: 'bold', alignSelf: 'center', margin: 'auto' }}>Market Empty</span>
            )}
          </div>

          {/* Top Right: Prompts & Turn Controls */}
          <div style={{ flex: 1, marginLeft: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: '10px' }}>
            {renderPromptsAndControls()}
          </div>
        </div>

        {/* Middle: Dice */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {status === 'Finished' && (
            <div style={{ padding: '15px 40px', background: gameState.winnerId === myPlayerId ? '#22c55e' : 'rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', marginBottom: '30px', textAlign: 'center', fontSize: '32px', fontWeight: 'bold' }}>
              {gameState.winnerId === myPlayerId ? "🏆 You Won!" : `Winner: ${players[gameState.winnerId!].name}`}
            </div>
          )}

          <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
            {dice.map((d) => {
              const isDiceKept = d.kept || (isMyTurn && rollCount > 0 && keptDiceIds.includes(d.id));
              return (
                <div 
                  key={isDiceKept ? d.id : `dice-${d.id}-${rollCount}`}
                  onClick={() => toggleKeep(d.id)}
                  className={!isDiceKept && rollCount > 0 ? 'dice-rolling' : ''}
                  style={{
                    width: '80px',
                    height: '80px',
                    background: isDiceKept ? '#22c55e' : 'rgba(255,255,255,0.1)',
                    border: isDiceKept ? '3px solid #4ade80' : '2px solid rgba(255,255,255,0.3)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '36px',
                    fontWeight: 'bold',
                    cursor: (isMyTurn && rollCount > 0 && rollCount < 3 && !prompt) ? 'pointer' : 'default',
                    boxShadow: isDiceKept ? '0 0 15px rgba(74, 222, 128, 0.5)' : 'none',
                    opacity: rollCount === 0 ? 0.3 : 1,
                    position: 'relative'
                  }}
                >
                  {rollCount > 0 ? getDiceFace(d.value) : '?'}
                  {isDiceKept && <div style={{position: 'absolute', top: '-10px', right: '-10px', fontSize: '20px'}}>🔒</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Card Details Modal */}
        {selectedCard && CARD_REGISTRY[selectedCard] && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelectedCard(null)}>
            <div style={{ background: '#1e293b', padding: '30px', borderRadius: '12px', border: '2px solid #3b82f6', maxWidth: '400px', width: '100%' }} onClick={e => e.stopPropagation()}>
              <h2 style={{ margin: '0 0 10px 0' }}>{CARD_REGISTRY[selectedCard].name}</h2>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <span style={{ color: '#06b6d4', fontWeight: 'bold' }}>Cost: {CARD_REGISTRY[selectedCard].cost} ⚡</span>
                <span style={{ color: 'gray' }}>Type: {CARD_REGISTRY[selectedCard].type}</span>
              </div>
              <p style={{ fontSize: '16px', lineHeight: '1.5', marginBottom: '30px' }}>{CARD_REGISTRY[selectedCard].description}</p>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => setSelectedCard(null)} style={{ background: 'transparent', color: 'white', border: '1px solid gray', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPlayerDetails = (playerId: string) => {
    const p = players[playerId];
    const isDead = p.health <= 0;
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          marginTop: '10px', 
          display: 'flex', 
          justifyContent: 'flex-start', 
          gap: '20px',
          filter: isDead ? 'grayscale(100%)' : 'none',
          opacity: isDead ? 0.5 : 1
        }}>
          <AnimatedCounter value={p.health} icon="❤️" color="#ef4444" suffix={`/${settings?.maxHealth || 10}`} width="70px" />
          <AnimatedCounter value={p.vp} icon="⭐" color="#eab308" width="40px" />
          <AnimatedCounter value={p.energy} icon={<LightningIcon />} color="#06b6d4" width="40px" />
          {p.location === 'TokyoCity' && !isDead && (
            <div style={{ color: '#a855f7', fontWeight: 'bold', border: '1px solid #a855f7', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', marginLeft: 'auto' }}>
              TOKYO
            </div>
          )}
          {isDead && (
            <div style={{ color: 'gray', fontWeight: 'bold', border: '1px solid gray', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', marginLeft: 'auto' }}>
              DEAD
            </div>
          )}
        </div>
        {p.cards && p.cards.length > 0 && (
          <div style={{ display: 'flex', gap: '5px', marginTop: '5px', flexWrap: 'wrap' }}>
            {p.cards.map((cId, i) => {
               const isHighlighted = highlightedCards.includes(cId);
               return (
                 <div 
                   key={i} 
                   onClick={() => setSelectedCard(cId)}
                   style={{ 
                     fontSize: '11px', 
                     background: isHighlighted ? '#a855f7' : '#334155', 
                     color: 'white',
                     padding: '2px 6px', 
                     borderRadius: '4px', 
                     cursor: 'pointer',
                     transition: 'background 0.3s, transform 0.3s',
                     transform: isHighlighted ? 'scale(1.2)' : 'scale(1)'
                   }}
                 >
                   {CARD_REGISTRY[cId]?.name || cId}
                 </div>
               );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderLogMessage = (msg: string, defaultRenderer: (m: string) => React.ReactNode) => {
    let parts: React.ReactNode[] = [msg];
    
    ALL_CARD_IDS.forEach(cId => {
      const card = CARD_REGISTRY[cId];
      if (!card) return;
      const newParts: React.ReactNode[] = [];
      parts.forEach(part => {
        if (typeof part === 'string') {
          const split = part.split(card.name);
          split.forEach((s, idx) => {
            newParts.push(s);
            if (idx < split.length - 1) {
              newParts.push(
                <span 
                  key={`${cId}-${idx}`} 
                  onClick={() => setSelectedCard(cId)}
                  style={{ color: '#60a5fa', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {card.name}
                </span>
              );
            }
          });
        } else {
          newParts.push(part);
        }
      });
      parts = newParts;
    });

    return parts.map((p, i) => typeof p === 'string' ? <React.Fragment key={i}>{defaultRenderer(p)}</React.Fragment> : p);
  };

  return (
    <GameLayout
      gameName="King of Tokyo"
      helpText={`Roll dice up to 3 times. Reach ${settings?.maxVp || 20} VP or be the last monster standing!`}
      helpUrl="https://en.wikipedia.org/wiki/King_of_Tokyo"
      renderGameSpecificPlayerDetails={renderPlayerDetails}
      renderGameSpecificStats={() => <KotStats gameState={gameState} />}
      renderLogMessage={renderLogMessage}
      settings={renderSettings(settings, dispatch, status)}
    >
      {renderGraphics()}
    </GameLayout>
  );
};
