#!/bin/bash
cd /Users/erezbashan/workspace/king-of-tokyo

# Pack the local packages
cd packages/boardgame-core
npm pack
mv erez-boardgame-core-1.0.0.tgz ../../deployments/backend/boardgame-core.tgz

cd ../../games/flips
npm pack
mv erez-flips-1.0.0.tgz ../../deployments/backend/flips.tgz

cd ../../games/king-of-tokyo
npm pack
mv erez-king-of-tokyo-1.0.0.tgz ../../deployments/backend/king-of-tokyo.tgz

cd ../../deployments/backend
# Update package.json to point to the tarballs
sed -i '' 's/"@erez\/boardgame-core": "*"/"@erez\/boardgame-core": "file:.\/boardgame-core.tgz"/g' package.json
sed -i '' 's/"@erez\/flips": "*"/"@erez\/flips": "file:.\/flips.tgz"/g' package.json
sed -i '' 's/"@erez\/king-of-tokyo": "*"/"@erez\/king-of-tokyo": "file:.\/king-of-tokyo.tgz"/g' package.json

echo "Packed and updated package.json"
