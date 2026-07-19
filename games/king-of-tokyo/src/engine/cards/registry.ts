import type { KotCard } from './types';
import { AcidAttack } from './acidAttack';
import { AlienMetabolism } from './alienMetabolism';
import { AlphaMonster } from './alphaMonster';
import { ApartmentBuilding } from './apartmentBuilding';
import { ArmorPlating } from './armorPlating';
import { BackgroundDweller } from './backgroundDweller';
import { Burrowing } from './burrowing';
import { Camouflage } from './camouflage';
import { CommuterTrain } from './commuterTrain';

export const CARD_REGISTRY: Record<string, KotCard> = {
  acid_attack: AcidAttack,
  alien_metabolism: AlienMetabolism,
  alpha_monster: AlphaMonster,
  apartment_building: ApartmentBuilding,
  armor_plating: ArmorPlating,
  background_dweller: BackgroundDweller,
  burrowing: Burrowing,
  camouflage: Camouflage,
  commuter_train: CommuterTrain,
};

export const ALL_CARD_IDS = Object.keys(CARD_REGISTRY).sort((a, b) => 
  CARD_REGISTRY[a].name.localeCompare(CARD_REGISTRY[b].name)
);
