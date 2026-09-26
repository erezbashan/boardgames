import re

with open('games/dominion/src/ui/DominionBoard.tsx', 'r') as f:
    code = f.read()

# Add CSS Keyframes at the top of the file
old_imports = "import React, { useState } from 'react';\nimport { motion, AnimatePresence } from 'framer-motion';"
new_imports = """import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const blinkKeyframes = `
  @keyframes blinkGlow {
    0% { box-shadow: 0 0 5px rgba(251, 191, 36, 0.5); }
    50% { box-shadow: 0 0 20px rgba(251, 191, 36, 1); }
    100% { box-shadow: 0 0 5px rgba(251, 191, 36, 0.5); }
  }
`;"""
if "blinkGlow" not in code:
    code = code.replace(old_imports, new_imports)

# Inject <style> tag
if "blinkGlow" in code and "<style>{blinkKeyframes}</style>" not in code:
    code = code.replace("return (\n    <GameLayout", "return (\n    <>\n    <style>{blinkKeyframes}</style>\n    <GameLayout")
    code = code.replace("</GameLayout>\n  );", "</GameLayout>\n    </>\n  );")

# Update Market card rendering to show $ cost and blink if affordable in BUY phase
# Find renderMarketCard
code = re.sub(
    r"const renderMarketCard = \(def: CardDefinition, count: number\) => \{.*?\n      <div style=\{\{",
    r'''const renderMarketCard = (def: CardDefinition, count: number) => {
    const affordable = isMyTurn && gameState.phase === 'BUY' && me.buys > 0 && me.coins >= def.cost && count > 0;
    return (
      <div style={{''',
    code,
    flags=re.DOTALL
)

# Update market card styles to include animation
old_market_style = "cursor: count > 0 ? 'pointer' : 'not-allowed',"
new_market_style = "cursor: count > 0 ? 'pointer' : 'not-allowed', animation: affordable ? 'blinkGlow 1.5s infinite' : 'none',"
code = code.replace(old_market_style, new_market_style)

# Update Price and Count indicators
old_price = """          <div style={{ position: 'absolute', bottom: '-5px', left: '-5px', width: '28px', height: '28px', background: '#f59e0b', borderRadius: '50%', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            {def.cost}
          </div>
          <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', width: '24px', height: '24px', background: '#1e293b', color: 'white', borderRadius: '4px', border: '1px solid #94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>
            {count}
          </div>"""
new_price = """          <div style={{ position: 'absolute', bottom: '-5px', left: '-5px', width: '32px', height: '32px', background: '#f59e0b', borderRadius: '50%', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            ${def.cost}
          </div>
          <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: '#1e293b', color: 'white', padding: '2px 6px', borderRadius: '4px', border: '1px solid #94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '11px' }}>
            {count} left
          </div>"""
code = code.replace(old_price, new_price)

# Blink Action cards in hand
old_render_card = "const isGrouped = i > 0 && handCards[i-1].cardId === card.cardId;"
new_render_card = """const isGrouped = i > 0 && handCards[i-1].cardId === card.cardId;
                     const def = getCardDef(card.cardId);
                     const isPlayableAction = isMyTurn && gameState.phase === 'ACTION' && me.actions > 0 && def.types.includes('ACTION');"""
code = code.replace(old_render_card, new_render_card)

old_hand_card_render = "{renderCard(card, i, () => {"
new_hand_card_render = """<div style={{ animation: isPlayableAction ? 'blinkGlow 1.5s infinite' : 'none', borderRadius: '8px' }}>
                           {renderCard(card, i, () => {"""
code = code.replace(old_hand_card_render, new_hand_card_render)

old_hand_card_close = "}, isSelected, isGrouped)}"
new_hand_card_close = "}, isSelected, isGrouped)}\n                         </div>"
code = code.replace(old_hand_card_close, new_hand_card_close)

# Blink End Phase button
old_button = "border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}"
new_button = "border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.2)', animation: (gameState.phase === 'ACTION' && me.actions === 0) || (gameState.phase === 'BUY' && me.buys === 0) ? 'blinkGlow 1.5s infinite' : 'none' }}"
code = code.replace(old_button, new_button)

# Add scrollbars to Hand and Play Area
old_play_area_style = "border: '1px solid #475569', padding: '15px', minHeight: '180px', borderRadius: '8px', background: '#0f172a' }}"
new_play_area_style = "border: '1px solid #475569', padding: '15px', minHeight: '180px', maxHeight: '250px', overflowY: 'auto', borderRadius: '8px', background: '#0f172a' }}"
code = code.replace(old_play_area_style, new_play_area_style)

old_hand_style = "flex: 1, display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start', background: '#0f172a', padding: '15px', borderRadius: '8px', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)', paddingLeft: '10px' }}"
new_hand_style = "flex: 1, display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start', background: '#0f172a', padding: '15px', borderRadius: '8px', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)', paddingLeft: '10px', overflowY: 'auto', maxHeight: '200px' }}"
code = code.replace(old_hand_style, new_hand_style)

with open('games/dominion/src/ui/DominionBoard.tsx', 'w') as f:
    f.write(code)

print("UI Patched")
