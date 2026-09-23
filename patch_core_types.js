const fs = require('fs');
let code = fs.readFileSync('packages/boardgame-core/src/engine/types.ts', 'utf8');

code = code.replace(
  'prompt?: GamePrompt;\\n}',
  'prompt?: GamePrompt;\\n  settings?: SharedSettings & any;\\n}'
);

if (!code.includes('export interface SharedSettings')) {
  code = code.replace(
    'export interface BaseGameState<',
    'export interface SharedSettings {\\n  gameSpeed?: \\'Slow\\' | \\'Normal\\' | \\'Fast\\' | \\'Instant\\';\\n}\\n\\nexport interface BaseGameState<'
  );
}

code = code.replace(
  "| { type: 'SEND_CHAT_MESSAGE', payload: { sender: string, text: string, color?: string } };",
  "| { type: 'SEND_CHAT_MESSAGE', payload: { sender: string, text: string, color?: string } }\\n  | { type: 'UPDATE_SETTINGS', payload: { settings: any } };"
);

fs.writeFileSync('packages/boardgame-core/src/engine/types.ts', code);
