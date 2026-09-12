const fs = require('fs');
let code = fs.readFileSync('games/king-of-tokyo/src/components/KotBoard.tsx', 'utf8');

// Replace className="modern-input" disabled={status !== 'Lobby'} 
// back to className="modern-input"
code = code.replace(/className="modern-input" disabled=\{status !== 'Lobby'\}/g, 'className="modern-input"');

// And now add it ONLY to the gameSpeed one!
code = code.replace(
  \`        <select
          value={currentSettings.gameSpeed || 'Normal'}
          onChange={e => dispatch({ type: 'UPDATE_SETTINGS', payload: { ...currentSettings, gameSpeed: e.target.value } })}
          className="modern-input"
          style={{ width: '120px', display: 'inline-block' }}
        >\`,
  \`        <select
          value={currentSettings.gameSpeed || 'Normal'}
          onChange={e => dispatch({ type: 'UPDATE_SETTINGS', payload: { ...currentSettings, gameSpeed: e.target.value } })}
          disabled={status !== 'Lobby'}
          className="modern-input"
          style={{ width: '120px', display: 'inline-block' }}
        >\`
);

fs.writeFileSync('games/king-of-tokyo/src/components/KotBoard.tsx', code);
