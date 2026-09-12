const fs = require('fs');
let code = fs.readFileSync('games/king-of-tokyo/src/components/KotBoard.tsx', 'utf8');

code = code.replace(
  `      {status === 'Playing' && (
        <div style={{ position: 'fixed', top: '15px', left: '200px', zIndex: 100, display: 'flex', gap: '5px', alignItems: 'center' }}>
             <span style={{ fontSize: '14px', color: 'white', textShadow: '1px 1px 2px black' }}>Bot Speed:</span>
             <select
               value={gameState.settings.gameSpeed || 'Normal'}
               onChange={e => dispatch({ type: 'UPDATE_SETTINGS', payload: { ...gameState.settings, gameSpeed: e.target.value } })}
               style={{ background: '#1e293b', color: 'white', border: '1px solid #60a5fa', borderRadius: '4px', padding: '2px 5px' }}
             >
                <option value="Slow">Slow</option>
                <option value="Normal">Normal</option>
                <option value="Fast">Fast</option>
             </select>
        </div>
      )}`,
  ``
);

fs.writeFileSync('games/king-of-tokyo/src/components/KotBoard.tsx', code);
