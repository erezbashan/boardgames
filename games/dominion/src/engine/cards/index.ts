import { CardDefinition } from './types';
import { Copper, Silver, Gold } from './base/treasures';
import { Estate, Duchy, Province, Curse } from './base/victory';
import { Village, Smithy, Woodcutter, Cellar } from './base/actions';

export const Cards: Record<string, CardDefinition> = {
  copper: Copper,
  silver: Silver,
  gold: Gold,
  estate: Estate,
  duchy: Duchy,
  province: Province,
  curse: Curse,
  village: Village,
  smithy: Smithy,
  woodcutter: Woodcutter,
  cellar: Cellar
};

export function getCardDef(cardId: string): CardDefinition {
  const def = Cards[cardId];
  if (!def) throw new Error(`Card ${cardId} not found`);
  return def;
}
