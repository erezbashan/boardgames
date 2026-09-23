const fs = require('fs');
let file = 'packages/boardgame-core/src/engine/baseReducer.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  /if \(state\.status !== 'Lobby'\) return state;\n      return \{ \.\.\.state, settings: \{ \.\.\.\(state\.settings \|\| \{\}\), \.\.\.action\.payload \} \};/,
  'return { ...state, settings: { ...(state.settings || {}), ...action.payload } };'
);
fs.writeFileSync(file, content);

file = 'packages/boardgame-core/src/components/GameLayout.tsx';
content = fs.readFileSync(file, 'utf8');
content = content.replace(
  /disabled=\{status !== 'Lobby'\}/,
  ''
);
content = content.replace(
  /\{status !== 'Lobby' && <p style=\{\{ color: 'gray', fontSize: '12px', marginTop: '5px' \}\}>Settings can only be changed in the Lobby\.<\/p>\}/,
  ''
);
fs.writeFileSync(file, content);

file = 'games/acquire/src/components/AcquireBoard.tsx';
content = fs.readFileSync(file, 'utf8');
content = content.replace(
  /disabled=\{state\.status !== 'Lobby'\}/,
  ''
);
content = content.replace(
  /opacity: state\.status !== 'Lobby' \? 0\.5 : 1, cursor: state\.status !== 'Lobby' \? 'not-allowed' : 'pointer'/,
  'opacity: 1, cursor: \'pointer\''
);
fs.writeFileSync(file, content);

file = 'games/king-of-tokyo/src/components/KotBoard.tsx';
content = fs.readFileSync(file, 'utf8');
content = content.replace(
  /<select\n          value=\{currentSettings\.gameSpeed\}\n          onChange=\{e => dispatch\(\{ type: 'UPDATE_SETTINGS', payload: \{ \.\.\.currentSettings, gameSpeed: e\.target\.value \} \}\)\}\n          disabled=\{status !== 'Lobby'\}\n          className="modern-input"\n          style=\{\{ width: '120px', display: 'inline-block', opacity: status !== 'Lobby' \? 0\.5 : 1, cursor: status !== 'Lobby' \? 'not-allowed' : 'pointer' \}\}/,
  `<select
          value={currentSettings.gameSpeed}
          onChange={e => dispatch({ type: 'UPDATE_SETTINGS', payload: { ...currentSettings, gameSpeed: e.target.value } })}
          className="modern-input"
          style={{ width: '120px', display: 'inline-block', opacity: 1, cursor: 'pointer' }}`
);
fs.writeFileSync(file, content);
