import React, { useState } from 'react';
import { SplendorGameState, SplendorAction, GemType, BaseGemTypes, Card } from './types';
import { GameLayout, useGameContext } from '@erez/boardgame-core';

const GEM_COLORS: Record<GemType, string> = {
  diamond: '#e2e8f0', // silver/white
  sapphire: '#3b82f6', // blue
  emerald: '#10b981', // green
  ruby: '#ef4444', // red
  onyx: '#1f2937', // black
  gold: '#eab308' // yellow
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
      if (gameState.bank[gem] <= current) return; // not enough in bank
      
      const newSelected = { ...selectedGems, [gem]: current + 1 };
      
      let total = 0;
      let hasTwo = false;
      for (const g of BaseGemTypes) {
        if (newSelected[g] === 2) hasTwo = true;
        total += newSelected[g] || 0;
      }
      
      if (hasTwo && total > 2) return; // can't mix taking 2 and taking 1
      if (!hasTwo && total > 3) return; // max 3 diff
      if (newSelected[gem] === 2 && gameState.bank[gem] < 4) return; // need 4 in bank to take 2

      setSelectedGems(newSelected);
    } else if (turnState === 'discard_tokens') {
      const playerGems = gameState.players[myPlayerId].gems;
      const currentDiscarded = selectedGems[gem] || 0;
      if (playerGems[gem] <= currentDiscarded) return; // don't have enough to discard
      
      const newSelected = { ...selectedGems, [gem]: currentDiscarded + 1 };
      let totalDiscarded = 0;
      Object.values(newSelected).forEach(v => totalDiscarded += (v || 0));
      
      setSelectedGems(newSelected);
      
      // Auto submit if we reached pending discard count
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
    if (!card) return <div className="w-24 h-32 border-2 border-dashed border-gray-600 rounded-lg" />;
    
    return (
      <div className="w-24 h-32 rounded-lg p-2 flex flex-col justify-between relative shadow-lg" style={{ backgroundColor: GEM_COLORS[card.bonus] }}>
        <div className="flex justify-between items-start">
          <div className="text-xl font-bold text-white drop-shadow-md">{card.points > 0 ? card.points : ''}</div>
          <div className="w-4 h-4 rounded-full bg-white shadow-inner" />
        </div>
        
        <div className="flex flex-col gap-1 bg-black/40 p-1 rounded">
          {BaseGemTypes.map(gem => {
            if (!card.cost[gem]) return null;
            return (
              <div key={gem} className="flex items-center justify-between text-xs font-bold text-white">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GEM_COLORS[gem] }} />
                {card.cost[gem]}
              </div>
            );
          })}
        </div>

        {isMyTurn && turnState === 'take_tokens' && (
          <div className="absolute inset-0 bg-black/80 opacity-0 hover:opacity-100 flex flex-col items-center justify-center gap-2 rounded-lg transition-opacity">
            <button onClick={() => isReserved ? buyReserved(card.id) : buyCard(tier, card.id)} className="bg-blue-500 text-white text-xs px-2 py-1 rounded">Buy</button>
            {!isReserved && <button onClick={() => reserveCard(tier, card.id)} className="bg-yellow-500 text-white text-xs px-2 py-1 rounded">Reserve</button>}
          </div>
        )}
      </div>
    );
  };

  return (
    <GameLayout gameName="Splendor" helpText="Collect gems to buy cards and gain points. First to 15 wins." helpUrl="">
      {gameState.status === 'Lobby' ? (
        <div className="flex items-center justify-center h-full text-white text-xl">Waiting for the host to start the game...</div>
      ) : (
      <div className="flex flex-col h-full overflow-y-auto p-4 gap-6 text-white bg-slate-900">
        
        {/* Top Area: Bank & Nobles */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 bg-slate-800 p-4 rounded-xl">
            <h3 className="text-lg font-bold mb-2">Bank</h3>
            <div className="flex gap-2">
              {(Object.keys(gameState.bank) as GemType[]).map(gem => (
                <div 
                  key={gem} 
                  onClick={() => handleGemClick(gem)}
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg cursor-pointer shadow-md relative"
                  style={{ backgroundColor: GEM_COLORS[gem], color: gem === 'diamond' || gem === 'gold' ? 'black' : 'white', border: selectedGems[gem] ? '3px solid white' : 'none' }}
                >
                  {gameState.bank[gem]}
                  {selectedGems[gem] ? <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{selectedGems[gem]}</div> : null}
                </div>
              ))}
            </div>
            {Object.keys(selectedGems).length > 0 && turnState === 'take_tokens' && (
              <div className="mt-4 flex gap-2">
                <button onClick={submitGems} className="bg-green-500 px-4 py-1 rounded">Take</button>
                <button onClick={clearSelection} className="bg-gray-500 px-4 py-1 rounded">Cancel</button>
              </div>
            )}
            {turnState === 'discard_tokens' && isMyTurn && (
              <div className="mt-2 text-red-400 font-bold">Discard {gameState.pendingDiscardCount} tokens...</div>
            )}
          </div>

          <div className="flex-1 bg-slate-800 p-4 rounded-xl">
            <h3 className="text-lg font-bold mb-2">Nobles</h3>
            <div className="flex gap-2 flex-wrap">
              {gameState.nobles.map(n => (
                <div key={n.id} className="w-16 h-16 bg-yellow-800 rounded-lg p-1 flex flex-col justify-between text-xs shadow-md">
                  <div className="font-bold">{n.points}</div>
                  <div className="flex flex-wrap gap-1">
                    {BaseGemTypes.map(g => n.requirements[g] ? (
                      <div key={g} className="w-3 h-3 rounded-full" style={{ backgroundColor: GEM_COLORS[g] }} />
                    ) : null)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Board Cards */}
        <div className="bg-slate-800 p-4 rounded-xl flex flex-col gap-4">
          {(['tier3', 'tier2', 'tier1'] as const).map(tier => (
            <div key={tier} className="flex gap-4 items-center">
              <div className="w-20 h-28 bg-slate-700 rounded-lg flex items-center justify-center text-sm font-bold shadow-inner cursor-pointer" onClick={() => isMyTurn && dispatch({ type: 'RESERVE_CARD_DECK', payload: { tier: tier === 'tier1' ? 1 : tier === 'tier2' ? 2 : 3 } })}>
                {gameState.decks[tier].length} left
              </div>
              <div className="flex gap-4">
                {gameState.board[tier].map((card, i) => (
                   <div key={i}>{renderCard(card, tier === 'tier1' ? 1 : tier === 'tier2' ? 2 : 3)}</div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Players Area */}
        <div className="grid grid-cols-2 gap-4">
          {gameState.playerOrder.map(pid => {
            const player = gameState.players[pid];
            if (!player) return null;
            const bonuses: Record<string, number> = { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0 };
            player.cards.forEach(c => bonuses[c.bonus]++);

            return (
              <div key={pid} className={`p-4 rounded-xl \${pid === gameState.playerOrder[gameState.currentPlayerIndex] ? 'ring-2 ring-yellow-400 bg-slate-750' : 'bg-slate-800'}`}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: player.color }} />
                    {player.name}
                  </h3>
                  <div className="text-xl font-bold">{player.score} pts</div>
                </div>
                
                <div className="flex gap-4 mb-2">
                  <div className="flex-1">
                    <div className="text-xs text-gray-400 mb-1">Tokens</div>
                    <div className="flex flex-wrap gap-1">
                      {(Object.keys(player.gems) as GemType[]).map(g => player.gems[g] > 0 && (
                        <div key={g} className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: GEM_COLORS[g], color: g === 'diamond' || g === 'gold' ? 'black' : 'white' }}>
                          {player.gems[g]}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-400 mb-1">Bonuses</div>
                    <div className="flex flex-wrap gap-1">
                      {BaseGemTypes.map(g => bonuses[g] > 0 && (
                        <div key={g} className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold" style={{ backgroundColor: GEM_COLORS[g] }}>
                          {bonuses[g]}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {player.reservedCards.length > 0 && (
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Reserved</div>
                    <div className="flex gap-2 scale-75 origin-top-left">
                      {player.reservedCards.map((c, i) => <div key={i}>{renderCard(c, c.tier, true)}</div>)}
                    </div>
                  </div>
                )}
                
                {turnState === 'choose_noble' && isMyTurn && pid === myPlayerId && (
                  <div className="mt-2 p-2 bg-yellow-900 rounded">
                    <div className="font-bold mb-1">Choose a Noble to visit you:</div>
                    <div className="flex gap-2">
                      {gameState.eligibleNoblesForCurrentPlayer.map(n => (
                        <button key={n.id} onClick={() => dispatch({ type: 'CHOOSE_NOBLE', payload: { nobleId: n.id } })} className="bg-yellow-600 px-2 py-1 rounded text-sm">
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
