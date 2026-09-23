import React, { useState } from 'react';
import { GameLayout, useGameContext } from '@erez/boardgame-core';
import { AcquireState, AcquireAction, AcquirePlayer, Corporation } from '../engine/types';
import { getPlayerFinancials, getStockPrice } from '../engine/engine';
import './AcquireBoard.css';

export function AcquireBoard() {
  const { gameState: state, myPlayerId: playerId, dispatch } = useGameContext<AcquireState, AcquireAction>();
  const [selectedCorp, setSelectedCorp] = useState<Corporation | null>(null);
  const [sellCount, setSellCount] = useState(0);
  const [tradeCount, setTradeCount] = useState(0);

  const me = state?.players[playerId];
  const pm = state?.pendingMerge;
  const dCorp = pm?.defunct[pm.currentDefunctIndex];
  const aCorp = pm?.acquirer;
  const myDefunctStocks = me && dCorp ? (me.stocks[dCorp] || 0) : 0;
  
  React.useEffect(() => {
    setSellCount(0);
    setTradeCount(0);
  }, [myDefunctStocks, dCorp]);

  if (!state) return <div className="loading">Loading...</div>;

  const isMyTurn = state.playerOrder[state.currentPlayerIndex] === playerId;

  const renderLogMessage = (msg: string, defaultRenderer: (m: string) => React.ReactNode) => {
    let cleanLog = msg.replace('---', '').replace(/🤖 /g, '');
    let elements: React.ReactNode[] = [];
    
    const corpColors: Record<string, string> = {
      Tower: 'var(--corp-tower)',
      Luxor: 'var(--corp-luxor)',
      American: 'var(--corp-american)',
      Worldwide: 'var(--corp-worldwide)',
      Festival: 'var(--corp-festival)',
      Imperial: 'var(--corp-imperial)',
      Continental: 'var(--corp-continental)'
    };
    
    const player = (Object.values(state.players) as AcquirePlayer[]).find(p => cleanLog.startsWith(p.name.replace('🤖 ', '')));
    let namePart = '';
    
    if (player) {
      namePart = player.name.replace('🤖 ', '');
      elements.push(<span key="name" className="player-name" style={{ color: player.color }}>{namePart}</span>);
      cleanLog = cleanLog.substring(namePart.length);
    }

    const corpNames = Object.keys(corpColors).join('|');
    const regex = new RegExp(`(${corpNames})`, 'g');
    
    const parts = cleanLog.split(regex);
    parts.forEach((part, idx) => {
      if (corpColors[part]) {
        elements.push(<span key={idx} style={{ color: corpColors[part], fontWeight: 'bold' }}>{part}</span>);
      } else if (part) {
        elements.push(<span key={idx}>{part}</span>);
      }
    });

    let emoji = '';
    if (msg.includes('founded')) emoji = '🏢 ';
    else if (msg.includes('bought')) emoji = '💰 ';
    else if (msg.includes('discarded')) emoji = '🗑️ ';
    else if (msg.includes('gets bonus')) emoji = '💵 ';
    else if (msg.includes('played tile')) emoji = '⬜ ';
    else if (msg.includes('Merger!')) emoji = '💥 ';
    else if (msg.includes('grows by')) emoji = '📈 ';
    else if (msg.includes('resolved')) emoji = '⚖️ ';
    else if (msg.includes('caused a merger')) emoji = '⚠️ ';

    let bg = 'transparent';
    if (msg.includes('founded')) bg = 'rgba(255, 255, 255, 0.1)';
    if (msg.includes('Merger!')) bg = 'rgba(239, 68, 68, 0.2)';

    return (
      <span style={{ 
        backgroundColor: bg,
        padding: bg !== 'transparent' ? '4px 8px' : '2px 0',
        borderRadius: '4px',
        fontWeight: msg.includes('founded') || msg.includes('Merger!') ? 'bold' : 'normal',
        display: 'inline-flex',
        gap: '4px',
        alignItems: 'flex-start'
      }}>
        {emoji && <span style={{ fontSize: '1.2em', lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>{emoji}</span>}
        <span style={{ flex: 1, display: 'inline-block' }}>{elements.map((el, i) => typeof el === 'string' ? <React.Fragment key={i}>{defaultRenderer(el)}</React.Fragment> : el)}</span>
      </span>
    );
  };

  const renderPlayerDetails = (pId: string) => {
    const p = state.players[pId];
    if (!p) return null;
    const fin = getPlayerFinancials(state, p.id);
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '13px', marginTop: '5px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
           <span>NW: <strong style={{ color: '#fbbf24' }}>${fin.netWorth.toLocaleString()}</strong></span>
           <span>Cash: ${fin.cash.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '5px' }}>
          {(Object.keys(state.corporations) as Corporation[]).map(cName => {
             const count = p.stocks[cName] || 0;
             if (count === 0) return null;
             return (
               <div key={cName} style={{ 
                 padding: '2px 6px', 
                 borderRadius: '4px', 
                 background: 'rgba(0,0,0,0.3)',
                 border: `1px solid var(--corp-${cName.toLowerCase()})`,
                 color: `var(--corp-${cName.toLowerCase()})`,
                 fontSize: '11px',
                 fontWeight: 'bold'
               }}>
                 {cName.substring(0,3)}: {count}
               </div>
             );
          })}
        </div>
        {pId === playerId && p.tiles && p.tiles.length > 0 && (
          <div style={{ marginTop: '10px', background: 'rgba(0,0,0,0.2)', padding: '5px', borderRadius: '4px' }}>
            <div style={{ fontSize: '11px', color: 'gray', marginBottom: '5px' }}>Your Tiles:</div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {p.tiles.map(t => (
                 <span key={t.id} style={{ background: '#3b82f6', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{t.id}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const keepCount = myDefunctStocks - sellCount - tradeCount;

  return (
    <GameLayout
      gameName="Acquire"
      helpText="Acquire is a classic board game of strategy and finance. Players form, merge, and expand hotel chains while strategically buying stock to maximize their wealth."
      helpUrl="https://www.ultraboardgames.com/acquire/game-rules.php"
      renderGameSpecificPlayerDetails={renderPlayerDetails}
      renderLogMessage={renderLogMessage}
    >
      <div className="game-container" style={{ padding: '0px', display: 'flex', flexDirection: 'row', gap: '20px', height: '100%' }}>
        <div className="board glass" style={{ flex: '2', minWidth: '0' }}>
          {Array.from({length: 9}).map((_, rIdx) => {
            const row = state.board[rIdx];
            return (
            <div key={rIdx} className="board-row">
              {(row || []).map((cell, cIdx) => {
                const cellId = `${rIdx + 1}${String.fromCharCode(65 + cIdx)}`;
                const isInHand = me?.tiles.some(t => t.id === cellId);
                const isPlayable = isInHand && state.phase === 'PlayTile' && isMyTurn;
                let tileIcon = null;
                
                if (isInHand) {
                  const neighbors = [];
                  if (rIdx > 0) neighbors.push(state.board[rIdx - 1][cIdx]);
                  if (rIdx < 8) neighbors.push(state.board[rIdx + 1][cIdx]);
                  if (cIdx > 0) neighbors.push(state.board[rIdx][cIdx - 1]);
                  if (cIdx < 11) neighbors.push(state.board[rIdx][cIdx + 1]);
                  
                  const adjCorps = new Set(neighbors.filter(n => n && n !== 'Unincorporated'));
                  const adjUnincorp = neighbors.filter(n => n === 'Unincorporated');
                  const safeAdjCorps = Array.from(adjCorps).filter(c => state.corporations[c as Corporation]?.isSafe);
                  
                  const availableCorps = Object.values(state.corporations).filter(c => !c.isActive);
                  
                  if (safeAdjCorps.length >= 2) {
                    tileIcon = '🚫';
                  } else if (adjCorps.size > 1) {
                    tileIcon = '💥';
                  } else if (adjCorps.size === 0 && adjUnincorp.length > 0 && availableCorps.length > 0) {
                    tileIcon = '✨';
                  }
                }
                
                let renderedCell = cell;
                let isDefunct = false;
                
                if (state.phase === 'MergeResolution' && state.pendingMerge?.defunctTiles) {
                  const defunct = state.pendingMerge.defunctTiles.find(t => t.row === rIdx && t.col === cIdx);
                  if (defunct) {
                    renderedCell = defunct.corp;
                    isDefunct = true;
                  }
                }
                
                return (
                  <div 
                    key={cIdx} 
                    className={`board-cell ${renderedCell ? renderedCell.toLowerCase() : ''} ${isInHand ? 'in-hand' : ''} ${isPlayable ? 'playable' : ''}`}
                    style={{ opacity: isDefunct ? 0.6 : 1, filter: isDefunct ? 'grayscale(0.3)' : 'none' }}
                    onClick={() => {
                      if (isPlayable && tileIcon !== '🚫' && isMyTurn && state.phase === 'PlayTile') {
                        dispatch({ type: 'PLAY_TILE', payload: { playerId, tileId: cellId as any } });
                      }
                    }}
                  >
                    <span className="cell-label" style={{ zIndex: 1, position: 'relative' }}>{rIdx + 1}{String.fromCharCode(65 + cIdx)}</span>
                    {renderedCell && renderedCell !== 'Unincorporated' && <span className="cell-corp">{renderedCell}</span>}
                    {isInHand && tileIcon && (
                      <div className="tile-icon-bg" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '2rem', opacity: 0.25, zIndex: 0 }}>
                        {tileIcon}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            );
          })}
        </div>

        {/* Action Controls / Buy Market Below Board */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div className="glass" style={{ padding: '15px', borderRadius: '12px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Market</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(Object.entries(state.corporations) as [Corporation, any][]).sort((a, b) => {
                const corpOrder = ['Tower', 'Luxor', 'American', 'Worldwide', 'Festival', 'Imperial', 'Continental'];
                return corpOrder.indexOf(a[0]) - corpOrder.indexOf(b[0]);
              }).map(([cName, cState]) => (
                <div key={cName} style={{ 
                  background: 'rgba(0,0,0,0.3)', 
                  border: `1px solid var(--corp-${cName.toLowerCase()})`, 
                  borderRadius: '8px', 
                  padding: '12px', 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  opacity: cState.isActive ? 1 : 0.4
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong className={`corp-name ${cName.toLowerCase()}`} style={{ cursor: 'pointer', textDecoration: cState.isActive ? 'underline' : 'none' }} onClick={() => { if(cState.isActive) setSelectedCorp(cName); }}>
                      {cState.isSafe && '🛡️ '}{cName}
                    </strong>
                    {cState.isActive && <span>{cState.availableStocks} left</span>}
                  </div>
                  {cState.isActive && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>${cState.stockPrice.toLocaleString()}</span>
                      {isMyTurn && state.phase === 'BuyStocks' && me!.money >= cState.stockPrice && state.sharesBoughtThisTurn < 3 && cState.availableStocks > 0 && (
                        <button 
                          className="action-required-buy"
                          onClick={() => dispatch({ type: 'BUY_STOCK', payload: { playerId, corpName: cName } })}
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                        >
                          Buy
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {state.phase === 'BuyStocks' && isMyTurn && (
               <div style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}>
                 <button 
                   className="end-turn-btn action-required-buy" 
                   onClick={() => dispatch({ type: 'END_TURN', payload: { playerId } })}
                   style={{ padding: '10px 20px', fontSize: '16px' }}
                 >
                   End Turn (Bought {state.sharesBoughtThisTurn}/3)
                 </button>
               </div>
            )}
          </div>
        </div>

        {/* Modals directly from original game */}
        {state.phase === 'FoundCorporation' && state.pendingFounding?.playerId === playerId && (
          <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div className="modal-content glass" style={{ padding: '2rem', minWidth: '300px', textAlign: 'center' }}>
              <h3>Found a Corporation</h3>
              <p style={{ marginBottom: '1.5rem' }}>Choose a corporation to found:</p>
              <div className="corp-options">
                {(() => {
                  const size = state.pendingFounding.size || 2;
                  const prices = new Map<number, Corporation[]>();
                  
                  state.pendingFounding.availableCorps.forEach(c => {
                    const price = getStockPrice(c, size);
                    if (!prices.has(price)) prices.set(price, []);
                    prices.get(price)!.push(c);
                  });

                  return Array.from(prices.entries())
                    .sort((a, b) => a[0] - b[0])
                    .map(([price, corps]) => (
                      <div key={price} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <strong style={{ width: '60px', textAlign: 'right' }}>${price.toLocaleString()}:</strong>
                        {corps.map(c => (
                          <button 
                            key={c} 
                            className={`tile-btn ${c.toLowerCase()}`} 
                            onClick={() => dispatch({ type: 'FOUND_CORPORATION', payload: { playerId, corpName: c } })}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    ));
                })()}
              </div>
            </div>
          </div>
        )}

        {state.phase === 'ChooseMergeSurvivor' && state.pendingSurvivorChoice?.playerId === playerId && (
          <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div className="modal-content glass" style={{ padding: '2rem', minWidth: '300px', textAlign: 'center' }}>
              <h3>Choose Surviving Corporation</h3>
              <p>A merger occurred! Choose which corporation will survive:</p>
              <div className="corp-buttons" style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                {state.pendingSurvivorChoice.tiedCorps.map(corp => {
                  const defunctCorps = state.pendingSurvivorChoice!.allCorpsInvolved.filter(c => c !== corp);
                  return (
                    <button 
                      key={corp}
                      className={`tile-btn ${corp.toLowerCase()}`}
                      onClick={() => dispatch({ type: 'CHOOSE_MERGE_SURVIVOR', payload: { playerId, survivorName: corp } })}
                    >
                      Merge {defunctCorps.join(', ')} into {corp}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {isMyTurn && state.phase === 'MergeResolution' && pm && dCorp && aCorp && (
          <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div className="merge-panel glass" style={{ padding: '1rem', border: '2px solid var(--accent)', minWidth: '350px' }}>
              <h4 style={{ margin: '0 0 10px 0', textAlign: 'center' }}>Resolve Merge Stocks</h4>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', margin: '20px 0' }}>
                <div className={`board-cell ${dCorp.toLowerCase()}`} style={{ width: '100px', height: '70px', flex: 'none', borderRadius: '8px', opacity: 0.8 }}>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Defunct</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginTop: '4px' }}>{dCorp}</div>
                </div>
                <div style={{ fontSize: '2rem', color: 'white' }}>➔</div>
                <div className={`board-cell ${aCorp.toLowerCase()}`} style={{ width: '100px', height: '70px', flex: 'none', borderRadius: '8px', border: '2px solid white', boxShadow: '0 0 15px rgba(255,255,255,0.3)' }}>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Survivor</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginTop: '4px' }}>{aCorp}</div>
                </div>
              </div>
              <p style={{ textAlign: 'center', fontSize: '1.1rem', marginBottom: '20px' }}>
                You have <strong>{myDefunctStocks}</strong> shares of <strong>{dCorp}</strong>.
              </p>
              
              {myDefunctStocks > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
                  <table style={{ width: '100%', textAlign: 'center', borderSpacing: '0 10px' }}>
                    <tbody>
                      <tr>
                        <td style={{ textAlign: 'left' }}>Trade 2 for 1</td>
                        <td style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <button disabled={tradeCount <= 0} onClick={() => setTradeCount(t => t - 2)} style={{ width: '30px' }}>-</button>
                          <span style={{ margin: '0 15px', display: 'inline-block', width: '20px', textAlign: 'center' }}>{tradeCount}</span>
                          <button disabled={tradeCount + 2 > Math.min(Math.floor((myDefunctStocks - sellCount) / 2) * 2, state.corporations[aCorp].availableStocks * 2)} onClick={() => setTradeCount(t => t + 2)} style={{ width: '30px' }}>+</button>
                          <button disabled={tradeCount + 2 > Math.min(Math.floor((myDefunctStocks - sellCount) / 2) * 2, state.corporations[aCorp].availableStocks * 2)} style={{ marginLeft: '10px', width: '40px', padding: '0' }} onClick={() => {
                            const maxTrades = Math.min(Math.floor((myDefunctStocks - sellCount) / 2) * 2, state.corporations[aCorp].availableStocks * 2);
                            setTradeCount(maxTrades);
                          }}>All</button>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ textAlign: 'left' }}>Sell</td>
                        <td style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <button disabled={sellCount <= 0} onClick={() => setSellCount(s => s - 1)} style={{ width: '30px' }}>-</button>
                          <span style={{ margin: '0 15px', display: 'inline-block', width: '20px', textAlign: 'center' }}>{sellCount}</span>
                          <button disabled={sellCount + tradeCount + 1 > myDefunctStocks} onClick={() => setSellCount(s => s + 1)} style={{ width: '30px' }}>+</button>
                          <button disabled={sellCount + tradeCount + 1 > myDefunctStocks} style={{ marginLeft: '10px', width: '40px', padding: '0' }} onClick={() => {
                            setSellCount(myDefunctStocks - tradeCount);
                          }}>All</button>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ textAlign: 'left' }}>Keep</td>
                        <td style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <div style={{ width: '30px' }}></div>
                          <span style={{ margin: '0 15px', display: 'inline-block', width: '20px', fontWeight: 'bold', textAlign: 'center' }}>{keepCount}</span>
                          <div style={{ width: '30px' }}></div>
                          <div style={{ marginLeft: '10px', width: '40px' }}></div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <button 
                    style={{ marginTop: '10px' }}
                    onClick={() => {
                      dispatch({ type: 'RESOLVE_MERGE_STOCKS', payload: { playerId, sell: sellCount, trade: tradeCount, keep: keepCount } });
                    }}
                  >
                    Confirm Resolution
                  </button>
                </div>
              ) : (
                <button onClick={() => dispatch({ type: 'RESOLVE_MERGE_STOCKS', payload: { playerId, sell: 0, trade: 0, keep: 0 } })}>Continue</button>
              )}
            </div>
          </div>
        )}

        {selectedCorp && (
          <div className="modal-backdrop" onClick={() => setSelectedCorp(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ padding: '2rem', minWidth: '300px' }}>
              <h3 className={`corp-name ${selectedCorp.toLowerCase()}`} style={{ marginBottom: '1rem', display: 'inline-block' }}>{selectedCorp} Details</h3>
              <table style={{ width: '100%', textAlign: 'left', borderSpacing: '0 10px' }}>
                <tbody>
                  <tr><th>Status</th><td>{state.corporations[selectedCorp].isActive ? 'Active' : 'Inactive'}</td></tr>
                  <tr><th>Size</th><td>{state.corporations[selectedCorp].size} tiles {state.corporations[selectedCorp].isSafe ? '🛡️ (Safe)' : ''}</td></tr>
                  {state.corporations[selectedCorp].isActive && (
                    <>
                      <tr><th>Stock Price</th><td>${state.corporations[selectedCorp].stockPrice.toLocaleString()}</td></tr>
                      <tr><th>Majority Bonus</th><td>${state.corporations[selectedCorp].majorityBonus.toLocaleString()}</td></tr>
                      <tr><th>Minority Bonus</th><td>${state.corporations[selectedCorp].minorityBonus.toLocaleString()}</td></tr>
                      <tr><th>Available Stocks</th><td>{state.corporations[selectedCorp].availableStocks}</td></tr>
                    </>
                  )}
                </tbody>
              </table>
              <button onClick={() => setSelectedCorp(null)} style={{ marginTop: '1.5rem', width: '100%' }}>Close</button>
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  );
}

export default AcquireBoard;
