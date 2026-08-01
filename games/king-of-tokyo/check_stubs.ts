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

const cardsToCheck = ['Amusement Park', 'Commuter Train', 'Corner Store', 'Energize', 'Heal', 'Mimic', 'Monster Batteries', 'Skyscraper'];

for (const name of cardsToCheck) {
  for (const key of Object.keys(CARD_REGISTRY)) {
    if (CARD_REGISTRY[key].name === name) {
      console.log(`\n--- ${name} ---`);
      if (CARD_REGISTRY[key].onBuy) console.log(CARD_REGISTRY[key].onBuy.toString());
      if (CARD_REGISTRY[key].onPreEvent) console.log(CARD_REGISTRY[key].onPreEvent.toString());
    }
  }
}
