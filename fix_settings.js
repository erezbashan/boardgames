const fs = require('fs');
let code = fs.readFileSync('games/king-of-tokyo/src/components/KotBoard.tsx', 'utf8');

// 1. Remove disabled from gameSpeed
code = code.replace(
  `        <select
          value={currentSettings.gameSpeed || 'Normal'}
          onChange={e => dispatch({ type: 'UPDATE_SETTINGS', payload: { ...currentSettings, gameSpeed: e.target.value } })}
          disabled={status !== 'Lobby'}
          className="modern-input"
          style={{ width: '120px', display: 'inline-block' }}
        >`,
  `        <select
          value={currentSettings.gameSpeed || 'Normal'}
          onChange={e => dispatch({ type: 'UPDATE_SETTINGS', payload: { ...currentSettings, gameSpeed: e.target.value } })}
          className="modern-input"
          style={{ width: '120px', display: 'inline-block' }}
        >`
);

// 2. Add visual feedback for other inputs
// For 2nd Edition Checkbox
code = code.replace(
  `disabled={status !== 'Lobby'}
          style={{ width: '20px', height: '20px' }}`,
  `disabled={status !== 'Lobby'}
          style={{ width: '20px', height: '20px', opacity: status !== 'Lobby' ? 0.5 : 1, cursor: status !== 'Lobby' ? 'not-allowed' : 'pointer' }}`
);

// For Max Health, Max VP, Starting Energy, Cards Per Type
// They have style={{ width: '80px', display: 'inline-block' }}
code = code.replace(
  /style=\{\{ width: '80px', display: 'inline-block' \}\}/g,
  `style={{ width: '80px', display: 'inline-block', opacity: status !== 'Lobby' ? 0.5 : 1, cursor: status !== 'Lobby' ? 'not-allowed' : 'auto' }}`
);

// For Labels to also look disabled, we can wrap the labels in <div style={{ opacity ... }}>? No, just the inputs is fine. But wait, if they want "visually apparent", maybe it's enough to gray out the inputs.

// Let's also do it for the "Select All" / "Select None" buttons? They already have opacity: status === 'Lobby' ? 1 : 0.5

// And for the cards checkbox:
code = code.replace(
  `disabled={status !== 'Lobby'}
                      onChange={(e) => {`,
  `disabled={status !== 'Lobby'}
                      style={{ opacity: status !== 'Lobby' ? 0.5 : 1, cursor: status !== 'Lobby' ? 'not-allowed' : 'pointer' }}
                      onChange={(e) => {`
);

fs.writeFileSync('games/king-of-tokyo/src/components/KotBoard.tsx', code);
