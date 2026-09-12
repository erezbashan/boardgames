const fs = require('fs');
let code = fs.readFileSync('games/king-of-tokyo/src/components/KotBoard.tsx', 'utf8');

// Replace the lobby label and add disabled prop
code = code.replace(
  `        <label style={{ fontSize: '18px' }} title="If checked, you must enter Tokyo when it's empty even if you didn't attack (2nd Edition rules).">
           2nd Ed. Tokyo Rule:
        </label>`,
  `        <label style={{ fontSize: '18px' }}>
           Enter Tokyo if empty even without attack:
        </label>`
);

code = code.replace(
  `          onChange={e => dispatch({ type: 'UPDATE_SETTINGS', payload: { ...currentSettings, secondEditionTokyoRule: e.target.checked } })}
          style={{ width: '20px', height: '20px' }}`,
  `          onChange={e => dispatch({ type: 'UPDATE_SETTINGS', payload: { ...currentSettings, secondEditionTokyoRule: e.target.checked } })}
          disabled={status !== 'Lobby'}
          style={{ width: '20px', height: '20px' }}`
);

// Remove the toggle entirely from the floating in-game menu
code = code.replace(
  `           <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
             <span style={{ fontSize: '12px' }} title="Mandatory Tokyo Entry">2nd Ed Rule:</span>
             <input 
               type="checkbox"
               checked={!!gameState.settings.secondEditionTokyoRule}
               onChange={e => dispatch({ type: 'UPDATE_SETTINGS', payload: { ...gameState.settings, secondEditionTokyoRule: e.target.checked } })}
             />
           </div>`,
  ``
);

fs.writeFileSync('games/king-of-tokyo/src/components/KotBoard.tsx', code);
