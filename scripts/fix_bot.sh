sed -i '' 's/let yield_mVp = Math.min(20, player.vp + 1);/let next_oVp = Math.min(20, oVp + 1);/g' games/king-of-tokyo/src/bots/ExactBot.ts
sed -i '' 's/let val_yield = 1.0;/let val_yield = 1.0;/g' games/king-of-tokyo/src/bots/ExactBot.ts
sed -i '' 's/if (yield_mVp < 20) val_yield = 1.0 - (exactConfig\[getStateKey(oVp, oHlt, yield_mVp, player.health, 1)\] || 0.5);/if (next_oVp < 20) val_yield = exactConfig[getStateKey(player.vp, player.health, next_oVp, oHlt, 0)] || 0.5; else val_yield = 0.0;/g' games/king-of-tokyo/src/bots/ExactBot.ts
sed -i '' 's/let val_stay = 1.0 - (exactConfig\[getStateKey(oVp, oHlt, player.vp, player.health, 0)\] || 0.5);/let val_stay = exactConfig[getStateKey(player.vp, player.health, oVp, oHlt, 1)] || 0.5;/g' games/king-of-tokyo/src/bots/ExactBot.ts
