const fs = require('fs');
let content = fs.readFileSync('frontend/src/GameOverScreen.tsx', 'utf8');

// The `index` parameter was used in `playerIds.map((id, index) => {` and now it's unused.
content = content.replace(`{playerIds.map((id, index) => {`, `{playerIds.map(id => {`);

// In the chart lines, it was `{playerIds.map((id, index) => (`
content = content.replace(`{playerIds.map((id, index) => (`, `{playerIds.map(id => (`);
content = content.replace(`{playerIds.map((id, index) => (`, `{playerIds.map(id => (`);
content = content.replace(`{playerIds.map((id, index) => (`, `{playerIds.map(id => (`);

fs.writeFileSync('frontend/src/GameOverScreen.tsx', content, 'utf8');
