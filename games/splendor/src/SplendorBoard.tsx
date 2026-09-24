import React, { useState } from 'react';
import { SplendorGameState, SplendorAction, GemType, BaseGemTypes, Card } from './types';
import { calculatePayment } from './reducer';
import { GameLayout, useGameContext, Modal, LineChartWidget, LineConfig, LineChartData, PLAYER_COLORS } from '@erez/boardgame-core';
import './SplendorBoard.css';

const GEM_COLORS: Record<GemType, string> = {
  diamond: '#e2e8f0',
  sapphire: '#3b82f6',
  emerald: '#10b981',
  ruby: '#ef4444',
  onyx: '#1f2937',
  gold: '#eab308'
};

export const SplendorBoard: React.FC = () => {
  const { gameState, dispatch, myPlayerId } = useGameContext<SplendorGameState, SplendorAction>();
  const [selectedGems, setSelectedGems] = useState<Partial<Record<GemType, number>>>({});
  const [discardSelection, setDiscardSelection] = useState<Partial<Record<GemType, number>>>({});
  
  

  const isMyTurn = gameState.playerOrder[gameState.currentPlayerIndex] === myPlayerId;
  const turnState = gameState.turnState;
  
  let totalSelected = 0;
  let typesSelected = 0;
  let hasTwo = false;
  for (const g of BaseGemTypes) {
    if (selectedGems[g]) {
      totalSelected += selectedGems[g];
      typesSelected++;
      if (selectedGems[g] === 2) hasTwo = true;
    }
  }
  
  const availableTypes = BaseGemTypes.filter(g => gameState.bank[g] > 0).length;
  // Valid if exactly 2 of same, OR 3 different, OR we selected all available different types (if less than 3 total left)
  const canTake = (hasTwo && totalSelected === 2) || (typesSelected === 3 && totalSelected === 3) || (!hasTwo && totalSelected === availableTypes);


  const handleGemClick = (gem: GemType) => {
    if (!isMyTurn || gem === 'gold') return;
    
    if (turnState === 'take_tokens') {
      const current = selectedGems[gem] || 0;
      if (gameState.bank[gem] <= current) return;
      
      const newSelected = { ...selectedGems, [gem]: current + 1 };
      
      let total = 0;
      let hasTwo = false;
      for (const g of BaseGemTypes) {
        if (newSelected[g] === 2) hasTwo = true;
        total += newSelected[g] || 0;
      }
      
      if (hasTwo && total > 2) return;
      if (!hasTwo && total > 3) return;
      if (newSelected[gem] === 2 && gameState.bank[gem] < 4) return;
      if (newSelected[gem] === 3) return;

      setSelectedGems(newSelected);
    } else if (turnState === 'discard_tokens') {
      const playerGems = gameState.players[myPlayerId].gems;
      const currentDiscarded = selectedGems[gem] || 0;
      if (playerGems[gem] <= currentDiscarded) return;
      
      const newSelected = { ...selectedGems, [gem]: currentDiscarded + 1 };
      let totalDiscarded = 0;
      Object.values(newSelected).forEach(v => totalDiscarded += (v || 0));
      
      setSelectedGems(newSelected);
      
      if (totalDiscarded === gameState.pendingDiscardCount) {
        dispatch({ type: 'DISCARD_GEMS', payload: { gems: newSelected } });
        setSelectedGems({});
      }
    }
  };

  const submitGems = () => {
    dispatch({ type: 'TAKE_GEMS', payload: { gems: selectedGems } });
    setSelectedGems({});
  };

  const clearSelection = () => setSelectedGems({});

  const buyCard = (tier: 1|2|3, cardId: string) => {
    if (!isMyTurn || turnState !== 'take_tokens') return;
    dispatch({ type: 'PURCHASE_CARD_BOARD', payload: { tier, cardId } });
  };

  const reserveCard = (tier: 1|2|3, cardId: string) => {
    if (!isMyTurn || turnState !== 'take_tokens') return;
    dispatch({ type: 'RESERVE_CARD_BOARD', payload: { tier, cardId } });
  };

  const buyReserved = (cardId: string) => {
    if (!isMyTurn || turnState !== 'take_tokens') return;
    dispatch({ type: 'PURCHASE_RESERVED_CARD', payload: { cardId } });
  };

  const renderCard = (card: Card | null, tier: 1|2|3, isReserved = false) => {
    const canAfford = card && gameState.players[myPlayerId] && calculatePayment(gameState.players[myPlayerId], card) !== null;
    if (!card) return <div className="splendor-card-empty" />;
    
    const canReserve = !isReserved && gameState.players[myPlayerId]?.reservedCards.length < 3;
    const isClickable = isMyTurn && turnState === 'take_tokens' && (canAfford || canReserve);

    return (
      <div 
        className={`splendor-card ${isMyTurn && canAfford && !isReserved ? 'splendor-card-affordable' : ''}`} 
        style={{ 
          backgroundColor: GEM_COLORS[card.bonus], 
          border: '1px solid rgba(0,0,0,0.5)', 
          display: 'flex', 
          flexDirection: 'column', 
          cursor: isClickable ? 'pointer' : 'default',
          position: 'relative'
        }}
        onClick={() => {
          if (!isMyTurn || turnState !== 'take_tokens') return;
          if (canAfford) {
             isReserved ? dispatch({ type: 'PURCHASE_RESERVED_CARD', payload: { cardId: card.id } }) : dispatch({ type: 'PURCHASE_CARD_BOARD', payload: { cardId: card.id, tier } });
          } else if (canReserve) {
             dispatch({ type: 'RESERVE_CARD_BOARD', payload: { cardId: card.id, tier } });
          }
        }}
      >
        {isClickable && (
          <div className="splendor-card-hover-action">
            {canAfford ? 'Buy' : 'Reserve'}
          </div>
        )}

        {/* Prestige points top-right */}
        {card.points > 0 && (
          <div 
            className="splendor-card-points" 
            style={{ 
              position: 'absolute', 
              top: '4px', 
              right: '8px', 
              fontSize: '1.4rem', 
              fontWeight: '900', 
              color: card.bonus === 'diamond' ? '#0f172a' : 'white', 
              textShadow: card.bonus === 'diamond' ? 'none' : '0 2px 4px rgba(0,0,0,0.7)',
              lineHeight: 1
            }}
          >
            {card.points}
          </div>
        )}

        {/* Cost gem column starting from top-left */}
        <div 
          className="splendor-card-costs" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '3px', 
            padding: '2px', 
            alignItems: 'flex-start',
            maxWidth: '50px'
          }}
        >
          {BaseGemTypes.map(gem => {
            if (!card.cost[gem]) return null;
            return (
              <div 
                key={gem} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  background: 'rgba(0,0,0,0.55)', 
                  padding: '1px 5px', 
                  borderRadius: '4px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
                }}
              >
                <div style={{ 
                  width: '10px', 
                  height: '10px', 
                  borderRadius: '50%', 
                  backgroundColor: GEM_COLORS[gem], 
                  border: '1px solid rgba(255,255,255,0.7)',
                  flexShrink: 0
                }} />
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '0.75rem', lineHeight: 1 }}>
                  {card.cost[gem]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Prominent BUY badge on bottom right if affordable */}
        {isMyTurn && canAfford && !isReserved && (
          <div 
            style={{ 
              position: 'absolute', 
              bottom: '4px', 
              right: '6px', 
              backgroundColor: '#fbbf24', 
              color: '#000', 
              fontSize: '0.65rem', 
              fontWeight: '900', 
              padding: '1px 5px', 
              borderRadius: '4px', 
              textTransform: 'uppercase', 
              letterSpacing: '0.5px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}
          >
            BUY
          </div>
        )}
      </div>
    );
  };
  const renderLogMessage = (log: string, defaultColorize: (m: string) => React.ReactNode) => {
    if (!log.includes('[')) return defaultColorize(log);
    
    const parts = log.split(/(\[[a-z]+\])/);
    return (
      <>
        {parts.map((part, i) => {
          if (part.startsWith('[') && part.endsWith(']')) {
            const gem = part.slice(1, -1) as GemType;
            if (GEM_COLORS[gem]) {
              return (
                <span key={i} className="splendor-log-gem" style={{ backgroundColor: GEM_COLORS[gem] }} title={gem} />
              );
            }
          }
          return <span key={i}>{defaultColorize(part)}</span>;
        })}
      </>
    );
  };

  const renderPlayerDetails = (pid: string) => {
    const player = gameState.players[pid];
    if (!player) return null;
    const bonuses: Record<string, number> = { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0 };
    player.cards.forEach(c => bonuses[c.bonus]++);
    const isMe = pid === myPlayerId;
    const isDiscarding = turnState === 'discard_tokens' && isMe && isMyTurn;

    return (
      <div className="splendor-player-details" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 'bold', fontSize: '1.25rem', color: player.score >= 15 ? '#22c55e' : '#fbbf24', textShadow: player.score >= 15 ? '0 0 10px #22c55e' : 'none' }}>{player.score} pts {player.score >= 15 && '👑'} {player.nobles && player.nobles.length > 0 && Array(player.nobles.length).fill('🏰').join('')}</div>
          {gameState.playerOrder[0] === pid && (
            <div style={{ backgroundColor: '#475569', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>▶️</span> Starting Player
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {BaseGemTypes.map(g => {
            const hasBonus = bonuses[g] > 0;
            const hasToken = player.gems[g] > 0;
            if (!hasBonus && !hasToken) return null;
            return (
              <div key={g} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '2px' }}>
                {hasBonus ? (
                  <div className="splendor-stat-bonus" title="Permanent Card Gem" style={{ backgroundColor: GEM_COLORS[g], color: g === 'diamond' ? 'black' : 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', boxSizing: 'border-box', width: '20px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 'bold' }}>
                    {bonuses[g]}
                  </div>
                ) : null}
                
                {hasToken ? (
                  <div className="splendor-stat-token" title="Current Token" style={{ backgroundColor: GEM_COLORS[g], color: g === 'diamond' ? 'black' : 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', boxSizing: 'border-box', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {player.gems[g]}
                  </div>
                ) : null}
              </div>
            );
          })}
          {player.gems.gold > 0 && (
             <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '2px' }}>
               
               <div className="splendor-stat-token" title="Gold Token" style={{ backgroundColor: GEM_COLORS['gold'], color: 'black', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', boxSizing: 'border-box', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  {player.gems.gold}
               </div>
             </div>
          )}
        </div>

        {player.reservedCards.length > 0 && (
          <div style={{ marginTop: '0.25rem' }}>
            <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>⏳</div>
            <div className="splendor-reserved-cards">
              {player.reservedCards.map((c, i) => <div key={i}>{renderCard(c, c.tier, true)}</div>)}
            </div>
          </div>
        )}
        
        {turnState === 'choose_noble' && isMyTurn && pid === myPlayerId && (
          <div className="splendor-noble-choice">
            <div className="splendor-noble-choice-title">Choose Noble:</div>
            <div className="splendor-noble-choice-btns">
              {gameState.eligibleNoblesForCurrentPlayer.map(n => (
                <button key={n.id} onClick={() => dispatch({ type: 'CHOOSE_NOBLE', payload: { nobleId: n.id } })} className="splendor-noble-btn">
                  {n.points} pts
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  
  const renderStats = () => {
    const sortedPlayers = [...gameState.playerOrder].sort((a, b) => gameState.players[b].score - gameState.players[a].score);

    const maxTurns = Math.max(...gameState.playerOrder.map(pid => gameState.players[pid].scoreHistory?.length || 0));
    const chartData: LineChartData[] = [];
    for (let i = 0; i < maxTurns; i++) {
      const point: LineChartData = { name: `${i + 1}` };
      gameState.playerOrder.forEach((pid, pIdx) => {
        const hist = gameState.players[pid].scoreHistory || [];
        const jitter = pIdx * 0.05;
        const val = hist[i] !== undefined ? hist[i] : (hist[hist.length - 1] || 0);
        point[gameState.players[pid].name] = val + jitter;
      });
      chartData.push(point);
    }

    const lines: LineConfig[] = gameState.playerOrder.map((pid, index) => ({
      key: gameState.players[pid].name,
      color: gameState.players[pid].color || PLAYER_COLORS[index % PLAYER_COLORS.length],
      name: gameState.players[pid].name,
      dot: false
    }));

    return (
      <div style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Game Summary</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', marginBottom: '30px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)' }}>
              <th style={{ textAlign: 'left', padding: '10px' }}>Player</th>
              <th style={{ textAlign: 'center', padding: '10px' }}>Points</th>
              <th style={{ textAlign: 'center', padding: '10px' }}>Cards</th>
              <th style={{ textAlign: 'center', padding: '10px' }}>Tokens Left</th>
              <th style={{ textAlign: 'center', padding: '10px' }}>Reserved Left</th>
              <th style={{ textAlign: 'center', padding: '10px' }}>Tokens Taken</th>
              <th style={{ textAlign: 'center', padding: '10px' }}>Cards Reserved</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map(pid => {
              const p = gameState.players[pid];
              const totalTokens = Object.values(p.gems).reduce((a, b) => a + b, 0);
              const pColor = p.color || PLAYER_COLORS[gameState.playerOrder.indexOf(pid) % PLAYER_COLORS.length];
              return (
                <tr key={pid} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: pColor }}>
                    {p.name} {pid === gameState.winnerId && '🏆'}
                  </td>
                  <td style={{ textAlign: 'center', padding: '10px', fontWeight: 'bold', color: '#fbbf24' }}>{p.score}</td>
                  <td style={{ textAlign: 'center', padding: '10px' }}>{p.cards.length}</td>
                  <td style={{ textAlign: 'center', padding: '10px' }}>{totalTokens}</td>
                  <td style={{ textAlign: 'center', padding: '10px' }}>{p.reservedCards.length}</td>
                  <td style={{ textAlign: 'center', padding: '10px' }}>{p.stats?.tokensCollected || 0}</td>
                  <td style={{ textAlign: 'center', padding: '10px' }}>{p.stats?.cardsReserved || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {chartData.length > 0 && (
          <LineChartWidget 
            title="Prestige Points Progression" 
            data={chartData} 
            lines={lines} 
            height={260} 
            hideLegend={true}
            yAxisWidth={35}
          />
        )}
      </div>
    );
  };

  const totalDiscardSelected = Object.values(discardSelection).reduce((a, b) => a + (b || 0), 0);
  const isDiscardReady = totalDiscardSelected === gameState.pendingDiscardCount;

  return (
    <GameLayout 
      gameName="Splendor" 
      helpText={`Splendor is an engaging chip-collecting and card development game. Players collect gemstone tokens to buy development cards that provide permanent gem bonuses and prestige points to attract visiting nobles. The first player to reach 15 points triggers the final round.\n\nVersion: v2.0 (Strict Unique Cards, Enhanced Layout & Stats)`} 
      helpUrl="https://en.wikipedia.org/wiki/Splendor_(board_game)"
      renderGameSpecificPlayerDetails={renderPlayerDetails}
      renderGameSpecificStats={renderStats}
      renderLogMessage={renderLogMessage}
    >
      {/* Interactive Discard Modal */}
      <Modal 
        isOpen={turnState === 'discard_tokens' && isMyTurn} 
        title="Discard Excess Tokens" 
        onClose={() => {}}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px' }}>
          <p style={{ margin: 0, fontSize: '1rem', color: '#cbd5e1' }}>
            You have more than 10 tokens! Please select <strong style={{ color: '#ef4444' }}>{gameState.pendingDiscardCount}</strong> token(s) to return to the bank.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {(Object.keys(gameState.players[myPlayerId]?.gems || {}) as GemType[]).map(gem => {
              const owned = gameState.players[myPlayerId]?.gems[gem] || 0;
              if (owned <= 0) return null;
              const discarded = discardSelection[gem] || 0;
              const canAdd = discarded < owned && totalDiscardSelected < gameState.pendingDiscardCount;
              const canSub = discarded > 0;

              return (
                <div key={gem} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', minWidth: '70px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: GEM_COLORS[gem], border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: gem === 'diamond' || gem === 'gold' ? 'black' : 'white' }}>
                    {owned}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button 
                      disabled={!canSub}
                      onClick={() => setDiscardSelection({ ...discardSelection, [gem]: discarded - 1 })}
                      style={{ width: '26px', height: '26px', borderRadius: '4px', border: 'none', background: canSub ? '#475569' : '#334155', color: 'white', cursor: canSub ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                    >
                      -
                    </button>
                    <span style={{ fontWeight: 'bold', minWidth: '16px', textAlign: 'center', color: discarded > 0 ? '#ef4444' : 'white' }}>
                      {discarded}
                    </span>
                    <button 
                      disabled={!canAdd}
                      onClick={() => setDiscardSelection({ ...discardSelection, [gem]: discarded + 1 })}
                      style={{ width: '26px', height: '26px', borderRadius: '4px', border: 'none', background: canAdd ? '#ef4444' : '#334155', color: 'white', cursor: canAdd ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                    >
                      +
                    </button>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>return: {discarded}</span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
            <span style={{ fontWeight: 'bold', color: isDiscardReady ? '#22c55e' : '#f59e0b' }}>
              Selected: {totalDiscardSelected} / {gameState.pendingDiscardCount}
            </span>
            <button 
              disabled={!isDiscardReady}
              onClick={() => {
                dispatch({ type: 'DISCARD_GEMS', payload: { gems: discardSelection } });
                setDiscardSelection({});
              }}
              style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: isDiscardReady ? '#ef4444' : '#475569', color: 'white', fontWeight: 'bold', cursor: isDiscardReady ? 'pointer' : 'not-allowed' }}
            >
              Confirm Discard
            </button>
          </div>
        </div>
      </Modal>

      {gameState.status === 'Lobby' ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white', fontSize: '1.25rem' }}>
          Waiting for the host to start the game...
        </div>
      ) : (
      <div className="splendor-board">
        {gameState.isFinalRound && gameState.status === 'Playing' && (<div style={{ position: "absolute", top: 0, left: 0, right: 0, background: "#ef4444", color: "white", textAlign: "center", padding: "4px", fontWeight: "bold", zIndex: 10, letterSpacing: "2px", animation: "pulseAffordable 2s infinite" }}>🚨 FINAL ROUND 🚨</div>)}
        
        <div className="splendor-left-col">
          <div className="splendor-panel">
            <h3 className="splendor-panel-title">Nobles</h3>
            <div className="splendor-nobles">
              {gameState.nobles.map(n => (
                <div key={n.id} className="splendor-noble">
                  <div style={{ fontWeight: 'bold' }}>{n.points} pts</div>
                  <div className="splendor-noble-reqs">
                    {BaseGemTypes.map(g => n.requirements[g] ? (
                      <div key={g} className="splendor-noble-req">
                        <div className="splendor-mini-token" style={{ backgroundColor: GEM_COLORS[g] }} />
                        <span>{n.requirements[g]}</span>
                      </div>
                    ) : null)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="splendor-panel splendor-bank-panel">
            <h3 className="splendor-panel-title">Bank</h3>
            <div className="splendor-bank-tokens">
              {(Object.keys(gameState.bank) as GemType[]).map(gem => (
                <div 
                  key={gem} 
                  onClick={() => handleGemClick(gem)}
                  className="splendor-token"
                  style={{ 
                    backgroundColor: GEM_COLORS[gem], 
                    color: gem === 'diamond' || gem === 'gold' ? 'black' : 'white', 
                    border: selectedGems[gem] ? '3px solid white' : '2px solid rgba(0,0,0,0.2)' 
                  }}
                >
                  {gameState.bank[gem]}
                  {selectedGems[gem] ? <div className="splendor-token-badge">{selectedGems[gem]}</div> : null}
                </div>
              ))}
            </div>
            {turnState === 'take_tokens' && isMyTurn && (
              <div className="splendor-actions">
                <button onClick={submitGems} className="splendor-btn take" disabled={!canTake}>Take</button>
                <button onClick={clearSelection} className="splendor-btn cancel" disabled={totalSelected === 0}>Cancel</button>
              </div>
            )}
          </div>
        </div>

        <div className="splendor-market">
          {(['tier3', 'tier2', 'tier1'] as const).map(tier => (
            <div key={tier} className="splendor-tier-row">
              <div 
                className="splendor-deck" 
                onClick={() => isMyTurn && dispatch({ type: 'RESERVE_CARD_DECK', payload: { tier: tier === 'tier1' ? 1 : tier === 'tier2' ? 2 : 3 } })}
              >
                {gameState.decks[tier].length} left
                {isMyTurn && turnState === 'take_tokens' && (
                  <div className="splendor-card-overlay">
                    <button className="splendor-card-btn reserve">Reserve</button>
                  </div>
                )}
              </div>
              <div className="splendor-cards-row">
                {gameState.board[tier].map((card, i) => (
                   <div key={i}>{renderCard(card, tier === 'tier1' ? 1 : tier === 'tier2' ? 2 : 3)}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
    </GameLayout>
  );
}
