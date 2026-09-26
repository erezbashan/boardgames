import React, { useState } from 'react';
import { GameLayout } from '@erez/boardgame-core';
import { DominionState } from '../engine/types';
import { PlayerAction } from '../engine/actions';
import { getCardDef, Cards } from '../engine/cards';
import { CardDefinition, CardType } from '../engine/cards/types';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  gameState: DominionState;
  myPlayerId: string;
  dispatch: (action: PlayerAction) => void;
  onLeaveGame: () => void;
}

const CARD_IMAGES: Record<string, string> = {
  "copper": "https://wiki.dominionstrategy.com/images/thumb/f/fb/Copper.jpg/200px-Copper.jpg",
  "silver": "https://wiki.dominionstrategy.com/images/thumb/5/5d/Silver.jpg/200px-Silver.jpg",
  "gold": "https://wiki.dominionstrategy.com/images/thumb/5/50/Gold.jpg/200px-Gold.jpg",
  "estate": "https://wiki.dominionstrategy.com/images/thumb/9/91/Estate.jpg/200px-Estate.jpg",
  "duchy": "https://wiki.dominionstrategy.com/images/thumb/4/4a/Duchy.jpg/200px-Duchy.jpg",
  "province": "https://wiki.dominionstrategy.com/images/thumb/8/81/Province.jpg/200px-Province.jpg",
  "curse": "https://wiki.dominionstrategy.com/images/thumb/9/97/Curse.jpg/200px-Curse.jpg",
  "village": "https://wiki.dominionstrategy.com/images/thumb/5/5a/Village.jpg/200px-Village.jpg",
  "smithy": "https://wiki.dominionstrategy.com/images/thumb/3/36/Smithy.jpg/200px-Smithy.jpg",
  "woodcutter": "https://wiki.dominionstrategy.com/images/thumb/d/d6/Woodcutter.jpg/200px-Woodcutter.jpg",
  "cellar": "https://wiki.dominionstrategy.com/images/thumb/1/1c/Cellar.jpg/200px-Cellar.jpg",
  "market": "https://wiki.dominionstrategy.com/images/thumb/7/7e/Market.jpg/200px-Market.jpg",
  "festival": "https://wiki.dominionstrategy.com/images/thumb/e/ec/Festival.jpg/200px-Festival.jpg",
  "laboratory": "https://wiki.dominionstrategy.com/images/thumb/0/0c/Laboratory.jpg/200px-Laboratory.jpg",
  "council_room": "https://wiki.dominionstrategy.com/images/thumb/e/e0/Council_Room.jpg/200px-Council_Room.jpg",
  "moat": "https://wiki.dominionstrategy.com/images/thumb/f/fe/Moat.jpg/200px-Moat.jpg",
  "bazaar": "https://wiki.dominionstrategy.com/images/thumb/f/f7/Bazaar.jpg/200px-Bazaar.jpg"
};

const getIcon = (types: CardType[]) => {
  if (types.includes('VICTORY')) return '🟢';
  if (types.includes('TREASURE')) return '💰';
  if (types.includes('ATTACK')) return '⚔️';
  if (types.includes('ACTION')) return '⚡️';
  return '🃏';
};

const getTreasureValue = (def: CardDefinition) => {
  if (def.name === 'Gold') return 3;
  if (def.name === 'Silver') return 2;
  if (def.name === 'Copper') return 1;
  return 0;
};

// Helper to group cards by type for stacking
function groupCards(cards: any[]) {
  const groups: { cardId: string, instances: any[] }[] = [];
  cards.forEach(c => {
    let g = groups.find(x => x.cardId === c.cardId);
    if (!g) {
      g = { cardId: c.cardId, instances: [] };
      groups.push(g);
    }
    g.instances.push(c);
  });
  return groups;
}

