import type { KotCard } from './types';
import { AcidAttack } from './acidAttack';
import { AlienMetabolism } from './alienMetabolism';
import { AlphaMonster } from './alphaMonster';

export const CARD_REGISTRY: Record<string, KotCard> = {
  acid_attack: AcidAttack,
  alien_metabolism: AlienMetabolism,
  alpha_monster: AlphaMonster,
};

export const ALL_CARD_IDS = Object.keys(CARD_REGISTRY).sort((a, b) => 
  CARD_REGISTRY[a].name.localeCompare(CARD_REGISTRY[b].name)
);
