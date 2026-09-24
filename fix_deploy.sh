#!/bin/bash
cd /Users/erezbashan/workspace/boardgames

echo "Building workspaces..."
npm run build --workspaces

# Pack the local packages
echo "Packing boardgame-core..."
cd packages/boardgame-core
npm pack
mv erez-boardgame-core-1.0.0.tgz ../../deployments/backend/boardgame-core.tgz

echo "Packing flips..."
cd ../../games/flips
npm pack
mv erez-flips-1.0.0.tgz ../../deployments/backend/flips.tgz

echo "Packing king-of-tokyo..."
cd ../../games/king-of-tokyo
npm pack
mv erez-king-of-tokyo-1.0.0.tgz ../../deployments/backend/king-of-tokyo.tgz

echo "Packing acquire..."
cd ../../games/acquire
npm pack
mv erez-acquire-1.0.0.tgz ../../deployments/backend/acquire.tgz

cd ../../deployments/backend
echo "Updating package.json..."
# Add dependencies if they don't exist
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json'));
pkg.dependencies['@erez/boardgame-core'] = 'file:./boardgame-core.tgz';
pkg.dependencies['@erez/flips'] = 'file:./flips.tgz';
pkg.dependencies['@erez/king-of-tokyo'] = 'file:./king-of-tokyo.tgz';
pkg.dependencies['@erez/acquire'] = 'file:./acquire.tgz';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

npm install
npx firebase deploy --only functions
