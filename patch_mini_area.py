import re

with open('games/dominion/src/ui/DominionBoard.tsx', 'r') as f:
    code = f.read()

old_details = """        {playerId !== myPlayerId && (
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{color: '#94a3b8', fontSize: '10px'}}>Discard:</span>
            <div style={{ position: 'relative', width: '40px', height: '60px', border: '1px solid #475569', borderRadius: '4px' }}>
              <AnimatePresence>
                 {p.discard.map((card, i) => (
                    <motion.div
                      layoutId={card.id}
                      key={card.id}
                      initial={{ opacity: 0, scale: 4, x: -200, y: 100 }}
                      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: `url(${CARD_IMAGES[card.cardId]})`, backgroundSize: 'cover', borderRadius: '4px', zIndex: i }}
                    />
                 ))}
              </AnimatePresence>
            </div>
          </div>
        )}"""

new_details = """        {playerId !== myPlayerId && (
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <div style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>
                <div style={{ width: '30px', height: '45px', border: '1px solid #475569', borderRadius: '3px', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>{p.deck.length}</div>
                Deck
             </div>
             <div style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>
                <div style={{ width: '30px', height: '45px', border: '1px solid #475569', borderRadius: '3px', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>{p.hand.length}</div>
                Hand
             </div>
             <div style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>
                <div style={{ position: 'relative', width: '30px', height: '45px', border: '1px solid #475569', borderRadius: '3px', background: '#1e293b' }}>
                  <AnimatePresence>
                     {p.discard.map((card, i) => (
                        <motion.div
                          layoutId={card.id}
                          key={card.id}
                          initial={{ opacity: 0, scale: 4, x: -200, y: 100 }}
                          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: `url(${CARD_IMAGES[card.cardId]})`, backgroundSize: 'cover', borderRadius: '3px', zIndex: i }}
                        />
                     ))}
                  </AnimatePresence>
                </div>
                Discard
             </div>
          </div>
        )}"""

code = code.replace(old_details, new_details)

with open('games/dominion/src/ui/DominionBoard.tsx', 'w') as f:
    f.write(code)

print("Mini Area Patched")
