import { CardDefinition } from './types';
import { Copper, Silver, Gold } from './base/treasures';
import { Estate, Duchy, Province, Curse } from './base/victory';
import { Village, Smithy, Woodcutter, Cellar, Market, Festival, Laboratory, CouncilRoom, Moat, Chancellor, ThroneRoom, Adventurer, Chapel } from './base/actions';

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
  cellar: Cellar,
  market: Market,
  festival: Festival,
  laboratory: Laboratory,
  council_room: CouncilRoom,
  moat: Moat,
  chancellor: Chancellor,
  throne_room: ThroneRoom,
  adventurer: Adventurer,
  chapel: Chapel
};

export function getCardDef(cardId: string): CardDefinition {
  const def = Cards[cardId];
  if (!def) {
    // Return a safe fallback for deprecated/unknown cards (e.g. old saved games with removed cards)
    return { id: cardId, name: cardId, types: ['ACTION'], cost: 0, description: 'Unknown card' };
  }
  return def;
}
