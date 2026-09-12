const fs = require('fs');
let code = fs.readFileSync('games/king-of-tokyo/src/components/KotBoard.tsx', 'utf8');

const additionalSettings = `
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '300px', alignItems: 'center' }}>
        <label style={{ fontSize: '18px' }}>Game Speed:</label>
        <select
          value={currentSettings.gameSpeed || 'Normal'}
          onChange={e => dispatch({ type: 'UPDATE_SETTINGS', payload: { ...currentSettings, gameSpeed: e.target.value } })}
          className="modern-input"
          style={{ width: '120px', display: 'inline-block' }}
        >
           <option value="Slow">Slow</option>
           <option value="Normal">Normal</option>
           <option value="Fast">Fast</option>
        </select>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', width: '300px', alignItems: 'center', marginBottom: '15px' }}>
        <label style={{ fontSize: '18px' }} title="If checked, you must enter Tokyo when it's empty even if you didn't attack (2nd Edition rules).">
           2nd Ed. Tokyo Rule:
        </label>
        <input 
          type="checkbox"
          checked={!!currentSettings.secondEditionTokyoRule}
          onChange={e => dispatch({ type: 'UPDATE_SETTINGS', payload: { ...currentSettings, secondEditionTokyoRule: e.target.checked } })}
          style={{ width: '20px', height: '20px' }}
        />
      </div>
`;

code = code.replace(
  `<div style={{ display: 'flex', justifyContent: 'space-between', width: '300px', alignItems: 'center' }}>
        <label style={{ fontSize: '18px' }}>Max/Initial Health:</label>`,
  additionalSettings + "\n      " + `<div style={{ display: 'flex', justifyContent: 'space-between', width: '300px', alignItems: 'center' }}>
        <label style={{ fontSize: '18px' }}>Max/Initial Health:</label>`
);

// If the game is NOT in lobby, we still want to show the Game Speed and 2nd Ed Tokyo rule somewhere!
// Let's add a small floating settings bar in the main view.
const floatingSettings = `
      {status === 'Playing' && (
        <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.7)', padding: '10px', borderRadius: '8px', zIndex: 100, display: 'flex', gap: '15px', alignItems: 'center' }}>
           <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
             <span style={{ fontSize: '12px' }}>Speed:</span>
             <select
               value={gameState.settings.gameSpeed || 'Normal'}
               onChange={e => dispatch({ type: 'UPDATE_SETTINGS', payload: { ...gameState.settings, gameSpeed: e.target.value } })}
               style={{ background: 'transparent', color: 'white', border: '1px solid #60a5fa', borderRadius: '4px', padding: '2px' }}
             >
                <option value="Slow" style={{color: 'black'}}>Slow</option>
                <option value="Normal" style={{color: 'black'}}>Normal</option>
                <option value="Fast" style={{color: 'black'}}>Fast</option>
             </select>
           </div>
           <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
             <span style={{ fontSize: '12px' }} title="Mandatory Tokyo Entry">2nd Ed Rule:</span>
             <input 
               type="checkbox"
               checked={!!gameState.settings.secondEditionTokyoRule}
               onChange={e => dispatch({ type: 'UPDATE_SETTINGS', payload: { ...gameState.settings, secondEditionTokyoRule: e.target.checked } })}
             />
           </div>
        </div>
      )}
`;

code = code.replace(
  "return (\n    <div className=\"kot-board-container\">",
  "return (\n    <div className=\"kot-board-container\">" + floatingSettings
);

fs.writeFileSync('games/king-of-tokyo/src/components/KotBoard.tsx', code);
