import React, { useState } from 'react';
import { GameLayout, useGameContext, AnimatedValue } from '@erez/boardgame-core';
import { AcquireStats } from './AcquireStats';
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

    let activeId = state.playerOrder[state.currentPlayerIndex];
  if (state.phase === 'FoundCorporation' && state.pendingFounding) activeId = state.pendingFounding.playerId;
  if (state.phase === 'ChooseMergeSurvivor' && state.pendingSurvivorChoice) activeId = state.pendingSurvivorChoice.playerId;
  if (state.phase === 'MergeResolution' && state.pendingMerge) activeId = state.playerOrder[state.pendingMerge.playerResolutionIndex];
  
  const isMyTurn = activeId === playerId;

  const [showMergerModal, setShowMergerModal] = React.useState(false);
  React.useEffect(() => {
    if (state?.phase === 'MergeResolution' || state?.phase === 'ChooseMergeSurvivor' || state?.phase === 'FoundCorporation') {
      const timer = setTimeout(() => setShowMergerModal(true), 1500);
      return () => clearTimeout(timer);
    } else {
      setShowMergerModal(false);
    }
  }, [state?.phase, state?.pendingMerge?.currentDefunctIndex]);

  
  const renderSettings = () => {
    const gameSpeed = state.settings?.gameSpeed || 'Normal';
    return (
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '300px', alignItems: 'center' }}>
          <label style={{ fontSize: '18px' }}>Speed of Play:</label>
          <select
            value={gameSpeed}
            onChange={e => dispatch({ type: 'UPDATE_SETTINGS', payload: { ...state.settings, gameSpeed: e.target.value } } as any)}
            disabled={state.status !== 'Lobby'}
            className="modern-input"
            style={{ width: '120px', display: 'inline-block', opacity: state.status !== 'Lobby' ? 0.5 : 1, cursor: state.status !== 'Lobby' ? 'not-allowed' : 'pointer' }}
          >
            <option value="Slow">Slow</option>
            <option value="Normal">Normal</option>
            <option value="Fast">Fast</option>
            <option value="Ultra">Ultra</option>
          </select>
        </div>
      </div>
    );
  };

  const renderLogMessage = (msg: string, defaultRenderer: (m: string) => React.ReactNode) => {
    if (msg.includes("'s Turn ---")) {
      return (
        <span style={{ display: 'block', margin: '15px 0 5px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2px', color: 'gray', fontSize: '0.85rem' }}>
          {defaultRenderer(msg)}
        </span>
      );
    }

    let cleanLog = msg.replace(/🤖 /g, '');
    let parts: React.ReactNode[] = [cleanLog];
    
    const corpColors: Record<string, string> = {
      Tower: 'var(--corp-tower)',
      Luxor: 'var(--corp-luxor)',
      American: 'var(--corp-american)',
      Worldwide: 'var(--corp-worldwide)',
      Festival: 'var(--corp-festival)',
      Imperial: 'var(--corp-imperial)',
      Continental: 'var(--corp-continental)'
    };
    
    Object.entries(corpColors).forEach(([corp, color]) => {
      const newParts: React.ReactNode[] = [];
      parts.forEach(part => {
        if (typeof part === 'string') {
          const split = part.split(corp);
          split.forEach((s, idx) => {
            newParts.push(s);
            if (idx < split.length - 1) {
              newParts.push(<span key={`${corp}-${idx}`} style={{ color, fontWeight: 'bold' }}>{corp}</span>);
            }
          });
        } else {
          newParts.push(part);
        }
      });
      parts = newParts;
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
        padding: bg !== 'transparent' ? '2px 4px' : '0',
        borderRadius: '4px',
        fontWeight: msg.includes('founded') || msg.includes('Merger!') ? 'bold' : 'normal',
        fontSize: '0.85rem'
      }}>
        {emoji}{parts.map((el, i) => typeof el === 'string' ? <React.Fragment key={i}>{defaultRenderer(el)}</React.Fragment> : el)}
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
           <span>Net Worth: <strong style={{ color: '#fbbf24' }}>${fin.netWorth.toLocaleString()}</strong></span>
           <span>Cash: ${fin.cash.toLocaleString()}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginTop: '5px', textAlign: 'center' }}>
          {(['Tower', 'Luxor', 'American', 'Worldwide', 'Festival', 'Imperial', 'Continental'] as Corporation[]).map(cName => {
             const count = p.stocks[cName] || 0;
             
             let icon = null;
             if (count > 0) {
               const holders = Object.values(state.players)
                   .map((px: any) => ({ id: px.id, count: px.stocks[cName] || 0 }))
                   .filter(h => h.count > 0)
                   .sort((a,b) => b.count - a.count);
                   
               if (holders.length > 0 && holders[0].id === pId) {
                 icon = '🥇';
               } else if (holders.length > 1) {
                 if (holders[0].count === count) icon = '🥇'; // Tied for 1st
                 else if (holders[1].count === count || holders[1].id === pId) icon = '🥈'; // 2nd or tied for 2nd
               }
             }

             if (count === 0) {
               return <div key={cName} style={{ minHeight: '30px' }}></div>;
             }

             const isActive = state.corporations[cName]?.isActive;
             const isGold = icon === '🥇';
             const isSilver = icon === '🥈';
             return (
               <div key={cName} className={state.turnContext?.rankChange?.corp === cName && (isGold || isSilver) ? 'rank-change-pop' : ''} style={{ 
                 display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                 padding: '2px', 
                 borderRadius: '4px', 
                 background: isGold ? 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(0,0,0,0.4))' : isSilver ? 'linear-gradient(135deg, rgba(192,192,192,0.2), rgba(0,0,0,0.4))' : 'rgba(0,0,0,0.3)',
                 border: isGold ? '1.5px solid #FFD700' : isSilver ? '1.5px solid #C0C0C0' : `1px solid var(--corp-${cName.toLowerCase()})`,
                 boxShadow: isGold ? '0 0 8px rgba(255,215,0,0.4)' : isSilver ? '0 0 8px rgba(192,192,192,0.4)' : 'none',
                 color: `var(--corp-${cName.toLowerCase()})`,
                 fontSize: '11px',
                 fontWeight: 'bold',
                 lineHeight: 1.1,
                 opacity: isActive ? 1 : 0.4,
                 filter: isActive ? 'none' : 'grayscale(80%)'
               }}>
                 <div>{cName[0]}</div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                   <AnimatedValue value={count} positiveColor={`var(--corp-${cName.toLowerCase()})`} negativeColor={`var(--corp-${cName.toLowerCase()})`} />{icon && <span style={{ fontSize: '10px' }}>{icon}</span>}
                 </div>
               </div>
             )
          })}
        </div>
      </div>
    );
  };

  const keepCount = myDefunctStocks - sellCount - tradeCount;

  return (
    <GameLayout
      gameName="Acquire"
      bottomAreaRatio={25}
      helpText="Acquire is a classic board game of strategy and finance. Players form, merge, and expand hotel chains while strategically buying stock to maximize their wealth."
      helpUrl="https://www.ultraboardgames.com/acquire/game-rules.php"
      renderGameSpecificPlayerDetails={renderPlayerDetails}
      renderGameSpecificStats={() => <AcquireStats gameState={state} />}
      renderLogMessage={renderLogMessage}
      settings={renderSettings()}
    >
      <div className="game-container" style={{ padding: '0px', display: 'flex', flexDirection: 'row', gap: '20px', height: '100%' }}>
        <div className="board glass" style={{ flex: '2', minWidth: '0', position: 'relative' }}>
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
                
                const isPulsing = isInHand && isMyTurn && state.phase === 'PlayTile';
                return (
                  <div 
                    key={cIdx} 
                    className={`board-cell ${renderedCell ? renderedCell.toLowerCase() : ''} ${isInHand ? 'in-hand' : ''} ${isPlayable ? 'playable' : ''} ${isPulsing ? 'my-turn-pulse' : ''}`}
                    style={{ 
                       opacity: isDefunct ? 0.6 : 1, 
                       filter: isDefunct ? 'grayscale(0.3)' : 'none',
                       ...(isInHand ? { 
                          borderColor: me?.color, 
                          color: me?.color, 
                          '--pulse-color': me?.color 
                       } : {})
                    } as any}
                    onClick={() => {
                      if (isPlayable && tileIcon !== '🚫' && isMyTurn && state.phase === 'PlayTile') {
                        dispatch({ type: 'PLAY_TILE', payload: { playerId, tileId: cellId as any } });
                      }
                    }}
                  >
                    <span className="cell-label" style={{ zIndex: 1, position: 'absolute', top: '2px', left: '4px', fontSize: '0.65rem', opacity: 0.6 }}>{rIdx + 1}{String.fromCharCode(65 + cIdx)}</span>
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
          {/* Modals directly from original game */}
        {state.phase === 'FoundCorporation' && state.pendingFounding?.playerId === playerId && showMergerModal && (
          <div className="modal-backdrop" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
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

        {state.phase === 'ChooseMergeSurvivor' && state.pendingSurvivorChoice?.playerId === playerId && showMergerModal && (
          <div className="modal-backdrop" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
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

        {isMyTurn && state.phase === 'MergeResolution' && pm && dCorp && aCorp && showMergerModal && (
          <div className="modal-backdrop" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div className="merge-panel" style={{ backgroundColor: '#1e293b', padding: '30px', border: '2px solid var(--accent)', minWidth: '400px', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
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
                  <table style={{ width: '100%', textAlign: 'center', borderSpacing: '0 15px' }}>
                    <tbody>
                      <tr>
                        <td style={{ textAlign: 'left', lineHeight: '1.2' }}>
                          <div>Trade 2 for 1</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>(@ ${state.corporations[aCorp].stockPrice})</div>
                        </td>
                        <td style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <button disabled={tradeCount <= 0} onClick={() => setTradeCount(t => t - 2)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#334155', border: '1px solid #475569', color: 'white', cursor: tradeCount <= 0 ? 'not-allowed' : 'pointer', opacity: tradeCount <= 0 ? 0.5 : 1 }}>-</button>
                          <span style={{ margin: '0 15px', display: 'inline-block', width: '20px', textAlign: 'center', fontSize: '1.1rem' }}>{tradeCount}</span>
                          <button disabled={tradeCount + 2 > Math.min(Math.floor((myDefunctStocks - sellCount) / 2) * 2, state.corporations[aCorp].availableStocks * 2)} onClick={() => setTradeCount(t => t + 2)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#334155', border: '1px solid #475569', color: 'white', cursor: 'pointer' }}>+</button>
                          <button disabled={tradeCount + 2 > Math.min(Math.floor((myDefunctStocks - sellCount) / 2) * 2, state.corporations[aCorp].availableStocks * 2)} style={{ marginLeft: '10px', width: '50px', padding: '4px', borderRadius: '6px', background: '#475569', border: 'none', color: 'white', cursor: 'pointer' }} onClick={() => {
                            const maxTrades = Math.min(Math.floor((myDefunctStocks - sellCount) / 2) * 2, state.corporations[aCorp].availableStocks * 2);
                            setTradeCount(maxTrades);
                          }}>All</button>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ textAlign: 'left', lineHeight: '1.2' }}>
                          <div>Sell</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>(@ ${state.corporations[dCorp].stockPrice})</div>
                        </td>
                        <td style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <button disabled={sellCount <= 0} onClick={() => setSellCount(s => s - 1)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#334155', border: '1px solid #475569', color: 'white', cursor: sellCount <= 0 ? 'not-allowed' : 'pointer', opacity: sellCount <= 0 ? 0.5 : 1 }}>-</button>
                          <span style={{ margin: '0 15px', display: 'inline-block', width: '20px', textAlign: 'center', fontSize: '1.1rem' }}>{sellCount}</span>
                          <button disabled={sellCount + tradeCount + 1 > myDefunctStocks} onClick={() => setSellCount(s => s + 1)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#334155', border: '1px solid #475569', color: 'white', cursor: 'pointer' }}>+</button>
                          <button disabled={sellCount + tradeCount + 1 > myDefunctStocks} style={{ marginLeft: '10px', width: '50px', padding: '4px', borderRadius: '6px', background: '#475569', border: 'none', color: 'white', cursor: 'pointer' }} onClick={() => {
                            setSellCount(myDefunctStocks - tradeCount);
                          }}>All</button>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ textAlign: 'left' }}>Keep</td>
                        <td style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <div style={{ width: '32px' }}></div>
                          <span style={{ margin: '0 15px', display: 'inline-block', width: '20px', fontWeight: 'bold', textAlign: 'center', fontSize: '1.1rem', color: '#4ade80' }}>{keepCount}</span>
                          <div style={{ width: '32px' }}></div>
                          <div style={{ marginLeft: '10px', width: '50px' }}></div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <button 
                    className="btn primary"
                    style={{ marginTop: '10px' }}
                    onClick={() => {
                      dispatch({ type: 'RESOLVE_MERGE_STOCKS', payload: { playerId, sell: sellCount, trade: tradeCount, keep: keepCount } });
                    }}
                  >
                    Confirm Resolution
                  </button>
                </div>
              ) : (
                <button className="btn primary" onClick={() => dispatch({ type: 'RESOLVE_MERGE_STOCKS', payload: { playerId, sell: 0, trade: 0, keep: 0 } })}>Continue</button>
              )}
            </div>
          </div>
        )}

        {selectedCorp && (
          <div className="modal-backdrop" onClick={() => setSelectedCorp(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
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

        {/* Action Controls / Buy Market Below Board */}
        <div style={{ width: '220px', flex: 'none' }}>
          <div className="glass" style={{ padding: '10px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ margin: 0 }}>Shares</h3>
                 <button 
                   className="end-turn-btn action-required-buy" 
                   onClick={() => dispatch({ type: 'END_TURN', payload: { playerId } })}
                   style={{ 
                     padding: '4px 8px', 
                     fontSize: '12px', 
                     width: 'auto', 
                     margin: 0,
                     visibility: (state.phase === 'BuyStocks' && isMyTurn) ? 'visible' : 'hidden'
                   }}
                 >
                   End ({state.sharesBoughtThisTurn}/3)
                 </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {(Object.entries(state.corporations) as [Corporation, any][]).sort((a, b) => {
                const corpOrder = ['Tower', 'Luxor', 'American', 'Worldwide', 'Festival', 'Imperial', 'Continental'];
                return corpOrder.indexOf(a[0]) - corpOrder.indexOf(b[0]);
              }).map(([cName, cState]) => (
                <div key={cName} style={{ 
                  background: 'rgba(0,0,0,0.3)', 
                  border: `1px solid var(--corp-${cName.toLowerCase()})`, 
                  borderRadius: '6px', 
                  padding: '3px 6px', 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  opacity: cState.isActive ? 1 : 0.4
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong className={`corp-name ${cName.toLowerCase()}`} style={{ cursor: 'pointer', textDecoration: cState.isActive ? 'underline' : 'none', fontSize: '0.85rem' }} onClick={() => { if(cState.isActive) setSelectedCorp(cName); }}>
                      {cState.isSafe && '🛡️ '}{cName} <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'normal' }}>({cState.size})</span>
                    </strong>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 45px', alignItems: 'center', fontSize: '0.75rem', color: '#cbd5e1', minHeight: '22px' }}>
                    <span>{cState.isActive ? `$${cState.stockPrice.toLocaleString()}` : '-'}</span>
                    <span style={{ textAlign: 'center' }}>
                      <AnimatedValue value={cState.availableStocks} positiveColor={`var(--corp-${cName.toLowerCase()})`} negativeColor={`var(--corp-${cName.toLowerCase()})`} suffix=" left" />
                    </span>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                          className={isMyTurn && state.phase === 'BuyStocks' && me!.money >= cState.stockPrice && state.sharesBoughtThisTurn < 3 && cState.availableStocks > 0 ? "action-required-buy" : ""}
                          disabled={!(isMyTurn && state.phase === 'BuyStocks' && me!.money >= cState.stockPrice && state.sharesBoughtThisTurn < 3 && cState.availableStocks > 0)}
                          onClick={() => dispatch({ type: 'BUY_STOCK', payload: { playerId, corpName: cName } })}
                          style={{ 
                             padding: '2px 6px', 
                             fontSize: '11px', 
                             minWidth: '40px',
                             visibility: (isMyTurn && state.phase === 'BuyStocks' && cState.isActive) ? 'visible' : 'hidden'
                          }}
                        >
                          Buy
                        </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            

          </div>
        </div>
      </div>
        </GameLayout>
  );
}

export default AcquireBoard;
