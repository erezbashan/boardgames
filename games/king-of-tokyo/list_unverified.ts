// @ts-nocheck
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(path) {
  if (path.endsWith('.css')) return {};
  if (path === '@erez/boardgame-core') {
    return {
      baseReducer: (st, action) => ({ ...st })
    };
  }
  return originalRequire.apply(this, arguments);
};

import { CARD_REGISTRY } from './src/engine/cards/registry';

const unverified = [];
for (const key of Object.keys(CARD_REGISTRY)) {
  if (!CARD_REGISTRY[key].verified) {
    unverified.push(CARD_REGISTRY[key]);
  }
}
console.log(`There are ${unverified.length} unverified cards:`);
unverified.forEach(c => {
  console.log(`- **${c.name}** (${c.cost}⚡): ${c.description}`);
});
