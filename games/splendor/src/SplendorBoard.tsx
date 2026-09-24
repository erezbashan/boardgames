import React, { useState } from 'react';
import { SplendorGameState, SplendorAction, GemType, BaseGemTypes, Card } from './types';
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

  const handleGemClick = (gem: GemType) => {
    if (!isMyTurn) return;
    
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
    if (!card) return <div className="splendor-card-empty" />;
    
    return (
      <div className="splendor-card" style={{ backgroundColor: GEM_COLORS[card.bonus] }}>
        <div className="splendor-card-header">
          <div className="splendor-card-points">{card.points > 0 ? card.points : ''}</div>
          <div className="splendor-card-bonus" />
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
            <button onClick={() => isReserved ? buyReserved(card.id) : buyCard(tier, card.id)} className="splendor-card-btn buy">Buy</button>
            {!isReserved && <button onClick={() => reserveCard(tier, card.id)} className="splendor-card-btn reserve">Reserve</button>}
          </div>
        )}
      </div>
    );
  };

  return (
    <GameLayout gameName="Splendor" helpText="Collect gems to buy cards and gain points." helpUrl="">
      {gameState.status === 'Lobby' ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white', fontSize: '1.25rem' }}>
          Waiting for the host to start the game...
        </div>
      ) : (
      <div className="splendor-board">
        
        <div className="splendor-top-area">
          <div className="splendor-panel">
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
                    border: selectedGems[gem] ? '3px solid white' : 'none' 
                  }}
                >
                  {gameState.bank[gem]}
                  {selectedGems[gem] ? <div className="splendor-token-badge">{selectedGems[gem]}</div> : null}
                </div>
              ))}
            </div>
            {Object.keys(selectedGems).length > 0 && turnState === 'take_tokens' && (
              <div className="splendor-actions">
                <button onClick={submitGems} className="splendor-btn take">Take</button>
                <button onClick={clearSelection} className="splendor-btn cancel">Cancel</button>
              </div>
            )}
            {turnState === 'discard_tokens' && isMyTurn && (
              <div style={{ marginTop: '0.5rem', color: '#f87171', fontWeight: 'bold' }}>
                Discard {gameState.pendingDiscardCount} tokens...
              </div>
            )}
          </div>

          <div className="splendor-panel">
            <h3 className="splendor-panel-title">Nobles</h3>
            <div className="splendor-nobles">
              {gameState.nobles.map(n => (
                <div key={n.id} className="splendor-noble">
                  <div style={{ fontWeight: 'bold' }}>{n.points}</div>
                  <div className="splendor-noble-reqs">
                    {BaseGemTypes.map(g => n.requirements[g] ? (
                      <div key={g} className="splendor-mini-token" style={{ backgroundColor: GEM_COLORS[g] }} />
                    ) : null)}
                  </div>
                </div>
              ))}
            </div>
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
              </div>
              <div className="splendor-cards-row">
                {gameState.board[tier].map((card, i) => (
                   <div key={i}>{renderCard(card, tier === 'tier1' ? 1 : tier === 'tier2' ? 2 : 3)}</div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="splendor-players-grid">
          {gameState.playerOrder.map(pid => {
            const player = gameState.players[pid];
            if (!player) return null;
            const bonuses: Record<string, number> = { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0 };
            player.cards.forEach(c => bonuses[c.bonus]++);

            return (
              <div key={pid} className={`splendor-player-card ${pid === gameState.playerOrder[gameState.currentPlayerIndex] ? 'active' : ''}`}>
                <div className="splendor-player-header">
                  <h3 className="splendor-player-name">
                    <span className="splendor-mini-token" style={{ backgroundColor: player.color }} />
                    {player.name}
                  </h3>
                  <div className="splendor-player-score">{player.score} pts</div>
                </div>
                
                <div className="splendor-player-stats">
                  <div className="splendor-stat-group">
                    <div className="splendor-stat-title">Tokens</div>
                    <div className="splendor-stat-tokens">
                      {(Object.keys(player.gems) as GemType[]).map(g => player.gems[g] > 0 && (
                        <div key={g} className="splendor-stat-token" style={{ backgroundColor: GEM_COLORS[g], color: g === 'diamond' || g === 'gold' ? 'black' : 'white' }}>
                          {player.gems[g]}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="splendor-stat-group">
                    <div className="splendor-stat-title">Bonuses</div>
                    <div className="splendor-stat-tokens">
                      {BaseGemTypes.map(g => bonuses[g] > 0 && (
                        <div key={g} className="splendor-stat-bonus" style={{ backgroundColor: GEM_COLORS[g] }}>
                          {bonuses[g]}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {player.reservedCards.length > 0 && (
                  <div className="splendor-reserved-group">
                    <div className="splendor-stat-title">Reserved</div>
                    <div className="splendor-reserved-cards">
                      {player.reservedCards.map((c, i) => <div key={i}>{renderCard(c, c.tier, true)}</div>)}
                    </div>
                  </div>
                )}
                
                {turnState === 'choose_noble' && isMyTurn && pid === myPlayerId && (
                  <div className="splendor-noble-choice">
                    <div className="splendor-noble-choice-title">Choose a Noble to visit you:</div>
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
          })}
        </div>
      </div>
      )}
    </GameLayout>
  );
};
