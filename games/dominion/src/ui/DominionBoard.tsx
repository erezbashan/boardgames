import React, { useState } from 'react';
import { GameLayout } from '@erez/boardgame-core';
import { DominionState, ALL_KINGDOM_CARDS } from '../engine/types';
import { PlayerAction } from '../engine/actions';
import { getCardDef, Cards } from '../engine/cards';
import { CardDefinition, CardType } from '../engine/cards/types';
import { motion, AnimatePresence } from 'framer-motion';
import { DominionStats } from './DominionStats';

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
  "militia": "https://raw.githubusercontent.com/tempfillernamegithq/dominion-cards/master/dominion/militia.jpg",
  "cellar": "https://wiki.dominionstrategy.com/images/thumb/1/1c/Cellar.jpg/200px-Cellar.jpg",
  "market": "https://wiki.dominionstrategy.com/images/thumb/7/7e/Market.jpg/200px-Market.jpg",
  "festival": "https://wiki.dominionstrategy.com/images/thumb/e/ec/Festival.jpg/200px-Festival.jpg",
  "laboratory": "https://wiki.dominionstrategy.com/images/thumb/0/0c/Laboratory.jpg/200px-Laboratory.jpg",
  "council_room": "https://wiki.dominionstrategy.com/images/thumb/e/e0/Council_Room.jpg/200px-Council_Room.jpg",
  "moat": "https://wiki.dominionstrategy.com/images/thumb/f/fe/Moat.jpg/200px-Moat.jpg",
  "workshop": "https://raw.githubusercontent.com/tempfillernamegithq/dominion-cards/master/dominion/workshop.jpg",
  "throne_room": "https://raw.githubusercontent.com/tempfillernamegithq/dominion-cards/master/dominion/throne-room.jpg",
  "chapel": "https://raw.githubusercontent.com/tempfillernamegithq/dominion-cards/master/dominion/chapel.jpg",
  "gardens": "https://raw.githubusercontent.com/tempfillernamegithq/dominion-cards/master/dominion/gardens.jpg",
  "witch": "https://wiki.dominionstrategy.com/images/thumb/b/b3/Witch.jpg/200px-Witch.jpg",
  "moneylender": "https://wiki.dominionstrategy.com/images/thumb/7/70/Moneylender.jpg/200px-Moneylender.jpg",
  "poacher": "https://wiki.dominionstrategy.com/images/thumb/8/87/Poacher.jpg/200px-Poacher.jpg",
  "remodel": "https://wiki.dominionstrategy.com/images/thumb/2/2e/Remodel.jpg/200px-Remodel.jpg",
  "mine": "https://wiki.dominionstrategy.com/images/thumb/8/8e/Mine.jpg/200px-Mine.jpg"
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
    if (!isMyTurn) return;
    const req = gameState.pendingActions[0] as any;
    const isInputPhaseForMe = isInputPhase && req?.playerId === myPlayerId;
    if (isInputPhaseForMe && req?.inputType === 'GAIN_CARD') {
      const maxCost = req?.payload?.maxCost || 99;
      const def = getCardDef(cardId);
      if (req.payload?.treasureOnly && !def.types.includes('TREASURE')) return;
      if (def.cost <= maxCost && gameState.supply[cardId] > 0) {
        dispatch({ type: 'RESOLVE_INPUT', playerId: myPlayerId, payload: { cardId } });
      }
      return;
    }
    if (gameState.phase !== 'BUY' || isInputPhase) return;
    dispatch({ type: 'BUY_CARD', playerId: myPlayerId, cardId });
  };

  const handleEndPhase = () => {
    dispatch({ type: 'END_PHASE', playerId: myPlayerId });
  };

  const handleResolveInput = () => {
    const req = gameState.pendingActions[0];
    if (req?.type === 'REQUEST_INPUT') {
      if (req.inputType === 'DISCARD_FOR_CELLAR' || req.inputType === 'DISCARD_FOR_POACHER' || req.inputType === 'DISCARD_FOR_MILITIA') {
        dispatch({ 
          type: 'RESOLVE_INPUT', 
          playerId: myPlayerId, 
          payload: { discardedIds: selectedCards } 
        });
      } else if (req.inputType === 'TRASH_FOR_CHAPEL' || req.inputType === 'TRASH_FOR_REMODEL' || req.inputType === 'TRASH_FOR_MINE' || req.inputType === 'TRASH_COPPER_FOR_MONEYLENDER') {
        dispatch({ 
          type: 'RESOLVE_INPUT', 
          playerId: myPlayerId, 
          payload: { trashedIds: selectedCards } 
        });
      }
      setSelectedCards([]);
    }
  };

  const toggleCardSelection = (instanceId: string) => {
    const req = gameState.pendingActions[0];
    const inputType = req?.type === 'REQUEST_INPUT' ? req.inputType : null;

    if (inputType === 'PLAY_FOR_THRONE_ROOM') {
      // Auto-confirm
      const card = me.hand.find(c => c.id === instanceId);
      if (card && !getCardDef(card.cardId).types.includes('ACTION')) return;
      dispatch({ type: 'RESOLVE_INPUT', playerId: myPlayerId, payload: { instanceId } });
      return;
    }

    const card = me.hand.find(c => c.id === instanceId);
    if (!card) return;

    if (inputType === 'TRASH_COPPER_FOR_MONEYLENDER' && card.cardId !== 'copper') return;
    if (inputType === 'TRASH_FOR_MINE' && !getCardDef(card.cardId).types.includes('TREASURE')) return;

    setSelectedCards(prev => {
      if (prev.includes(instanceId)) return prev.filter(id => id !== instanceId);
      
      const maxSelections = 
        inputType === 'TRASH_FOR_CHAPEL' ? 4 :
        inputType === 'TRASH_FOR_REMODEL' ? 1 :
        inputType === 'TRASH_FOR_MINE' ? 1 :
        inputType === 'TRASH_COPPER_FOR_MONEYLENDER' ? 1 :
        (inputType === 'DISCARD_FOR_POACHER' || inputType === 'DISCARD_FOR_MILITIA') ? (req as any).payload?.amount || 0 :
        99;
        
      if (prev.length >= maxSelections) {
         if (maxSelections === 1) return [instanceId];
         return prev;
      }
      return [...prev, instanceId];
    });
  };

  const renderPlayerDetails = (playerId: string) => {
    const p = gameState.players[playerId];
    if (!p) return null;
    const isMe = playerId === myPlayerId;
    const isInputPhaseForMe = isInputPhase && gameState.pendingActions[0]?.playerId === myPlayerId;

    // Sort hand same as play area (cost desc)
    const sortedHand = [...p.hand].sort((a, b) => {
      const costDiff = getCardDef(b.cardId).cost - getCardDef(a.cardId).cost;
      return costDiff !== 0 ? costDiff : a.cardId.localeCompare(b.cardId);
    });

    return (
      <div style={{ fontSize: '12px', color: '#cbd5e1', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px', marginTop: '4px' }}>
        {/* VP row */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
          <span>VP:</span> <strong style={{ color: '#fbbf24' }}>{p.victoryPoints}</strong>
          {isMe && isMyTurn && (
            <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#34d399', fontWeight: 'bold' }}>YOUR TURN</span>
          )}
        </div>

        {/* Deck / Discard row (always small) */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', marginBottom: '8px' }}>
          {/* Deck */}
          <div style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>
            <div style={{ width: '30px', height: '42px', border: '1px solid #475569', borderRadius: '3px', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>{p.deck.length}</div>
            Deck
          </div>
          {/* Discard (with layoutId animation so cards fly here) */}
          <div style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>
            <div style={{ position: 'relative', width: '30px', height: '42px', border: '1px solid #475569', borderRadius: '3px', background: '#1e293b' }}>
              <AnimatePresence>
                {p.discard.map((card, i) => (
                  <motion.div
                    layoutId={card.id}
                    key={card.id}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: `url(${CARD_IMAGES[card.cardId]})`, backgroundSize: 'cover', borderRadius: '3px', zIndex: i }}
                  />
                ))}
              </AnimatePresence>
              <div style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.8)', padding: '1px 4px', borderRadius: '8px', fontSize: '9px', color: 'white', zIndex: 9999, fontWeight: 'bold' }}>{p.discard.length}</div>
            </div>
            Discard
          </div>
          {/* Hand count for other players, or label for me */}
          {!isMe && (
            <div style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>
              <div style={{ display: 'flex', gap: '1px', minHeight: '42px', alignItems: 'flex-end' }}>
                {p.hand.length > 0 ? (
                  p.hand.slice(0, 7).map((card, i) => {
                    if (card._revealed) {
                      return (
                        <div key={i} style={{ width: '30px', height: '42px', backgroundImage: `url(${CARD_IMAGES[card.cardId]})`, backgroundSize: 'cover', border: '1px solid #fbbf24', borderRadius: '3px', zIndex: i, marginLeft: i > 0 ? '-20px' : '0', boxShadow: '0 0 5px rgba(251,191,36,0.5)' }} title="Revealed Moat" />
                      );
                    }
                    return <div key={i} style={{ width: '30px', height: '42px', background: '#1e3a5f', border: '1px solid #475569', borderRadius: '3px', marginLeft: i > 0 ? '-20px' : '0', zIndex: i, boxShadow: '-2px 0 5px rgba(0,0,0,0.3)' }} />;
                  })
                ) : (
                  <div style={{ width: '30px', height: '42px', border: '1px solid #475569', borderRadius: '3px', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>0</div>
                )}
              </div>
              Hand ({p.hand.length})
            </div>
          )}
        </div>

        {/* Hand cards — only for my player, face up and clickable */}
        {isMe && (
          <div>
            <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
              Hand ({sortedHand.length} cards){isInputPhaseForMe ? ' — click to select' : isMyTurn && gameState.phase === 'ACTION' ? ' — click action cards to play' : isMyTurn && gameState.phase === 'BUY' ? ' — treasures auto-played' : ''}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', paddingBottom: '4px', paddingLeft: '10px' }}>
              <AnimatePresence>
                {sortedHand.map((card, i) => {
                  const isGrouped = i > 0 && sortedHand[i-1].cardId === card.cardId;
                  const isSelected = selectedCards.includes(card.id);
                  const def = getCardDef(card.cardId);
                  const isPlayableAction = isMyTurn && gameState.phase === 'ACTION' && me.actions > 0 && def.types.includes('ACTION') && !isInputPhase;
                  const imageUrl = CARD_IMAGES[card.cardId];
                  return (
                    <motion.div
                      layout
                      layoutId={card.id}
                      key={card.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                      onClick={() => {
                        if (isInputPhase) toggleCardSelection(card.id);
                        else if (isMyTurn) handlePlayCard(card.id);
                      }}
                      style={{
                        position: 'relative',
                        marginLeft: isGrouped ? '-50px' : '6px',
                        zIndex: i,
                        width: '70px',
                        height: '100px',
                        border: `2px solid ${isPlayableAction && !isSelected ? '#34d399' : 'rgba(100,116,139,0.5)'}`,
                        borderRadius: '6px',
                        backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        cursor: (isMyTurn || isInputPhaseForMe) ? 'pointer' : 'default',
                        boxShadow: isSelected ? '0 0 0 4px #eab308' : isPlayableAction ? '0 0 8px rgba(52,211,153,0.6)' : card._revealed ? '0 0 15px 5px #fbbf24' : '0 2px 4px rgba(0,0,0,0.5)',
                        animation: card._revealed ? 'revealedPulse 1s ease-in-out infinite' : isPlayableAction && !isSelected ? 'blinkGlow 1.5s infinite' : 'none',
                        flexShrink: 0,
                        filter: isSelected ? 'brightness(1.2)' : 'none'
                      }}
                    >
                      {isSelected && (
                        <div style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#eab308', color: 'black', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.5)', zIndex: 20 }}>
                          ✓
                        </div>
                      )}
                      {/* Type icon */}
                      <div style={{ position: 'absolute', top: '2px', left: '2px', fontSize: '10px', zIndex: 10 }}>
                        {getIcon(def.types)}
                      </div>
                      {/* Info button */}
                      <div
                        style={{ position: 'absolute', top: '2px', right: '2px', color: 'rgba(255,255,255,0.7)', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.9)', zIndex: 10 }}
                        onClick={(e) => { e.stopPropagation(); showPopup(e, def); }}
                      >?</div>
                      {/* Selection overlay */}
                      {isSelected && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(59,130,246,0.3)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
                          <span style={{ fontSize: '18px' }}>✓</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {sortedHand.length === 0 && (
                <div style={{ color: '#475569', fontSize: '10px', padding: '8px 0' }}>Empty hand</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const showPopup = (e: React.MouseEvent, def: CardDefinition) => {
    if (hoveredCardDef?.id === def.id) {
       hidePopup();
    } else {
       setHoveredCardDef(def);
       setPopupPos({ x: e.clientX, y: e.clientY });
    }
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
          stiffness: 350, 
          damping: 28, 
          delay: index * 0.1 // Stagger drawing
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
        <div style={{ position: 'absolute', top: '2px', right: '4px', zIndex: 10 }}>
          <div 
            style={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
            onClick={(e) => { e.stopPropagation(); showPopup(e, def); }}
          >?</div>
        </div>
        
        {card._throned && (
          <div style={{ position: 'absolute', bottom: '4px', left: '0', right: '0', textAlign: 'center', zIndex: 10 }}>
            <span style={{ background: '#eab308', color: 'black', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              x2 (Throned)
            </span>
          </div>
        )}
      </motion.div>
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
            onClick={(e) => showPopup(e, def)}
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
    const victorySupply = supplyEntries.filter(s => s.def.types.includes('VICTORY') && !ALL_KINGDOM_CARDS.includes(s.id)).sort((a,b) => b.def.cost - a.def.cost);
    const treasureSupply = supplyEntries.filter(s => s.def.types.includes('TREASURE') && !ALL_KINGDOM_CARDS.includes(s.id)).sort((a,b) => b.def.cost - a.def.cost);
    const kingdomSupply = supplyEntries.filter(s => ALL_KINGDOM_CARDS.includes(s.id)).sort((a,b) => b.def.cost - a.def.cost);

    const renderMarketCard = (id: string, count: number, def: CardDefinition) => {
      let disabled = true;
      const req = gameState.pendingActions[0] as any;
      if (isInputPhase && req?.playerId === myPlayerId && req?.inputType === 'GAIN_CARD') {
         const maxCost = req.payload?.maxCost || 99;
         const validTarget = !req.payload?.treasureOnly || def.types.includes('TREASURE');
         disabled = count <= 0 || def.cost > maxCost || !validTarget;
      } else {
         disabled = !isMyTurn || gameState.phase !== 'BUY' || me.buys <= 0 || count <= 0 || me.coins < def.cost || isInputPhase;
      }
      const imageUrl = CARD_IMAGES[id];

      return (
        <div 
          key={id} 
          style={{ 
            position: 'relative', 
            width: '80px', 
            height: '115px', 
            borderRadius: '6px',
            border: `2px solid ${disabled ? '#475569' : '#3b82f6'}`,
            cursor: disabled ? 'not-allowed' : 'pointer',
            backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: disabled ? 0.6 : 1,
            boxShadow: disabled ? 'none' : '0 4px 10px rgba(59, 130, 246, 0.4)',
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '4px'
          }}
          onClick={() => !disabled && handleBuyCard(id)}
        >
          {count === 0 && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, background: 'rgba(0,0,0,0.5)', borderRadius: '4px' }}>
              <span style={{ fontSize: '48px', color: '#ef4444', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>X</span>
            </div>
          )}
          {/* Top Bar: Name */}
          <div style={{ position: 'absolute', top: '2px', right: '4px', zIndex: 10 }}>
            <div 
              style={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
              onClick={(e) => { e.stopPropagation(); showPopup(e, def); }}
            >?</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '10px', padding: '2px 4px', borderRadius: '4px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {def.name}
          </div>
          
          {/* Bottom Bar: Cost & Count */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.9)', color: 'black', fontWeight: 'bold', fontSize: '11px', padding: '2px 6px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ${def.cost}
            </div>
            <div style={{ background: count === 0 ? '#ef4444' : 'rgba(0,0,0,0.8)', color: 'white', fontSize: '11px', padding: '2px 4px', borderRadius: '4px', fontWeight: 'bold' }}>
              {count}
            </div>
          </div>
        </div>
      );
    };

    // Sort playArea by cost descending (same as market), then by cardId for stable order
    const activePlayer = gameState.players[gameState.playerOrder[gameState.currentPlayerIndex]];
    const playAreaCards = [...activePlayer.playArea].sort((a,b) => {
      const costDiff = getCardDef(b.cardId).cost - getCardDef(a.cardId).cost;
      return costDiff !== 0 ? costDiff : a.cardId.localeCompare(b.cardId);
    });

    return (
      <div style={{ display: 'flex', gap: '20px', padding: '20px', height: '100%', boxSizing: 'border-box' }}>
        {/* Hover Popup - Renders Full Card Image */}
        {hoveredCardDef && popupPos && (
          <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={hidePopup} />
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
          </>
        )}

        {/* Left Column: Supply Market (Grid) */}
        <div style={{ minWidth: '380px', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto', paddingRight: '5px' }}>
          {/* Victory & Treasure Row */}
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {victorySupply.map(s => renderMarketCard(s.id, s.count, s.def))}
          </div>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {treasureSupply.map(s => renderMarketCard(s.id, s.count, s.def))}
          </div>
          {/* Kingdom Row */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '10px' }}>
            {kingdomSupply.map(s => renderMarketCard(s.id, s.count, s.def))}
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
                <button onClick={handleEndPhase} style={{ padding: '10px 20px', background: '#eab308', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.2)', animation: (gameState.phase === 'ACTION' && me.actions === 0) || (gameState.phase === 'BUY' && me.buys === 0) ? 'blinkGlow 1.5s infinite' : 'none' }}>
                  {gameState.phase === 'ACTION' ? 'Skip to Buy Phase' : 'End Turn'}
                </button>
              )}
            </div>
          </div>
          
          {isInputPhase && gameState.pendingActions[0]?.playerId === myPlayerId && (() => {
            const req = gameState.pendingActions[0] as any;
            const inputType = req?.type === 'REQUEST_INPUT' ? req.inputType : null;
            const msg = inputType === 'DISCARD_FOR_CELLAR' 
              ? 'Select cards to discard for Cellar (you\'ll draw the same number).'
              : inputType === 'TRASH_FOR_CHAPEL'
              ? `Select up to 4 cards to trash permanently with Chapel (${selectedCards.length} selected).`
              : inputType === 'PLAY_FOR_THRONE_ROOM'
              ? `Select an Action card from your hand to play twice with Throne Room.`
              : inputType === 'GAIN_CARD'
              ? `Select a card from the market costing up to $${req.payload?.maxCost || 99} to gain.`
              : inputType === 'TRASH_COPPER_FOR_MONEYLENDER'
              ? `Select a Copper to trash for +3 Coins (or confirm with 0 to skip).`
              : inputType === 'DISCARD_FOR_POACHER'
              ? `Select ${req.payload?.amount} card(s) to discard for Poacher (${selectedCards.length} selected).`
              : inputType === 'DISCARD_FOR_MILITIA'
              ? `Select ${req.payload?.amount} card(s) to discard from Militia attack (${selectedCards.length} selected).`
              : inputType === 'TRASH_FOR_REMODEL'
              ? `Select a card to trash to gain a card costing up to $2 more.`
              : inputType === 'TRASH_FOR_MINE'
              ? `Select a Treasure to trash to gain a Treasure costing up to $3 more.`
              : 'Waiting for input...';
              
            const needsConfirm = ['DISCARD_FOR_CELLAR', 'TRASH_FOR_CHAPEL', 'TRASH_COPPER_FOR_MONEYLENDER', 'DISCARD_FOR_POACHER', 'DISCARD_FOR_MILITIA', 'TRASH_FOR_REMODEL', 'TRASH_FOR_MINE'].includes(inputType || '');
            
            return (
              <div style={{ padding: '15px', background: '#7f1d1d', border: '2px solid #ef4444', borderRadius: '8px', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                <strong style={{ fontSize: '18px' }}>⚠️ Action Required: </strong> {msg}
                {needsConfirm && (
                  <button onClick={handleResolveInput} style={{ marginLeft: '15px', padding: '6px 16px', background: 'white', color: '#7f1d1d', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Confirm Selection</button>
                )}
              </div>
            );
          })()}
          
          {/* Play Area */}
          <div className="no-scrollbar" style={{ border: '1px solid #475569', padding: '15px', minHeight: '300px', maxHeight: '450px', overflowY: 'auto', overflowX: 'hidden', borderRadius: '8px', background: '#0f172a' }}>
            <h3 style={{ marginTop: 0, color: '#94a3b8' }}>{activePlayer.id === myPlayerId ? 'Your' : activePlayer.name + '\'s'} Play Area</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', paddingLeft: '10px' }}>
              <AnimatePresence>
                {playAreaCards.map((card, i) => {
                   const isGrouped = i > 0 && playAreaCards[i-1].cardId === card.cardId;
                   return (
                     <div key={card.id} style={{ marginLeft: isGrouped ? '-60px' : '10px', zIndex: i, position: 'relative' }}>
                       {renderCard(card, i, undefined, false, isGrouped)}
                     </div>
                   );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => {
    const currentKingdom = gameState.settings?.kingdomCards ?? ALL_KINGDOM_CARDS;
    const isLobby = gameState.status === 'Lobby';

    const toggleCard = (cardId: string) => {
      const current = currentKingdom.includes(cardId)
        ? currentKingdom.filter(id => id !== cardId)
        : [...currentKingdom, cardId];
      dispatch({ type: 'UPDATE_SETTINGS', payload: { ...(gameState.settings || {}), kingdomCards: current } });
    };

    return (
      <div>
        <div style={{ marginBottom: '8px', color: '#94a3b8', fontSize: '13px' }}>
          Rules Override:
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Provinces Count:</label>
          <select 
            disabled={!isLobby}
            value={gameState.settings?.provincesOverride || 0}
            onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { ...(gameState.settings || {}), provincesOverride: Number(e.target.value) || undefined } })}
            style={{ background: '#1e293b', color: 'white', border: '1px solid #475569', borderRadius: '4px', padding: '4px', cursor: isLobby ? 'pointer' : 'not-allowed' }}
          >
            <option value={0}>According to Game Rules</option>
            <option value={2}>2 (Super Fast)</option>
            <option value={4}>4 (Short Game)</option>
            <option value={8}>8 (2 Players)</option>
            <option value={12}>12 (3-4 Players)</option>
            <option value={16}>16 (Long Game)</option>
            <option value={20}>20 (Marathon)</option>
          </select>
        </div>

        <div style={{ marginBottom: '8px', color: '#94a3b8', fontSize: '13px' }}>
          Select which Kingdom cards to include (chosen at game start):
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <button
            disabled={!isLobby}
            onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { ...(gameState.settings || {}), kingdomCards: [...ALL_KINGDOM_CARDS] } })}
            style={{ padding: '4px 10px', fontSize: '12px', background: 'transparent', color: '#60a5fa', border: '1px solid #60a5fa', borderRadius: '4px', cursor: isLobby ? 'pointer' : 'default', opacity: isLobby ? 1 : 0.5 }}
          >All</button>
          <button
            disabled={!isLobby}
            onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { ...(gameState.settings || {}), kingdomCards: [] } })}
            style={{ padding: '4px 10px', fontSize: '12px', background: 'transparent', color: '#60a5fa', border: '1px solid #60a5fa', borderRadius: '4px', cursor: isLobby ? 'pointer' : 'default', opacity: isLobby ? 1 : 0.5 }}
          >None</button>
        </div>
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', maxHeight: '280px', overflowY: 'auto' }}>
          {[...ALL_KINGDOM_CARDS].sort((a, b) => getCardDef(a).name.localeCompare(getCardDef(b).name)).map(cardId => {
            const def = getCardDef(cardId);
            const isActive = currentKingdom.includes(cardId);
            return (
              <div key={cardId} style={{ padding: '4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={isActive}
                  disabled={!isLobby}
                  style={{ cursor: isLobby ? 'pointer' : 'not-allowed', opacity: isLobby ? 1 : 0.6 }}
                  onChange={() => isLobby && toggleCard(cardId)}
                />
                <span style={{ color: isActive ? 'white' : '#475569', cursor: isLobby ? 'pointer' : 'default' }} onClick={() => isLobby && toggleCard(cardId)}>
                  {def.name} <span style={{ color: '#94a3b8', fontSize: '11px' }}>({def.cost}$)</span>
                </span>
              </div>
            );
          })}
        </div>

        {!isLobby && <p style={{ color: 'gray', fontSize: '12px', marginTop: '12px' }}>Settings can only be changed in the Lobby.</p>}
      </div>
    );
  };

  return (
    <>
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes revealedPulse {
          0% { transform: scale(1); box-shadow: 0 0 15px 5px #fbbf24; }
          50% { transform: scale(1.1); box-shadow: 0 0 25px 10px #fbbf24; }
          100% { transform: scale(1); box-shadow: 0 0 15px 5px #fbbf24; }
        }
      `}</style>
      <GameLayout
        gameName="Dominion"
        helpText="Build your deck and collect Victory Points! First to buy Provinces or empty 3 piles wins."
        helpUrl="https://en.wikipedia.org/wiki/Dominion_(card_game)"
      renderGameSpecificPlayerDetails={renderPlayerDetails}
      renderGameSpecificStats={() => <DominionStats gameState={gameState} />}
      renderLogMessage={renderLogMessage}
      settings={renderSettings()}
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
    </>
  );
};
