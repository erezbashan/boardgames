#!/bin/bash
cd /Users/erezbashan/workspace/boardgames

echo "" > packages/boardgame-core/.npmignore
echo "" > games/flips/.npmignore
echo "" > games/king-of-tokyo/.npmignore
echo "" > games/acquire/.npmignore

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
npm install
npx firebase deploy --only functions
