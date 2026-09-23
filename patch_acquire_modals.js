const fs = require('fs');
const file = 'games/acquire/src/components/AcquireBoard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add Modal import
content = content.replace(
  /import \{ GameLayout, useGameContext, AnimatedValue \} from '@erez\/boardgame-core';/,
  'import { GameLayout, useGameContext, AnimatedValue, Modal } from \'@erez/boardgame-core\';'
);

// 1. Refactor FoundCorporation
content = content.replace(
  /\{state\.phase === 'FoundCorporation' && state\.pendingFounding\?\.playerId === playerId && showMergerModal && \([\s\S]*?<\/h3>\n              <p style=\{\{ marginBottom: '1\.5rem' \}\}>Choose a corporation to found:<\/p>\n              <div className="corp-options">/,
  `{state.phase === 'FoundCorporation' && state.pendingFounding?.playerId === playerId && showMergerModal && (
          <Modal isOpen={true} title="Found a Corporation" hideClose={true}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: '1.5rem' }}>Choose a corporation to found:</p>
              <div className="corp-options">`
);

content = content.replace(
  /<\/div>\n            <\/div>\n          <\/div>\n        \)\}/,
  '              </div>\n            </div>\n          </Modal>\n        )}'
);

// 2. Refactor ChooseMergeSurvivor
content = content.replace(
  /\{state\.phase === 'ChooseMergeSurvivor' && state\.pendingSurvivorChoice\?\.playerId === playerId && showMergerModal && \([\s\S]*?<\/h3>\n              <p>A merger occurred! Choose which corporation will survive:<\/p>\n              <div className="corp-buttons" style=\{\{ display: 'flex', gap: '10px', justifyContent: 'center' \}\}>/,
  `{state.phase === 'ChooseMergeSurvivor' && state.pendingSurvivorChoice?.playerId === playerId && showMergerModal && (
          <Modal isOpen={true} title="Choose Surviving Corporation" hideClose={true}>
            <div style={{ textAlign: 'center' }}>
              <p>A merger occurred! Choose which corporation will survive:</p>
              <div className="corp-buttons" style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>`
);
// replace closing tags for ChooseMergeSurvivor
content = content.replace(
  /<\/div>\n            <\/div>\n          <\/div>\n        \)\}/,
  '              </div>\n            </div>\n          </Modal>\n        )}'
);

// 3. Refactor MergeResolution
content = content.replace(
  /\{isMyTurn && state\.phase === 'MergeResolution' && pm && dCorp && aCorp && showMergerModal && \([\s\S]*?<h4 style=\{\{ margin: '0 0 10px 0', textAlign: 'center' \}\}>Resolve Merge Stocks<\/h4>/,
  `{isMyTurn && state.phase === 'MergeResolution' && pm && dCorp && aCorp && showMergerModal && (
          <Modal isOpen={true} title="Resolve Merge Stocks" hideClose={true}>
            <div style={{ textAlign: 'center' }}>`
);
content = content.replace(
  /<\/div>\n              \)\}\n            <\/div>\n          <\/div>\n        \)\}/,
  '              </div>\n              )}\n            </div>\n          </Modal>\n        )}'
);

// 4. Refactor selectedCorp (Continental Details)
content = content.replace(
  /\{selectedCorp && \([\s\S]*?<h3 style=\{\{ margin: '0 0 20px 0', color: `var\(--corp-\$\{selectedCorp\.toLowerCase\(\)\}\)` \}\}>\{selectedCorp\} Details<\/h3>/,
  `{selectedCorp && (
          <Modal isOpen={true} title={\`\${selectedCorp} Details\`} onClose={() => setSelectedCorp(null)}>
            <div>`
);
content = content.replace(
  /<button className="btn primary" onClick=\{\(\) => setSelectedCorp\(null\)\}\n                  style=\{\{ display: 'block', width: '100%', marginTop: '15px' \}\}>\n            Close\n          <\/button>\n            <\/div>\n          <\/div>\n        \)\}/,
  '<button className="btn primary" onClick={() => setSelectedCorp(null)}\n                  style={{ display: \'block\', width: \'100%\', marginTop: \'15px\' }}>\n            Close\n          </button>\n            </div>\n          </Modal>\n        )}'
);

fs.writeFileSync(file, content);
