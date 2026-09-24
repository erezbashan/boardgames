const fs = require('fs');

let css = fs.readFileSync('games/splendor/src/SplendorBoard.css', 'utf8');
let tsx = fs.readFileSync('games/splendor/src/SplendorBoard.tsx', 'utf8');

// 1. Nobles flex-wrap: nowrap
css = css.replace(/(\.splendor-nobles \{[\s\S]*?)flex-wrap: wrap;/g, '$1flex-wrap: nowrap;');

// 2. Bank tokens flex-wrap: nowrap
css = css.replace(/(\.splendor-bank-tokens \{[\s\S]*?)flex-wrap: wrap;/g, '$1flex-wrap: nowrap;');

// 3. Card dimensions and gaps to fit vertically
css = css.replace(/\.splendor-card \{\s*width: 6rem;\s*height: 8rem;/g, 
  '.splendor-card {\n  width: 5.5rem;\n  height: 6.5rem;');
css = css.replace(/\.splendor-card-empty \{\s*width: 6rem;\s*height: 8rem;/g, 
  '.splendor-card-empty {\n  width: 5.5rem;\n  height: 6.5rem;');
css = css.replace(/\.splendor-deck \{\s*width: 5rem;\s*height: 7rem;/g, 
  '.splendor-deck {\n  width: 5rem;\n  height: 6.5rem;');
css = css.replace(/\.splendor-market \{([\s\S]*?)gap: 1.5rem;/g, '.splendor-market {$1gap: 0.5rem;');

// 4. Add animations
const animations = `
@keyframes popIn {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
.splendor-card, .splendor-token, .splendor-noble, .splendor-stat-token, .splendor-stat-bonus {
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
.splendor-card {
  transition: transform 0.2s, box-shadow 0.2s;
}
.splendor-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 15px 25px -5px rgba(0,0,0,0.3);
  z-index: 10;
}
`;
css = css + '\n' + animations;

fs.writeFileSync('games/splendor/src/SplendorBoard.css', css);

// 5. Remove "Tokens" and "Bonuses" text, replace with icons/tooltips
tsx = tsx.replace(
  /<div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Tokens<\/div>/g, 
  ''
);
tsx = tsx.replace(
  /<div style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.25rem 0' }}>Bonuses<\/div>/g, 
  ''
);
// Change "Reserved" to just an icon or smaller
tsx = tsx.replace(
  /<div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Reserved<\/div>/g, 
  '<div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>⏳</div>'
);

// Add titles for tooltips to player details tokens/bonuses to explain what they are
tsx = tsx.replace(
  /className="splendor-stat-token"/g,
  'className="splendor-stat-token" title="Current Token"'
);
tsx = tsx.replace(
  /className="splendor-stat-bonus"/g,
  'className="splendor-stat-bonus" title="Permanent Card Gem"'
);

fs.writeFileSync('games/splendor/src/SplendorBoard.tsx', tsx);
