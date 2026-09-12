const fs = require('fs');
let code = fs.readFileSync('games/king-of-tokyo/src/components/KotBoard.tsx', 'utf8');

code = code.replace(/disabled=\{status !== 'Lobby'\}/g, '');
code = code.replace(/className="modern-input" /g, 'className="modern-input" disabled={status !== \\'Lobby\\'} ');

// The buttons also had disabled={status !== 'Lobby'} but they don't have className="modern-input"
// Let's just fix it properly instead of regex mess.

