const fs = require('fs');
const file = 'games/acquire/src/components/AcquireBoard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /border: isGold \? '1\.5px solid #FFD700' : isSilver \? '1\.5px solid #C0C0C0' : `1px solid var\(--corp-\$\{cName\.toLowerCase\(\)\}\)`/,
  'border: `1.5px solid var(--corp-${cName.toLowerCase()})`'
);

content = content.replace(
  /background: isGold \? 'linear-gradient\(135deg, rgba\(255,215,0,0\.2\), rgba\(0,0,0,0\.4\)\)' : isSilver \? 'linear-gradient\(135deg, rgba\(192,192,192,0\.2\), rgba\(0,0,0,0\.4\)\)' : 'rgba\(0,0,0,0\.3\)'/,
  'background: isGold ? \'linear-gradient(135deg, rgba(255,215,0,0.4), rgba(0,0,0,0.6))\' : isSilver ? \'linear-gradient(135deg, rgba(192,192,192,0.4), rgba(0,0,0,0.6))\' : \'rgba(0,0,0,0.3)\''
);

fs.writeFileSync(file, content);