export const DominionBoard: React.FC<Props> = ({ gameState, myPlayerId, dispatch, onLeaveGame }) => {
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [hoveredCardDef, setHoveredCardDef] = useState<CardDefinition | null>(null);
  const [popupPos, setPopupPos] = useState<{x: number, y: number} | null>(null);
  
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

  const renderPlayerDetails = (playerId: string) => {
    const p = gameState.players[playerId];
    if (!p) return null;
    return (
      <div style={{ fontSize: '12px', color: '#cbd5e1', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '4px', marginTop: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>VP:</span> <strong style={{ color: '#fbbf24' }}>{p.victoryPoints}</strong></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cards:</span> <strong>{p.deck.length + p.discard.length + p.hand.length + p.playArea.length}</strong></div>
      </div>
    );
  };

  const showPopup = (e: React.MouseEvent, def: CardDefinition) => {
    setHoveredCardDef(def);
    setPopupPos({ x: e.clientX, y: e.clientY });
  };

  const hidePopup = () => {
    setHoveredCardDef(null);
    setPopupPos(null);
  };

  const renderCard = (card: any, index: number, onClick?: () => void, isSelected?: boolean, compact?: boolean) => {
    const def = getCardDef(card.cardId);
    const imageUrl = CARD_IMAGES[card.cardId];
    return (
      <motion.div 
        layout
        layoutId={card.id}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ 
          type: 'spring', 
          stiffness: 300, 
          damping: 25, 
          delay: index * 0.1 // Slower stagger for nice effect
        }}
        key={card.id} 
        style={{ 
          border: `2px solid ${isSelected ? '#3b82f6' : 'rgba(100,116,139,0.5)'}`, 
          padding: '4px', 
          width: '90px', 
          height: '130px',
          cursor: onClick ? 'pointer' : 'default',
          background: isSelected ? '#1e3a8a' : '#1e293b',
          color: 'white',
          borderRadius: '8px',
          userSelect: 'none',
          boxShadow: compact ? '2px 2px 5px rgba(0,0,0,0.5)' : '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
        onClick={onClick}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'rgba(0,0,0,0.7)', padding: '2px 4px', borderRadius: '4px' }}>
          <strong style={{ fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{def.name}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div 
            style={{ width: '22px', height: '22px', background: 'rgba(255,255,255,0.95)', borderRadius: '50%', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', cursor: 'help', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
            onMouseEnter={(e) => showPopup(e, def)}
            onMouseLeave={hidePopup}
          >?</div>
        </div>
      </motion.div>
    );
  };

  const renderCardGroup = (group: {cardId: string, instances: any[]}, groupIndex: number, area: 'hand' | 'play') => {
    return (
      <div key={group.cardId} style={{ position: 'relative', width: `${90 + (group.instances.length - 1) * 25}px`, height: '130px', marginRight: '5px' }}>
        <AnimatePresence mode="popLayout">
          {group.instances.map((card, idx) => (
            <div key={card.id} style={{ position: 'absolute', left: `${idx * 25}px`, top: 0, zIndex: idx }}>
              {renderCard(card, groupIndex * 5 + idx, () => {
                if (area === 'hand') {
                  if (isInputPhase) toggleCardSelection(card.id);
                  else handlePlayCard(card.id);
                }
              }, selectedCards.includes(card.id), true)}
            </div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  const renderLogMessage = (msg: string, defaultRenderer: (m: string) => React.ReactNode) => {
    const regex = /\[([a-zA-Z ]+)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    const nameMap = Object.values(Cards).reduce((acc, def) => {
      acc[def.name.toLowerCase()] = def;
      return acc;
    }, {} as Record<string, CardDefinition>);

    while ((match = regex.exec(msg)) !== null) {
      if (match.index > lastIndex) {
        parts.push(msg.substring(lastIndex, match.index));
      }
      const cardName = match[1];
      const def = nameMap[cardName.toLowerCase()];
      if (def) {
        parts.push(
          <span 
            key={match.index}
            style={{ color: '#60a5fa', cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }}
            onMouseEnter={(e) => showPopup(e, def)}
            onMouseLeave={hidePopup}
          >
            {cardName}
          </span>
        );
      } else {
        parts.push(match[0]);
      }
      lastIndex = regex.lastIndex;
    }
    
    if (lastIndex < msg.length) {
      parts.push(msg.substring(lastIndex));
    }
    
    if (parts.length === 1 && typeof parts[0] === 'string') {
      return defaultRenderer(msg);
    }
    
    return <span>{parts.map((p, i) => <React.Fragment key={i}>{typeof p === 'string' ? defaultRenderer(p) : p}</React.Fragment>)}</span>;
  };

  const renderGameArea = () => {
    if (!me) return <div style={{ color: 'white', padding: '40px' }}>Join the game to play...</div>;
    
    const handTreasuresValue = me.hand.reduce((sum, c) => sum + getTreasureValue(getCardDef(c.cardId)), 0);
    const potentialPower = me.coins + handTreasuresValue;

    const supplyEntries = Object.entries(gameState.supply).map(([id, count]) => ({ id, count, def: getCardDef(id) }));
    const victorySupply = supplyEntries.filter(s => s.def.types.includes('VICTORY')).sort((a,b) => b.def.cost - a.def.cost);
    const treasureSupply = supplyEntries.filter(s => s.def.types.includes('TREASURE')).sort((a,b) => b.def.cost - a.def.cost);
    const kingdomSupply = supplyEntries.filter(s => !s.def.types.includes('VICTORY') && !s.def.types.includes('TREASURE')).sort((a,b) => b.def.cost - a.def.cost);

    const renderSupplySection = (items: typeof supplyEntries) => (
      <div style={{ marginBottom: '8px' }}>
        {items.map(({ id, count, def }) => {
          const canAfford = potentialPower >= def.cost;
          const disabled = !isMyTurn || gameState.phase !== 'BUY' || me.buys <= 0 || count <= 0 || me.coins < def.cost;
          
          return (
            <div key={id} style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', color: 'white', alignItems: 'center' }}>
              <button 
                disabled={disabled}
                onClick={() => handleBuyCard(id)}
                style={{ 
                  padding: '6px 10px', 
                  cursor: disabled ? 'not-allowed' : 'pointer', 
                  background: disabled ? '#334155' : (canAfford ? '#2563eb' : '#3b82f6'), 
                  color: disabled ? '#64748b' : 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flex: 1,
                  marginRight: '10px',
                  transition: 'background 0.2s',
                  position: 'relative'
                }}
              >
                <span 
                  onMouseEnter={(e) => showPopup(e, def)}
                  onMouseLeave={hidePopup}
                  style={{ cursor: 'help', marginRight: '4px', fontSize: '14px', background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px' }}
                >?</span>
                <span>{getIcon(def.types)}</span>
                <span style={{ fontWeight: 'bold' }}>{def.name}</span>
                <span style={{ marginLeft: 'auto', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>{def.cost}$</span>
              </button>
              <div style={{ position: 'relative' }}>
                <span style={{ color: count === 0 ? '#ef4444' : '#cbd5e1', fontSize: '14px', width: '45px', textAlign: 'right', display: 'inline-block' }}>
                  {count} left
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
    
    return (
      <div style={{ display: 'flex', gap: '20px', padding: '20px', height: '100%', boxSizing: 'border-box' }}>
        {/* Hover Popup - Renders Full Card Image */}
        {hoveredCardDef && popupPos && (
          <div style={{
            position: 'fixed',
            left: Math.min(popupPos.x + 15, window.innerWidth - 260),
            top: Math.max(10, Math.min(popupPos.y - 150, window.innerHeight - 380)),
            width: '240px',
            background: '#0f172a',
            border: '2px solid #cbd5e1',
            borderRadius: '12px',
            padding: '12px',
            color: 'white',
            zIndex: 9999,
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            pointerEvents: 'none'
          }}>
            {CARD_IMAGES[hoveredCardDef.id] ? (
              <img src={CARD_IMAGES[hoveredCardDef.id]} alt={hoveredCardDef.name} style={{ width: '100%', borderRadius: '8px', marginBottom: '8px' }} />
            ) : (
              <div style={{ height: '300px', background: '#334155', borderRadius: '8px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Image</div>
            )}
            <h4 style={{ margin: '0 0 8px 0', borderBottom: '1px solid #475569', paddingBottom: '4px', fontSize: '18px' }}>
              {hoveredCardDef.name} <span style={{ float: 'right', color: '#fbbf24' }}>{hoveredCardDef.cost}$</span>
            </h4>
            <div style={{ fontSize: '14px', lineHeight: '1.5' }}>{hoveredCardDef.description}</div>
          </div>
        )}

        {/* Left Column: Supply */}
        <div style={{ minWidth: '340px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', paddingRight: '10px' }}>
          <div style={{ border: '1px solid #475569', padding: '15px', borderRadius: '8px', background: '#1e293b' }}>
            <h3 style={{ marginTop: 0, color: 'white', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>Supply Market</h3>
            {renderSupplySection(victorySupply)}
            {renderSupplySection(treasureSupply)}
            {renderSupplySection(kingdomSupply)}
          </div>
        </div>

        {/* Right Column: Game Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Status */}
          <div style={{ padding: '15px', background: isMyTurn ? '#064e3b' : '#1e293b', borderRadius: '8px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
            <div>
              <h3 style={{ marginTop: 0, marginBottom: '10px', color: isMyTurn ? '#34d399' : 'white' }}>
                {isMyTurn ? "Your Turn" : `${gameState.players[gameState.playerOrder[gameState.currentPlayerIndex]]?.name || 'Waiting'}'s Turn`} 
                - Phase: {gameState.phase}
              </h3>
              <div style={{ display: 'flex', gap: '20px', fontSize: '18px', fontWeight: 'bold' }}>
                <span>⚡ Available Actions: {me.actions}</span>
                <span>🛒 Available Buys: {me.buys}</span>
                <span>💰 Available Coins: {me.coins} <span style={{fontSize: '14px', color: '#a7f3d0'}}>(Potential: {potentialPower})</span></span>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
              {isMyTurn && !isInputPhase && (
                <button onClick={handleEndPhase} style={{ padding: '10px 20px', background: '#eab308', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>
                  {gameState.phase === 'ACTION' ? 'Skip to Buy Phase' : 'End Turn'}
                </button>
              )}
            </div>
          </div>
          
          {isInputPhase && gameState.pendingActions[0]?.playerId === myPlayerId && (
            <div style={{ padding: '15px', background: '#7f1d1d', border: '2px solid #ef4444', borderRadius: '8px', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
              <strong style={{ fontSize: '18px' }}>⚠️ Action Required: </strong> 
              {gameState.pendingActions[0]?.type === 'REQUEST_INPUT' && gameState.pendingActions[0].inputType === 'DISCARD_FOR_CELLAR' ? 'Select cards to discard for Cellar.' : 'Waiting for input...'}
              <button onClick={handleResolveInput} style={{ marginLeft: '15px', padding: '6px 16px', background: 'white', color: '#7f1d1d', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Confirm Selection</button>
            </div>
          )}
          
          {/* Play Area */}
          <div style={{ border: '1px solid #475569', padding: '15px', minHeight: '180px', borderRadius: '8px', background: '#0f172a' }}>
            <h3 style={{ marginTop: 0, color: '#94a3b8' }}>Play Area</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {groupCards(me.playArea).map((group, i) => renderCardGroup(group, i, 'play'))}
            </div>
          </div>

          {/* Hand & Decks */}
          <div style={{ border: '1px solid #475569', padding: '15px', flex: 1, borderRadius: '8px', background: '#1e293b', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginTop: 0, color: 'white' }}>Your Cards</h3>
            
            <div style={{ display: 'flex', gap: '20px', flex: 1 }}>
              {/* Deck (Left) */}
              <div style={{ width: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ height: '140px', width: '100px', background: '#020617', border: '2px solid #334155', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '28px', position: 'relative', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                  {me.deck.length}
                  <div style={{ position: 'absolute', bottom: '10px', fontSize: '14px', color: '#94a3b8' }}>Deck</div>
                </div>
              </div>

              {/* Hand (Middle) */}
              <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start', background: '#0f172a', padding: '15px', borderRadius: '8px', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)' }}>
                {groupCards(me.hand).map((group, i) => renderCardGroup(group, i, 'hand'))}
              </div>

              {/* Discard (Right) */}
              <div style={{ width: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ height: '140px', width: '100px', background: '#1e293b', border: '2px solid #475569', borderRadius: '8px', position: 'relative', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                  
                  {/* Invisible stack of all discard cards to allow framer-motion to fly them here */}
                  <AnimatePresence>
                    {me.discard.map((card, i) => (
                      <motion.div
                        layoutId={card.id}
                        key={card.id}
                        initial={false}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                          backgroundImage: `url(${CARD_IMAGES[card.cardId]})`, backgroundSize: 'cover',
                          borderRadius: '8px', zIndex: i
                        }}
                      />
                    ))}
                  </AnimatePresence>

                  {/* Top overlay data */}
                  <div style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.8)', padding: '2px 8px', borderRadius: '12px', fontSize: '14px', color: 'white', zIndex: 9999, fontWeight: 'bold' }}>{me.discard.length}</div>
                  <div style={{ position: 'absolute', bottom: '5px', width: '100%', textAlign: 'center', fontSize: '14px', color: 'white', background: 'rgba(0,0,0,0.7)', padding: '4px 0', zIndex: 9999, borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>Discard</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <GameLayout bottomAreaRatio={25}
      gameName="Dominion"
      helpText="Build your deck and collect Victory Points! First to buy Provinces or empty 3 piles wins."
      helpUrl="https://en.wikipedia.org/wiki/Dominion_(card_game)"
      renderGameSpecificPlayerDetails={renderPlayerDetails}
      renderLogMessage={renderLogMessage}
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
