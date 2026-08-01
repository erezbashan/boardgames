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

const emptyCards = [];
for (const key of Object.keys(CARD_REGISTRY)) {
  const c = CARD_REGISTRY[key];
  if (!c.onPreEvent && !c.onPostEvent && !c.onBuy) {
    emptyCards.push(c.name + ' (NO HOOKS)');
  } else {
    for (const hook of ['onPreEvent', 'onPostEvent', 'onBuy']) {
      if (c[hook]) {
        const fnStr = c[hook].toString();
        if (fnStr.includes('return st;') && fnStr.length < 150) {
          emptyCards.push(c.name + ` (${hook} stubbed)`);
        }
      }
    }
  }
}
console.log(`Cards with empty/stubbed implementations:`, emptyCards);
