import React, { useState } from 'react';
import { SplendorGameState, SplendorAction, GemType, BaseGemTypes, Card } from './types';
import { calculatePayment } from './reducer';
import { GameLayout, useGameContext } from '@erez/boardgame-core';
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
    
    return (
      <div className="splendor-card" style={{ backgroundColor: GEM_COLORS[card.bonus] }}>
        <div className="splendor-card-header">
          <div className="splendor-card-points">{card.points > 0 ? card.points : ''}</div>
          
        </div>
        
        <div className="splendor-card-costs">
          {BaseGemTypes.map(gem => {
            if (!card.cost[gem]) return null;
            return (
              <div key={gem} className="splendor-card-cost">
                <div className="splendor-mini-token" style={{ backgroundColor: GEM_COLORS[gem] }} />
                {card.cost[gem]}
              </div>
            );
          })}
        </div>

        {isMyTurn && turnState === 'take_tokens' && (
          <div className="splendor-card-overlay">
            <button onClick={() => isReserved ? buyReserved(card.id) : buyCard(tier, card.id)} className="splendor-card-btn buy" disabled={!canAfford}>Buy</button>
            {!isReserved && <button onClick={() => reserveCard(tier, card.id)} className="splendor-card-btn reserve">Reserve</button>}
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

    return (
      <div className="splendor-player-details">
        <div style={{ fontWeight: 'bold', fontSize: '1.25rem', color: '#fbbf24' }}>{player.score} pts</div>
        
        <div>
          
          <div className="splendor-stat-tokens">
            {(Object.keys(player.gems) as GemType[]).map(g => player.gems[g] > 0 && (
              <div key={g} className="splendor-stat-token" title="Current Token" style={{ backgroundColor: GEM_COLORS[g], color: g === 'diamond' || g === 'gold' ? 'black' : 'white' }}>
                {player.gems[g]}
              </div>
            ))}
          </div>
        </div>

        <div>
          
          <div className="splendor-stat-tokens">
            {BaseGemTypes.map(g => bonuses[g] > 0 && (
              <div key={g} className="splendor-stat-bonus" title="Permanent Card Gem" style={{ backgroundColor: GEM_COLORS[g], color: g === 'diamond' ? 'black' : 'white' }}>
                {bonuses[g]}
              </div>
            ))}
          </div>
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

  return (
    <GameLayout 
      gameName="Splendor" 
      helpText="Collect gems to buy cards and gain points." 
      helpUrl=""
      renderGameSpecificPlayerDetails={renderPlayerDetails}
      renderLogMessage={renderLogMessage}
    >
      {gameState.status === 'Lobby' ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white', fontSize: '1.25rem' }}>
          Waiting for the host to start the game...
        </div>
      ) : (
      <div className="splendor-board">
        
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
            {turnState === 'discard_tokens' && isMyTurn && (
              <div style={{ marginTop: '0.5rem', color: '#fca5a5', fontWeight: 'bold' }}>
                Discard {gameState.pendingDiscardCount} tokens...
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
