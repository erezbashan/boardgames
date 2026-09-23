const fs = require('fs');
let code = fs.readFileSync('packages/boardgame-core/src/components/GameLayout.tsx', 'utf8');

const targetStr = `      <Modal isOpen={showSettings} title="Game Settings" onClose={() => setShowSettings(false)}>
        {settings}
      </Modal>`;

const replacementStr = `      <Modal isOpen={showSettings} title="Game Settings" onClose={() => setShowSettings(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Shared Settings */}
          <div>
            <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px' }}>General Settings</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Speed of Play:</label>
              <select 
                className="modern-input"
                style={{ width: '150px' }}
                disabled={status !== 'Lobby'}
                value={gameState.settings?.gameSpeed || 'Normal'}
                onChange={e => dispatch({ type: 'UPDATE_SETTINGS', payload: { settings: { ...gameState.settings, gameSpeed: e.target.value } } })}
              >
                <option value="Slow">Slow</option>
                <option value="Normal">Normal</option>
                <option value="Fast">Fast</option>
                <option value="Instant">Instant</option>
              </select>
            </div>
            {status !== 'Lobby' && <p style={{ color: 'gray', fontSize: '12px', marginTop: '5px' }}>Settings can only be changed in the Lobby.</p>}
          </div>

          {/* Game Specific Settings */}
          {settings && (
            <div>
              <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px' }}>Game Rules</h4>
              {settings}
            </div>
          )}
        </div>
      </Modal>`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('packages/boardgame-core/src/components/GameLayout.tsx', code);
