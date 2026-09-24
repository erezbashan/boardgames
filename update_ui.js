const fs = require('fs');

// --- UPDATE REDUCER.TS ---
let reducer = fs.readFileSync('games/splendor/src/reducer.ts', 'utf8');

// Change TAKE_GEMS log from "X gem" to "[gem] [gem]"
reducer = reducer.replace(
  /\`\$\{v\} \$\{k\}\`\)\.join\(\', \'\)/g,
  "Array(v).fill(`[${k}]`)).join(' ')"
);

fs.writeFileSync('games/splendor/src/reducer.ts', reducer);

// --- UPDATE SPLENDORBOARD.TSX ---
let ui = fs.readFileSync('games/splendor/src/SplendorBoard.tsx', 'utf8');

// Import calculatePayment
if (!ui.includes('calculatePayment')) {
  ui = ui.replace(
    "import { SplendorGameState, SplendorAction, GemType, BaseGemTypes, Card } from './types';",
    "import { SplendorGameState, SplendorAction, GemType, BaseGemTypes, Card } from './types';\nimport { calculatePayment } from './reducer';"
  );
}

// Disable taking gold
ui = ui.replace(
  'const handleGemClick = (gem: GemType) => {\n    if (!isMyTurn) return;',
  "const handleGemClick = (gem: GemType) => {\n    if (!isMyTurn || gem === 'gold') return;"
);

// Disable >2 of same gem
ui = ui.replace(
  'if (newSelected[gem] === 2 && gameState.bank[gem] < 4) return;',
  'if (newSelected[gem] === 2 && gameState.bank[gem] < 4) return;\n      if (newSelected[gem] === 3) return;'
);

// Fix Take Button logic
const newTakeLogic = `
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
`;

ui = ui.replace(
  /const isMyTurn = gameState\.playerOrder\[gameState\.currentPlayerIndex\] === myPlayerId;\n  const turnState = gameState\.turnState;/g,
  `const isMyTurn = gameState.playerOrder[gameState.currentPlayerIndex] === myPlayerId;
  const turnState = gameState.turnState;
  ${newTakeLogic}`
);

// Replace the Actions UI block
ui = ui.replace(
  /\{Object\.keys\(selectedGems\)\.length > 0 && turnState === 'take_tokens' && \([\s\S]*?Cancel<\/button>\s*<\/div>\s*\)\}/g,
  `{turnState === 'take_tokens' && isMyTurn && (
              <div className="splendor-actions">
                <button onClick={submitGems} className="splendor-btn take" disabled={!canTake}>Take</button>
                <button onClick={clearSelection} className="splendor-btn cancel" disabled={totalSelected === 0}>Cancel</button>
              </div>
            )}`
);

// Card Buy disable check
ui = ui.replace(
  /const renderCard = \(card: Card \| null, tier: 1\|2\|3, isReserved = false\) => \{/g,
  `const renderCard = (card: Card | null, tier: 1|2|3, isReserved = false) => {
    const canAfford = card && gameState.players[myPlayerId] && calculatePayment(gameState.players[myPlayerId], card) !== null;`
);

ui = ui.replace(
  /<button onClick=\{\(\) => isReserved \? buyReserved\(card\.id\) : buyCard\(tier, card\.id\)\} className="splendor-card-btn buy">Buy<\/button>/g,
  `<button onClick={() => isReserved ? buyReserved(card.id) : buyCard(tier, card.id)} className="splendor-card-btn buy" disabled={!canAfford}>Buy</button>`
);

// Remove card bonus dot, add card background
ui = ui.replace(
  /<div className="splendor-card">/g,
  `<div className="splendor-card" style={{ backgroundColor: GEM_COLORS[card.bonus] }}>`
);
ui = ui.replace(
  /<div className="splendor-card-bonus" style=\{\{ backgroundColor: GEM_COLORS\[card\.bonus\] \}\} title=\{\`Provides 1 \$\{card\.bonus\}\`\} \/>/g,
  ``
);

// Add First Player indication
ui = ui.replace(
  /<h3 className="splendor-player-name">/g,
  `<h3 className="splendor-player-name">
                    {gameState.playerOrder[0] === pid && <span className="splendor-first-player-badge">1st</span>}`
);

// Add renderLogMessage
const renderLogMessageCode = `
  const renderLogMessage = (log: string, defaultColorize: (m: string) => React.ReactNode) => {
    if (!log.includes('[')) return defaultColorize(log);
    
    const parts = log.split(/(\\[[a-z]+\\])/);
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
`;

ui = ui.replace(
  /const renderPlayerDetails = \(pid: string\) => \{/g,
  renderLogMessageCode + '\n  const renderPlayerDetails = (pid: string) => {'
);

ui = ui.replace(
  /<GameLayout\s*gameName="Splendor"\s*helpText="Collect gems to buy cards and gain points\."\s*helpUrl=""\s*renderGameSpecificPlayerDetails=\{renderPlayerDetails\}\s*>/g,
  `<GameLayout 
      gameName="Splendor" 
      helpText="Collect gems to buy cards and gain points." 
      helpUrl=""
      renderGameSpecificPlayerDetails={renderPlayerDetails}
      renderLogMessage={renderLogMessage}
    >`
);

fs.writeFileSync('games/splendor/src/SplendorBoard.tsx', ui);

// --- UPDATE CSS ---
let css = fs.readFileSync('games/splendor/src/SplendorBoard.css', 'utf8');

// Gems border and roundness
css = css + `
.splendor-token, .splendor-mini-token, .splendor-stat-token, .splendor-log-gem {
  border: 2px solid rgba(255, 255, 255, 0.4) !important;
  box-sizing: border-box;
}
.splendor-token { flex-shrink: 0; }
.splendor-log-gem {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  vertical-align: middle;
  margin: 0 0.125rem;
}
.splendor-first-player-badge {
  background-color: #f59e0b;
  color: white;
  font-size: 0.6rem;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  margin-right: 0.25rem;
}
.splendor-card-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.splendor-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
`;

fs.writeFileSync('games/splendor/src/SplendorBoard.css', css);
