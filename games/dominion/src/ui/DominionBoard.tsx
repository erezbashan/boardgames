import React, { useState } from 'react';
import { DominionState } from '../engine/types';
import { PlayerAction } from '../engine/actions';
import { getCardDef } from '../engine/cards';
import { GameLayout } from '@erez/boardgame-core';

interface Props {
  gameState: DominionState;
  myPlayerId: string;
  dispatch: (action: PlayerAction) => void;
  onLeaveGame: () => void;
}

export const DominionBoard: React.FC<Props> = ({ gameState, myPlayerId, dispatch, onLeaveGame }) => {
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  
  const me = gameState.players[myPlayerId];

  const isMyTurn = gameState.status === 'Playing' && gameState.playerOrder[gameState.currentPlayerIndex] === myPlayerId;
  const isInputPhase = gameState.pendingActions.length > 0 && gameState.pendingActions[0].type === 'REQUEST_INPUT';

  const handlePlayCard = (instanceId: string) => {
    if (!isMyTurn || isInputPhase) return;
    dispatch({ type: 'PLAY_CARD', playerId: myPlayerId, instanceId });
  };

  const handleBuyCard = (cardId: string) => {
    if (!isMyTurn || gameState.phase !== 'BUY') return;
    dispatch({ type: 'BUY_CARD', playerId: myPlayerId, cardId });
  };

  const handleEndPhase = () => {
    dispatch({ type: 'END_PHASE', playerId: myPlayerId });
  };

  const handleResolveInput = () => {
    const req = gameState.pendingActions[0];
    if (req?.type === 'REQUEST_INPUT' && req.inputType === 'DISCARD_FOR_CELLAR') {
      dispatch({ 
        type: 'RESOLVE_INPUT', 
        playerId: myPlayerId, 
        payload: { discardedIds: selectedCards } 
      });
      setSelectedCards([]);
    }
  };

  const toggleCardSelection = (instanceId: string) => {
    setSelectedCards(prev => 
      prev.includes(instanceId) ? prev.filter(id => id !== instanceId) : [...prev, instanceId]
    );
  };

  const renderGameArea = () => {
    if (!me) return <div style={{ color: 'white', padding: '40px' }}>Join the game to play...</div>;
    
    return (
      <div style={{ display: 'flex', gap: '20px', padding: '20px', height: '100%', boxSizing: 'border-box' }}>
        {/* Left Column: Supply */}
        <div style={{ minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ border: '1px solid #475569', padding: '15px', borderRadius: '8px', background: '#1e293b' }}>
            <h3 style={{ marginTop: 0, color: 'white' }}>Supply</h3>
            {Object.entries(gameState.supply).map(([cardId, count]) => {
              const def = getCardDef(cardId);
              return (
                <div key={cardId} style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', color: 'white' }}>
                  <button 
                    disabled={!isMyTurn || gameState.phase !== 'BUY' || me.coins < def.cost || me.buys <= 0 || count <= 0}
                    onClick={() => handleBuyCard(cardId)}
                    style={{ padding: '4px 8px', cursor: 'pointer', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px' }}
                  >
                    Buy {def.name} ({def.cost}$)
                  </button>
                  <span style={{ color: count === 0 ? 'red' : 'lightgray' }}>{count} left</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Game Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Status */}
          <div style={{ padding: '15px', background: isMyTurn ? '#064e3b' : '#1e293b', borderRadius: '8px', color: 'white' }}>
            <h3 style={{ marginTop: 0 }}>
              {isMyTurn ? "Your Turn" : `${gameState.players[gameState.playerOrder[gameState.currentPlayerIndex]]?.name || 'Waiting'}'s Turn`} 
              - Phase: {gameState.phase}
            </h3>
            <div style={{ display: 'flex', gap: '20px', fontSize: '18px', fontWeight: 'bold' }}>
              <span>⚡ Actions: {me.actions}</span>
              <span>🛒 Buys: {me.buys}</span>
              <span>💰 Coins: {me.coins}</span>
            </div>
            
            {isMyTurn && !isInputPhase && (
              <button onClick={handleEndPhase} style={{ marginTop: '15px', padding: '8px 16px', background: '#eab308', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                {gameState.phase === 'ACTION' ? 'Skip to Buy Phase' : 'End Turn'}
              </button>
            )}

            {isInputPhase && gameState.pendingActions[0]?.playerId === myPlayerId && (
              <div style={{ marginTop: '15px', padding: '15px', background: '#7f1d1d', border: '2px solid #ef4444', borderRadius: '8px' }}>
                <strong>⚠️ Action Required: </strong> 
                {gameState.pendingActions[0]?.type === 'REQUEST_INPUT' && gameState.pendingActions[0].inputType === 'DISCARD_FOR_CELLAR' ? 'Select cards to discard for Cellar.' : 'Waiting for input...'}
                <button onClick={handleResolveInput} style={{ marginLeft: '15px', padding: '4px 12px' }}>Confirm Selection</button>
              </div>
            )}
          </div>
          
          {/* Play Area */}
          <div style={{ border: '1px solid #475569', padding: '15px', minHeight: '120px', borderRadius: '8px', background: '#0f172a' }}>
            <h3 style={{ marginTop: 0, color: 'white' }}>Play Area</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {me.playArea.map(card => {
                const def = getCardDef(card.cardId);
                return (
                  <div key={card.id} style={{ border: '1px solid #64748b', padding: '8px', background: '#334155', color: 'white', borderRadius: '4px' }}>
                    {def.name}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hand */}
          <div style={{ border: '1px solid #475569', padding: '15px', flex: 1, borderRadius: '8px', background: '#1e293b' }}>
            <h3 style={{ marginTop: 0, color: 'white' }}>Your Hand ({me.hand.length})</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {me.hand.map(card => {
                const def = getCardDef(card.cardId);
                const isSelected = selectedCards.includes(card.id);
                return (
                  <div 
                    key={card.id} 
                    style={{ 
                      border: `2px solid ${isSelected ? '#3b82f6' : '#64748b'}`, 
                      padding: '10px', 
                      width: '100px', 
                      cursor: 'pointer',
                      background: isSelected ? '#1e3a8a' : '#334155',
                      color: 'white',
                      borderRadius: '6px',
                      userSelect: 'none'
                    }}
                    onClick={() => {
                      if (isInputPhase) toggleCardSelection(card.id);
                      else handlePlayCard(card.id);
                    }}
                  >
                    <strong>{def.name}</strong><br/>
                    <small style={{ color: '#94a3b8' }}>{def.types.join(', ')}</small>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Deck info */}
          <div style={{ display: 'flex', gap: '20px', color: 'white' }}>
            <div>Deck: {me.deck.length} cards</div>
            <div>Discard: {me.discard.length} cards</div>
            <div>Victory Points: {me.victoryPoints}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <GameLayout
      gameName="Dominion"
      helpText="Build your deck and collect Victory Points! First to buy Provinces or empty 3 piles wins."
      helpUrl="https://en.wikipedia.org/wiki/Dominion_(card_game)"
    >
      {gameState.status === 'Lobby' ? (
        <div style={{ color: 'white', padding: '40px', textAlign: 'center' }}>
          <h2>Waiting in Lobby...</h2>
          <p>Once players have joined, click Start Game.</p>
        </div>
      ) : (
        renderGameArea()
      )}
    </GameLayout>
  );
};
