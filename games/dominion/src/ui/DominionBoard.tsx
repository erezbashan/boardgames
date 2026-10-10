import React, { useState } from 'react';
import { GameLayout } from '@erez/boardgame-core';
import { DominionState, ALL_KINGDOM_CARDS } from '../engine/types';
import { PlayerAction } from '../engine/actions';
import { getCardDef, Cards } from '../engine/cards';
import { CardDefinition, CardType } from '../engine/cards/types';
import { motion, AnimatePresence } from 'framer-motion';
import { DominionStats } from './DominionStats';
import { AnimatedCounter } from './AnimatedCounter';

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
  "smithy": "https://raw.githubusercontent.com/tempfillernamegithq/dominion-cards/master/dominion/smithy.jpg",
  "militia": "https://raw.githubusercontent.com/tempfillernamegithq/dominion-cards/master/dominion/militia.jpg",
  "cellar": "https://wiki.dominionstrategy.com/images/thumb/1/1c/Cellar.jpg/200px-Cellar.jpg",
  "market": "https://raw.githubusercontent.com/tempfillernamegithq/dominion-cards/master/dominion/market.jpg",
  "festival": "https://wiki.dominionstrategy.com/images/thumb/e/ec/Festival.jpg/200px-Festival.jpg",
  "laboratory": "https://raw.githubusercontent.com/tempfillernamegithq/dominion-cards/master/dominion/laboratory.jpg",
  "council_room": "https://wiki.dominionstrategy.com/images/thumb/e/e0/Council_Room.jpg/200px-Council_Room.jpg",
  "moat": "https://wiki.dominionstrategy.com/images/thumb/f/fe/Moat.jpg/200px-Moat.jpg",
  "workshop": "https://raw.githubusercontent.com/tempfillernamegithq/dominion-cards/master/dominion/workshop.jpg",
  "throne_room": "https://raw.githubusercontent.com/tempfillernamegithq/dominion-cards/master/dominion/throne-room.jpg",
  "chapel": "https://raw.githubusercontent.com/tempfillernamegithq/dominion-cards/master/dominion/chapel.jpg",
  "gardens": "https://raw.githubusercontent.com/tempfillernamegithq/dominion-cards/master/dominion/gardens.jpg",
  "witch": "https://raw.githubusercontent.com/tempfillernamegithq/dominion-cards/master/dominion/witch.jpg",
  "moneylender": "https://raw.githubusercontent.com/tempfillernamegithq/dominion-cards/master/dominion/moneylender.jpg",
  "poacher": "https://raw.githubusercontent.com/tempfillernamegithq/dominion-cards/master/dominion/poacher.jpg",
  "remodel": "https://raw.githubusercontent.com/tempfillernamegithq/dominion-cards/master/dominion/remodel.jpg",
  "mine": "https://raw.githubusercontent.com/tempfillernamegithq/dominion-cards/master/dominion/mine.jpg",
  "merchant": "https://raw.githubusercontent.com/tempfillernamegithq/dominion-cards/master/dominion/merchant.jpg",
  "vassal": "https://raw.githubusercontent.com/tempfillernamegithq/dominion-cards/master/dominion/vassal.jpg",
  "artisan": "https://raw.githubusercontent.com/tempfillernamegithq/dominion-cards/master/dominion/artisan.jpg",
  "bandit": "https://raw.githubusercontent.com/tempfillernamegithq/dominion-cards/master/dominion/bandit.jpg",
  "bureaucrat": "https://raw.githubusercontent.com/tempfillernamegithq/dominion-cards/master/dominion/bureaucrat.jpg",
  "harbinger": "https://raw.githubusercontent.com/tempfillernamegithq/dominion-cards/master/dominion/harbinger.jpg",
  "library": "https://raw.githubusercontent.com/tempfillernamegithq/dominion-cards/master/dominion/library.jpg",
  "sentry": "https://raw.githubusercontent.com/tempfillernamegithq/dominion-cards/master/dominion/sentry.jpg",
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
  const [showKingdomOverview, setShowKingdomOverview] = useState(() => gameState.history.length === 0);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [sentryChoices, setSentryChoices] = useState<Record<string, 'trash'|'discard'|'deck1'|'deck2'>>({});
  const [hoveredCardDef, setHoveredCardDef] = useState<CardDefinition | null>(null);
  const [popupPos, setPopupPos] = useState<{x: number, y: number} | null>(null);
  
  // Calculate debug stats for Game Progress
  const numPlayers = gameState.playerOrder.length;
  const lookback = 2 * (numPlayers || 2);
  const recent = gameState.recentBuyingPowers || [];
  const historyWindow = recent.slice(-lookback);
  while (historyWindow.length < lookback) historyWindow.unshift(0);
  
  let provincesBoughtCount = 0;
  let otherCardsBoughtCount = 0;
  for (const bp of historyWindow) {
     if (bp >= 8) provincesBoughtCount++;
     if (bp >= 3 && bp < 8) otherCardsBoughtCount++;
  }
  const provinceRatePerRound = Math.max(0.1, provincesBoughtCount / 2);
  const provincesLeft = gameState.supply['province'] ?? 8;
  const roundsToDepleteProvinces = provincesLeft / provinceRatePerRound;
  
  let emptyPiles = 0;
  const pileDepletions: number[] = [];
  for (const cardId in gameState.supply) {
     const count = gameState.supply[cardId];
     if (count === 0) emptyPiles++;
     else if (cardId !== 'province') pileDepletions.push(count);
  }
  pileDepletions.sort((a,b) => a - b);
  let cardsToEmpty3Piles = 0;
  const pilesNeeded = Math.max(0, 3 - emptyPiles);
  for (let i = 0; i < pilesNeeded; i++) {
     if (i < pileDepletions.length) cardsToEmpty3Piles += pileDepletions[i];
  }
  const otherCardsRatePerRound = Math.max(0.5, otherCardsBoughtCount / 2);
  const roundsToEmptyPiles = (cardsToEmpty3Piles * 2) / otherCardsRatePerRound;
  
  const estimatedRoundsLeft = Math.min(roundsToDepleteProvinces, roundsToEmptyPiles);
  const avgBuyingPower = historyWindow.length > 0 ? historyWindow.reduce((a, b) => a + b, 0) / historyWindow.length : 0;
  const gameProgress = Math.max(0, Math.min(1, 1 - (estimatedRoundsLeft / 15)));
  
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
        if (req.inputType === 'DISCARD_FOR_POACHER' || req.inputType === 'DISCARD_FOR_MILITIA') {
           const myHandSize = gameState.players[myPlayerId]?.hand.length || 0;
           const amountToForce = Math.min(req.payload?.amount || 0, myHandSize);
           if (selectedCards.length < amountToForce) {
              alert(`You must select ${amountToForce} cards.`);
              return;
           }
        }
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

    if (inputType === 'HAND_TO_DECK') {
      const card = me.hand.find(c => c.id === instanceId);
      if (card) {
        if ((req as any).payload?.filterTypes) {
           const allowed = (req as any).payload.filterTypes as string[];
           if (!getCardDef(card.cardId).types.some(t => allowed.includes(t))) return;
        }
        dispatch({ type: 'RESOLVE_INPUT', playerId: myPlayerId, payload: { cardId: instanceId } });
      }
      return;
    }

    let card = me.hand.find(c => c.id === instanceId);
    if (!card) card = me.discard.find(c => c.id === instanceId);
    if (!card) return;

    if (inputType === 'TRASH_COPPER_FOR_MONEYLENDER' && card.cardId !== 'copper') return;
    if (inputType === 'TRASH_FOR_MINE' && !getCardDef(card.cardId).types.includes('TREASURE')) return;
    if (inputType === 'PLAY_VASSAL_ACTION') return; // Selection not used for this input type
    if ((req as any).payload?.filterTypes) {
      const allowed = (req as any).payload.filterTypes as string[];
      if (!getCardDef(card.cardId).types.some(t => allowed.includes(t))) return;
    }

    const maxSelections = 
      inputType === 'TRASH_FOR_CHAPEL' ? 4 :
      inputType === 'TRASH_FOR_REMODEL' ? 1 :
      inputType === 'TRASH_FOR_MINE' ? 1 :
      inputType === 'HAND_TO_DECK' ? 1 :
      inputType === 'DISCARD_TO_DECK' ? 1 :
      inputType === 'PLAY_FOR_THRONE_ROOM' ? 1 :
      inputType === 'TRASH_COPPER_FOR_MONEYLENDER' ? 1 :
      (inputType === 'DISCARD_FOR_POACHER' || inputType === 'DISCARD_FOR_MILITIA') ? Math.min((req as any).payload?.amount || 0, me.hand.length) :
      99;
      
    // Bypass multi-select logic for Militia/Poacher to handle them one-by-one instantly
    if (inputType === 'DISCARD_FOR_POACHER' || inputType === 'DISCARD_FOR_MILITIA') {
       dispatch({ type: 'RESOLVE_INPUT', playerId: myPlayerId, payload: { discardedIds: [instanceId] } });
       setSelectedCards([]);
       return;
    }

    if (maxSelections === 1) {
      if (inputType === 'TRASH_COPPER_FOR_MONEYLENDER') {
        dispatch({ type: 'RESOLVE_INPUT', playerId: myPlayerId, payload: { trashedIds: [instanceId] } });
      } else if (inputType === 'PLAY_FOR_THRONE_ROOM') {
        dispatch({ type: 'RESOLVE_INPUT', playerId: myPlayerId, payload: { instanceId } });
      } else if (inputType === 'TRASH_FOR_REMODEL' || inputType === 'TRASH_FOR_MINE') {
        dispatch({ type: 'RESOLVE_INPUT', playerId: myPlayerId, payload: { trashedIds: [instanceId] } });
      } else if (inputType === 'HAND_TO_DECK' || inputType === 'DISCARD_TO_DECK') {
        dispatch({ type: 'RESOLVE_INPUT', playerId: myPlayerId, payload: { instanceId } });
      }
      setSelectedCards([]);
      return;
    }

    setSelectedCards(prev => {
      if (prev.includes(instanceId)) return prev.filter(id => id !== instanceId);
      
      const nextSelection = [...prev, instanceId];
      if (prev.length >= maxSelections) return prev;
      return nextSelection;
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
            <div 
              title={gameState.settings?.openGame ? `Deck: ${[...p.deck].reverse().map(c => getCardDef(c.cardId).name).join(', ')}` : undefined}
              style={{ position: 'relative', width: '30px', height: '42px', border: '1px solid #475569', borderRadius: '3px', background: '#020617', cursor: gameState.settings?.openGame ? 'help' : 'default' }}
            >
              <div style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.8)', padding: '1px 4px', borderRadius: '8px', fontSize: '9px', color: 'white', zIndex: 9999, fontWeight: 'bold' }}>{p.deck.length}</div>
              {p.transientDeckReveals && p.transientDeckReveals.map((cardId, idx) => {
                const isTrashed = p.transientTrashReveal === cardId;
                return (
                <motion.div
                  key={`transient-${idx}`}
                  initial={{ scale: 0, opacity: 0, y: 0 }}
                  animate={{ scale: isTrashed ? 1.5 : 1.1, opacity: 1, y: -25, x: (idx - (p.transientDeckReveals!.length - 1) / 2) * 35, zIndex: 9999 + idx }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  onMouseEnter={(e) => showPopup(e, getCardDef(cardId))}
                  onMouseLeave={hidePopup}
                  style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundImage: `url(${CARD_IMAGES[cardId]})`,
                    backgroundSize: '100% 100%',
                    borderRadius: '3px',
                    border: isTrashed ? '2px solid #ef4444' : 'none',
                    boxShadow: isTrashed ? '0 0 20px rgba(239, 68, 68, 0.9)' : '0 4px 10px rgba(0,0,0,0.5)',
                    cursor: 'help'
                  }} />
                )
              })}
            </div>
            Deck
          </div>
          {/* Discard (with layoutId animation so cards fly here) */}
          <div style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>
            <div 
              title={gameState.settings?.openGame ? `Discard: ${[...p.discard].reverse().map(c => getCardDef(c.cardId).name).join(', ')}` : undefined}
              style={{ position: 'relative', width: '30px', height: '42px', border: '1px solid #475569', borderRadius: '3px', background: '#1e293b', cursor: gameState.settings?.openGame ? 'help' : 'default' }}
            >
              <AnimatePresence>
                {p.discard.map((card, i) => (
                  <motion.div
                    layoutId={card.id}
                    key={card.id}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: `url(${CARD_IMAGES[card.cardId]})`, backgroundSize: '100% 100%', borderRadius: '3px', zIndex: i }}
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
                  p.hand.slice(0, 15).map((card, i) => {
                    if (card._revealed || gameState.settings?.openGame) {
                      return (
                        <div 
                          key={i} 
                          onMouseEnter={(e) => showPopup(e, getCardDef(card.cardId))} 
                          onMouseLeave={hidePopup}
                          style={{ width: '30px', height: '42px', backgroundImage: `url(${CARD_IMAGES[card.cardId]})`, backgroundSize: '100% 100%', border: card._revealed ? '1px solid #fbbf24' : '1px solid #475569', borderRadius: '3px', zIndex: i, marginLeft: i > 0 ? '-20px' : '0', boxShadow: card._revealed ? '0 0 5px rgba(251,191,36,0.5)' : '-2px 0 5px rgba(0,0,0,0.3)', cursor: 'help' }} 
                        />
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
            {(() => {
              const groupedHand: typeof sortedHand[] = [];
              sortedHand.forEach(c => {
                if (groupedHand.length > 0 && groupedHand[groupedHand.length - 1][0].cardId === c.cardId) {
                  groupedHand[groupedHand.length - 1].push(c);
                } else {
                  groupedHand.push([c]);
                }
              });
              return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingBottom: '4px', paddingLeft: '10px' }}>
              {groupedHand.map(group => (
                <div key={`group-${group[0].cardId}`} style={{ display: 'flex' }}>
                  <AnimatePresence>
                    {group.map((card, i) => {
                      const isGrouped = i > 0;
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
                            marginLeft: isGrouped ? '-50px' : '0px',
                            zIndex: i,
                            width: '70px',
                            height: '100px',
                            border: `2px solid ${isPlayableAction && !isSelected ? '#34d399' : 'rgba(100,116,139,0.5)'}`,
                            borderRadius: '6px',
                            backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
                            backgroundSize: '100% 100%',
                            backgroundPosition: 'center',
                            cursor: (isMyTurn || isInputPhaseForMe) ? 'pointer' : 'default',
                            boxShadow: isSelected ? '0 0 0 4px #eab308' : isPlayableAction ? '0 0 8px rgba(52,211,153,0.6)' : card._revealed ? '0 0 15px 5px #fbbf24' : '0 2px 4px rgba(0,0,0,0.5)',
                            animation: card._revealed ? 'revealedPulse 1s ease-in-out 3' : isPlayableAction && !isSelected ? 'blinkGlow 1.5s infinite' : 'none',
                            flexShrink: 0,
                            filter: isSelected ? 'brightness(1.2)' : 'none'
                          }}
                        >
                          {isSelected && (
                            <div style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#eab308', color: 'black', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.5)', zIndex: 20 }}>
                              ✓
                            </div>
                          )}
                          <div style={{ position: 'absolute', top: '2px', left: '2px', fontSize: '10px', zIndex: 10 }}>
                            {getIcon(def.types)}
                          </div>
                          <div
                            style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.9)', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.9)', zIndex: 10 }}
                            onClick={(e) => { e.stopPropagation(); showPopup(e, def); }}
                          >?</div>
                          {isSelected && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(59,130,246,0.3)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
                              <span style={{ fontSize: '18px' }}>✓</span>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ))}
              {sortedHand.length === 0 && (
                <div style={{ color: '#475569', fontSize: '10px', padding: '8px 0' }}>Empty hand</div>
              )}
            </div>
              );
            })()}
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
        <motion.div 
          layoutId={`market-${id}`}
          key={id}  
          style={{ 
            position: 'relative', 
            width: '80px', 
            height: '115px', 
            borderRadius: '6px',
            border: `2px solid ${disabled ? '#475569' : '#3b82f6'}`,
            cursor: disabled ? 'not-allowed' : 'pointer',
            backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            opacity: disabled ? 0.6 : 1,
            boxShadow: disabled ? 'none' : '0 4px 10px rgba(59, 130, 246, 0.4)',
            transition: 'all 0.2s',
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
              style={{ background: 'rgba(0,0,0,0.6)', borderRadius: '50%', width: '18px', height: '18px', color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}
              onClick={(e) => { e.stopPropagation(); showPopup(e, def); }}
            >?</div>
          </div>
          {!imageUrl && (
            <div style={{ position: 'absolute', top: '4px', left: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '10px', padding: '2px 4px', borderRadius: '4px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {def.name}
            </div>
          )}
          
          {/* Bottom Bar: Cost & Count */}
          <div style={{ position: 'absolute', bottom: '4px', left: '4px', right: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.9)', color: 'black', fontWeight: 'bold', fontSize: '11px', padding: '2px 6px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ${def.cost}
            </div>
            <div style={{ background: count === 0 ? '#ef4444' : 'rgba(0,0,0,0.8)', color: 'white', fontSize: '11px', padding: '2px 4px', borderRadius: '4px', fontWeight: 'bold' }}>
              {count}
            </div>
          </div>
        </motion.div>
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
        
        {/* Startup Kingdom Reveal Animation */}
        <AnimatePresence>
          {gameState.revealedCard && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }}>
              <motion.div 
                layoutId={`market-${gameState.revealedCard}`}
                initial={{ opacity: 0, scale: 0.5, y: 100 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 1, scale: 0.5 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                style={{ 
                   width: '240px', height: '345px', 
                   backgroundImage: CARD_IMAGES[gameState.revealedCard] ? `url(${CARD_IMAGES[gameState.revealedCard]})` : 'none', 
                   backgroundSize: '100% 100%', backgroundPosition: 'center', 
                   borderRadius: '12px', border: '4px solid #fbbf24', 
                   boxShadow: '0 0 40px rgba(251,191,36,0.6)', 
                   display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '10px' 
                }}
              >
                {!CARD_IMAGES[gameState.revealedCard] && (
                  <div style={{ background: 'rgba(0,0,0,0.8)', color: 'white', padding: '10px', borderRadius: '8px', textAlign: 'center', fontSize: '24px', fontWeight: 'bold', marginTop: 'auto', marginBottom: 'auto' }}>
                    {getCardDef(gameState.revealedCard).name}
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {showKingdomOverview && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'rgba(30, 41, 59, 0.95)', backdropFilter: 'blur(8px)', border: '3px solid #3b82f6', borderRadius: '16px', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
              <h1 style={{ margin: 0, color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Kingdom Cards</h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', maxWidth: '1000px' }}>
                {(() => {
                  const baseCards = ['copper', 'silver', 'gold', 'estate', 'duchy', 'province', 'curse'];
                  const kc = gameState.settings?.kingdomCards?.length ? gameState.settings.kingdomCards : Object.keys(gameState.supply).filter(k => !baseCards.includes(k) && gameState.supply[k] !== undefined);
                  return kc.map(cardId => (
                  <div key={cardId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '140px', height: '210px', backgroundImage: `url(${CARD_IMAGES[cardId]})`, backgroundSize: '100% 100%', borderRadius: '8px', boxShadow: '0 6px 15px rgba(0,0,0,0.5)' }} />
                    <div style={{ color: 'white', fontWeight: 'bold', background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '4px' }}>{getCardDef(cardId).name}</div>
                  </div>
                ))
                })()}
              </div>
              <button 
                onClick={() => setShowKingdomOverview(false)}
                style={{ padding: '12px 40px', background: '#3b82f6', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
              >
                Close & Play
              </button>
            </div>
          </div>
        )}

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
              <img src={CARD_IMAGES[hoveredCardDef.id]} alt={hoveredCardDef.name} style={{ width: '100%', borderRadius: '8px' }} />
            ) : (
              <>
                <div style={{ height: '300px', background: '#334155', borderRadius: '8px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Image</div>
                <h4 style={{ margin: '0 0 8px 0', borderBottom: '1px solid #475569', paddingBottom: '4px', fontSize: '18px' }}>
                  {hoveredCardDef.name} <span style={{ float: 'right', color: '#fbbf24' }}>{hoveredCardDef.cost}$</span>
                </h4>
                <div style={{ fontSize: '14px', lineHeight: '1.5' }}>{hoveredCardDef.description}</div>
              </>
            )}
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
          <div style={{ padding: '15px', minHeight: '68px', background: isMyTurn ? '#064e3b' : '#1e293b', borderRadius: '8px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', gap: '20px', fontSize: '18px', fontWeight: 'bold', color: 'white' }}>
              <AnimatedCounter value={gameState.players[gameState.playerOrder[gameState.currentPlayerIndex]]?.actions || 0} icon="⚡ Actions:" color="white" resetKey={gameState.history.length} disableAnimation={gameState.phase === 'CLEANUP'} width="120px" />
              <AnimatedCounter value={gameState.players[gameState.playerOrder[gameState.currentPlayerIndex]]?.buys || 0} icon="🛒 Buys:" color="white" resetKey={gameState.history.length} disableAnimation={gameState.phase === 'CLEANUP'} width="110px" />
              <AnimatedCounter value={gameState.players[gameState.playerOrder[gameState.currentPlayerIndex]]?.coins || 0} icon="💰 Coins:" color="white" resetKey={gameState.history.length} disableAnimation={gameState.phase === 'CLEANUP'} width="110px" />
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
              : inputType === 'HAND_TO_DECK'
              ? `Select a card from your hand to put on top of your deck.`
              : inputType === 'DISCARD_TO_DECK'
              ? `Select a card from your discard pile to put on top of your deck.`
              : inputType === 'LIBRARY_KEEP'
              ? `Keep [${getCardDef(req.payload?.card?.cardId).name}] or set it aside?`
              : inputType === 'SENTRY_CHOICE'
              ? `Select how to handle the top cards of your deck.`
              : 'Waiting for input...';
              
            const needsConfirm = ['DISCARD_FOR_CELLAR', 'TRASH_FOR_CHAPEL', 'TRASH_COPPER_FOR_MONEYLENDER'].includes(inputType || '');
            
            return (
              <div style={{ padding: '15px', background: '#7f1d1d', border: '2px solid #ef4444', borderRadius: '8px', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                <strong style={{ fontSize: '18px' }}>⚠️ Action Required: </strong> {msg}
                {needsConfirm && (
                  <button onClick={handleResolveInput} style={{ marginLeft: '15px', padding: '6px 16px', background: 'white', color: '#7f1d1d', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Confirm Selection</button>
                )}
                {inputType === 'PLAY_FOR_THRONE_ROOM' && (
                  <button onClick={() => dispatch({ type: 'RESOLVE_INPUT', playerId: myPlayerId, payload: { instanceId: null } })} style={{ marginLeft: '15px', padding: '6px 16px', background: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Skip</button>
                )}
                {inputType === 'DISCARD_TO_DECK' && (() => {
                  const uniqueDiscards: any[] = [];
                  const seen = new Set<string>();
                  for (const c of me.discard) {
                    if (!seen.has(c.cardId)) {
                      seen.add(c.cardId);
                      uniqueDiscards.push(c);
                    }
                  }
                  
                  return (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '40px' }}>
                      <div style={{ background: 'rgba(30, 41, 59, 0.85)', backdropFilter: 'blur(4px)', border: '3px solid #3b82f6', borderRadius: '12px', padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ margin: 0, color: 'white' }}>Select a card from your Discard pile</h2>
                        {uniqueDiscards.length === 0 ? (
                          <div style={{ color: '#94a3b8' }}>Your discard pile is empty.</div>
                        ) : (
                          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {uniqueDiscards.map(c => (
                              <div 
                                key={c.id} 
                                onClick={() => dispatch({ type: 'RESOLVE_INPUT', playerId: myPlayerId, payload: { instanceId: c.id } })}
                                style={{ width: '120px', height: '180px', backgroundImage: `url(${CARD_IMAGES[c.cardId]})`, backgroundSize: '100% 100%', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)', cursor: 'pointer', transition: 'transform 0.1s' }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                              />
                            ))}
                          </div>
                        )}
                        <button onClick={() => dispatch({ type: 'RESOLVE_INPUT', playerId: myPlayerId, payload: { instanceId: '' } })} style={{ padding: '10px 24px', background: '#94a3b8', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', marginTop: '10px' }}>Skip (Do nothing)</button>
                      </div>
                    </div>
                  );
                })()}
                {inputType === 'PLAY_VASSAL_ACTION' && (
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '40px' }}>
                    <div style={{ background: 'rgba(30, 41, 59, 0.85)', backdropFilter: 'blur(4px)', border: '3px solid #3b82f6', borderRadius: '12px', padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', maxWidth: '900px' }}>
                      <h2 style={{ margin: 0, color: 'white' }}>Vassal</h2>
                      <div style={{ color: 'white', fontSize: '18px' }}>Do you want to play this card?</div>
                      <div style={{ width: '150px', height: '225px', backgroundImage: `url(${CARD_IMAGES[req.payload?.card?.cardId]})`, backgroundSize: '100% 100%', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }} />
                      <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                        <button onClick={() => dispatch({ type: 'RESOLVE_INPUT', playerId: myPlayerId, payload: { playCard: true } })} style={{ padding: '12px 24px', background: '#34d399', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '18px' }}>Yes, Play It</button>
                        <button onClick={() => dispatch({ type: 'RESOLVE_INPUT', playerId: myPlayerId, payload: { playCard: false } })} style={{ padding: '12px 24px', background: '#ef4444', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '18px' }}>No, Discard It</button>
                      </div>
                    </div>
                  </div>
                )}
                {inputType === 'LIBRARY_KEEP' && (
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '40px' }}>
                    <div style={{ background: 'rgba(30, 41, 59, 0.85)', backdropFilter: 'blur(4px)', border: '3px solid #3b82f6', borderRadius: '12px', padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', maxWidth: '900px' }}>
                      <h2 style={{ margin: 0, color: 'white' }}>Library</h2>
                      <div style={{ color: 'white', fontSize: '18px' }}>Keep this Action card in your hand or set it aside?</div>
                      <div style={{ width: '150px', height: '225px', backgroundImage: `url(${CARD_IMAGES[req.payload?.card?.cardId]})`, backgroundSize: '100% 100%', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }} />
                      <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                        <button onClick={() => dispatch({ type: 'RESOLVE_INPUT', playerId: myPlayerId, payload: { keep: true } })} style={{ padding: '12px 24px', background: '#34d399', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '18px' }}>Keep in Hand</button>
                        <button onClick={() => dispatch({ type: 'RESOLVE_INPUT', playerId: myPlayerId, payload: { keep: false } })} style={{ padding: '12px 24px', background: '#ef4444', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '18px' }}>Set Aside (Discard)</button>
                      </div>
                    </div>
                  </div>
                )}
                {inputType === 'SENTRY_CHOICE' && req.payload?.cards && (() => {
                  // Use original order for visual layout to prevent jumpiness
                  const orderedCards = [...req.payload.cards];
                  
                  // Helper to get effective choice
                  const getChoice = (c: any, index: number) => sentryChoices[c.id] || (index === 0 ? 'deck1' : 'deck2');
                  
                  const numDeck = orderedCards.filter((c, i) => getChoice(c, i).startsWith('deck')).length;

                  return (
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '40px' }}>
                    <div style={{ background: 'rgba(30, 41, 59, 0.85)', backdropFilter: 'blur(4px)', border: '3px solid #3b82f6', borderRadius: '12px', padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', maxWidth: '900px' }}>
                      <h2 style={{ margin: 0, color: 'white' }}>Sentry: Handle Top Cards</h2>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
                        {orderedCards.map((c: any, index: number) => {

                          const choice = getChoice(c, index);
                          const isDeck = choice.startsWith('deck');
                          
                          let label = "";
                          if (choice === 'trash') label = "🗑️ Trashing";
                          else if (choice === 'discard') label = "↪️ Discarding";
                          else {
                             // Labels removed per user request (visual overlap indicates order)
                             label = "";
                          }
                          
                          const handleChoice = (newChoice: 'trash'|'discard'|'deck1'|'deck2') => {
                             const newChoices: Record<string, 'trash'|'discard'|'deck1'|'deck2'> = { ...sentryChoices, [c.id]: newChoice };
                             setSentryChoices(newChoices);
                          };
                          
                          // Default fallback if they untoggle trash/discard: we want to assign them 'deck1' or 'deck2' safely
                          const toggleToDeck = () => {
                              const newChoices = { ...sentryChoices };
                              // If there's already a deck1, make this deck2, else deck1
                              const hasDeck1 = orderedCards.some((other, i) => other.id !== c.id && getChoice(other, i) === 'deck1');
                              newChoices[c.id] = hasDeck1 ? 'deck2' : 'deck1';
                              setSentryChoices(newChoices);
                          };
                          
                          
                          let x = 0;
                          let y = 0;
                          let z = 1;
                          
                          if (numDeck === 2) {
                            if (choice === 'deck1') {
                              x = index === 0 ? 15 : -15; // move towards center
                              y = -20;
                              z = 10;
                            } else if (choice === 'deck2') {
                              x = index === 0 ? 15 : -15;
                              y = 20;
                              z = 5;
                            }
                          }

                          return (
                            <motion.div 
                              key={c.id} 
                              animate={{ x, y, zIndex: z }}
                              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.85)', padding: '15px', borderRadius: '8px', border: choice === 'deck1' ? '2px solid #3b82f6' : choice === 'deck2' ? '2px solid #64748b' : '2px solid transparent' }}
                            >
                              <div style={{ fontWeight: 'bold', color: isDeck ? '#3b82f6' : (choice==='trash' ? '#ef4444' : '#eab308'), fontSize: '18px', height: '24px' }}>{label}</div>
                              <div style={{ width: '130px', height: '195px', backgroundImage: `url(${CARD_IMAGES[c.cardId]})`, backgroundSize: '100% 100%', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}></div>
                              <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                                <button onClick={() => choice === 'trash' ? toggleToDeck() : handleChoice('trash')} style={{ padding: '8px 12px', background: choice === 'trash' ? '#ef4444' : '#334155', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Trash</button>
                                <button onClick={() => choice === 'discard' ? toggleToDeck() : handleChoice('discard')} style={{ padding: '8px 12px', background: choice === 'discard' ? '#eab308' : '#334155', color: choice === 'discard' ? 'black' : 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Discard</button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                      
                      <div style={{ height: '40px', display: 'flex', alignItems: 'center' }}>
                        <button 
                          disabled={numDeck !== 2 || orderedCards.length !== 2}
                          onClick={() => {
                             if (numDeck !== 2 || orderedCards.length !== 2) return;
                             const newChoices: Record<string, 'trash'|'discard'|'deck1'|'deck2'> = { ...sentryChoices };
                             newChoices[orderedCards[0].id] = getChoice(orderedCards[0], 0) === 'deck1' ? 'deck2' : 'deck1';
                             newChoices[orderedCards[1].id] = getChoice(orderedCards[1], 1) === 'deck1' ? 'deck2' : 'deck1';
                             setSentryChoices(newChoices);
                          }}
                          style={{ padding: '8px 20px', background: (numDeck === 2 && orderedCards.length === 2) ? '#8b5cf6' : '#475569', color: (numDeck === 2 && orderedCards.length === 2) ? 'white' : '#94a3b8', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: (numDeck === 2 && orderedCards.length === 2) ? 'pointer' : 'not-allowed', fontSize: '16px', opacity: (numDeck === 2 && orderedCards.length === 2) ? 1 : 0.5 }}
                        >
                          🔄 Swap Deck Order
                        </button>
                      </div>

                      <button 
                        onClick={() => {
                          const trashIds = req.payload.cards.filter((c:any) => getChoice(c, orderedCards.indexOf(c)) === 'trash').map((c:any) => c.id);
                          const discardIds = req.payload.cards.filter((c:any) => getChoice(c, orderedCards.indexOf(c)) === 'discard').map((c:any) => c.id);
                          
                          // Deck ids need to be ordered according to 'deck1' vs 'deck2'!
                          const deckCards = orderedCards.filter((c:any) => getChoice(c, orderedCards.indexOf(c)).startsWith('deck'));
                          deckCards.sort((a, b) => {
                             const aChoice = getChoice(a, orderedCards.indexOf(a));
                             const bChoice = getChoice(b, orderedCards.indexOf(b));
                             if (aChoice === 'deck1' && bChoice === 'deck2') return -1;
                             if (aChoice === 'deck2' && bChoice === 'deck1') return 1;
                             return 0;
                          });
                          const deckIds = deckCards.map(c => c.id);
                          
                          dispatch({ type: 'RESOLVE_INPUT', playerId: myPlayerId, payload: { trashIds, discardIds, deckIds } });
                          setSentryChoices({});
                        }} 
                        style={{ padding: '12px 30px', background: 'white', color: '#1e293b', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '18px', marginTop: '10px' }}
                      >
                        Confirm Selections
                      </button>
                    </div>
                  </div>
                  );
                })()}
              </div>
            );
          })()}
          
          {/* Play Area */}
          <div className="no-scrollbar" style={{ border: '1px solid #475569', padding: '15px', minHeight: '300px', maxHeight: '450px', overflowY: 'auto', overflowX: 'hidden', borderRadius: '8px', background: '#0f172a' }}>
            {gameState.status === 'Finished' && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
                <div style={{ padding: '10px 30px', background: gameState.winnerId === myPlayerId ? '#22c55e' : 'rgba(0,0,0,0.8)', color: 'white', borderRadius: '12px', textAlign: 'center', fontSize: '24px', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', border: '2px solid rgba(255,255,255,0.2)' }}>
                  {gameState.winnerId === myPlayerId ? "🏆 You Won!" : `🏆 Winner: ${gameState.winnerId && gameState.players[gameState.winnerId] ? gameState.players[gameState.winnerId].name : 'Unknown'}`}
                </div>
              </div>
            )}
            {(() => {
              const groupedPlay: typeof playAreaCards[] = [];
              playAreaCards.forEach(c => {
                if (groupedPlay.length > 0 && groupedPlay[groupedPlay.length - 1][0].cardId === c.cardId) {
                  groupedPlay[groupedPlay.length - 1].push(c);
                } else {
                  groupedPlay.push([c]);
                }
              });
              return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingLeft: '10px' }}>
              {groupedPlay.map(group => (
                <div key={`play-${group[0].cardId}`} style={{ display: 'flex' }}>
                  <AnimatePresence>
                    {group.map((card, i) => {
                       const isGrouped = i > 0;
                       return (
                         <div key={card.id} style={{ marginLeft: isGrouped ? '-60px' : '0px', zIndex: i, position: 'relative' }}>
                           {renderCard(card, i, undefined, false, isGrouped)}
                         </div>
                       );
                    })}
                  </AnimatePresence>
                </div>
              ))}
            </div>
              );
            })()}
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
          <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Game Length:</label>
          <select 
            disabled={!isLobby}
            value={gameState.settings?.gameLength || 'Normal'}
            onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { ...(gameState.settings || {}), gameLength: e.target.value } })}
            style={{ background: '#1e293b', color: 'white', border: '1px solid #475569', borderRadius: '4px', padding: '4px', cursor: isLobby ? 'pointer' : 'not-allowed' }}
          >
            <option value="Normal">Normal</option>
            <option value="Short">Short</option>
            <option value="Fast">Fast</option>
            <option value="Marathon">Marathon</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', marginBottom: '16px' }}>
          <input
            type="checkbox"
            id="openGameSetting"
            disabled={!isLobby}
            checked={!!gameState.settings?.openGame}
            onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { ...(gameState.settings || {}), openGame: e.target.checked } })}
            style={{ cursor: isLobby ? 'pointer' : 'not-allowed' }}
          />
          <label htmlFor="openGameSetting" style={{ fontSize: '13px', color: '#cbd5e1', cursor: isLobby ? 'pointer' : 'not-allowed' }}>
            Open Game (Show all players' hands & decks - for debugging)
          </label>
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
                <span 
                  style={{ color: isActive ? '#60a5fa' : '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }} 
                  onClick={(e) => { e.stopPropagation(); showPopup(e, def); }}
                >
                  {def.name}
                </span>
                <span style={{ color: '#94a3b8', fontSize: '11px', cursor: isLobby ? 'pointer' : 'default' }} onClick={() => isLobby && toggleCard(cardId)}>
                  ({def.cost}$)
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
        bottomAreaRatio={25}
        gameName={gameState.status === 'Playing' ? `Dominion [Prog: ${gameProgress.toFixed(2)} | EstTotalRounds: ${estimatedRoundsLeft.toFixed(1)} | AvgBuyPwr: ${avgBuyingPower.toFixed(1)} | ProvEst: ${roundsToDepleteProvinces.toFixed(1)}]` : "Dominion"}
        helpText="Build your deck and collect Victory Points! First to buy Provinces or empty 3 piles wins."
        helpUrl="https://en.wikipedia.org/wiki/Dominion_(card_game)"
      renderGameSpecificPlayerDetails={renderPlayerDetails}
      renderGameSpecificStats={() => <DominionStats gameState={gameState} />}
      renderLogMessage={renderLogMessage}
      settings={renderSettings()}
      hideWinnerBanner={true}
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
