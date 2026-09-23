const fs = require('fs');
let css = fs.readFileSync('games/acquire/src/components/AcquireBoard.css', 'utf8');

css = css.replace(/\.board-cell\.unincorporated \{[\s\S]*?\}/, `.board-cell.unincorporated {
  background: #1e293b;
  color: #f8fafc;
  border: 1px solid #475569;
  box-shadow: inset 0 0 15px rgba(0,0,0,0.8);
  font-weight: bold;
}`);

css = css.replace(/\.board-cell\.in-hand \{[\s\S]*?\}/, `.board-cell.in-hand {
  /* Dynamic color via inline styles in React */
  border-width: 2px;
  border-style: solid;
  background-color: transparent !important;
  font-weight: normal;
  opacity: 0.8;
}`);

css = css.replace(/\.board-cell\.in-hand:hover \{[\s\S]*?\}/, `.board-cell.in-hand:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  transform: scale(1.05);
  z-index: 10;
  opacity: 1;
}`);

css += `
.my-turn-pulse {
  animation: pulse-my-turn 2s infinite;
  opacity: 1 !important;
  font-weight: bold !important;
}

@keyframes pulse-my-turn {
  0% { box-shadow: 0 0 0 0 var(--pulse-color, rgba(255,255,255,0.7)); }
  70% { box-shadow: 0 0 0 10px rgba(255,255,255,0); }
  100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
}
`;

fs.writeFileSync('games/acquire/src/components/AcquireBoard.css', css);
