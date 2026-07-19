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
import { CompleteDestruction } from './completeDestruction';
import { CornerStore } from './cornerStore';
import { DedicatedNewsTeam } from './dedicatedNewsTeam';

export const CARD_REGISTRY: Record<string, KotCard> = {
  [AcidAttack.id]: AcidAttack,
  [AlienMetabolism.id]: AlienMetabolism,
  [AlphaMonster.id]: AlphaMonster,
  [ApartmentBuilding.id]: ApartmentBuilding,
  [ArmorPlating.id]: ArmorPlating,
  [BackgroundDweller.id]: BackgroundDweller,
  [Burrowing.id]: Burrowing,
  [Camouflage.id]: Camouflage,
  [CommuterTrain.id]: CommuterTrain,
  [CompleteDestruction.id]: CompleteDestruction,
  [CornerStore.id]: CornerStore,
  [DedicatedNewsTeam.id]: DedicatedNewsTeam,
};

export const ALL_CARD_IDS = Object.keys(CARD_REGISTRY).sort((a, b) => 
  CARD_REGISTRY[a].name.localeCompare(CARD_REGISTRY[b].name)
);
