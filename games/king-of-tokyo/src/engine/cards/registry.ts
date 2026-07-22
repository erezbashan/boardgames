import { CardImplementation } from './types';
import { HighAltitudeBombing } from './HighAltitudeBombing';
import { ItHasAChild } from './ItHasAChild';
import { JetFighters } from './JetFighters';

import { Jets } from './Jets';
import { MadeInALab } from './MadeInALab';
import { Metamorph } from './Metamorph';
import { Mimic } from './Mimic';
import { MonsterBatteries } from './MonsterBatteries';

import { NationalGuard } from './NationalGuard';
import { NuclearPowerPlant } from './NuclearPowerPlant';
import { Skyscraper } from './Skyscraper';
import { Tanks } from './Tanks';
import { AmusementPark } from './AmusementPark';

import { NovaBreath } from './NovaBreath';
import { Omnivore } from './Omnivore';
import { PoisonQuills } from './PoisonQuills';
import { Regeneration } from './Regeneration';
import { SolarPowered } from './SolarPowered';

import { SpikedTail } from './SpikedTail';
import { Army } from './Army';
import { Cannibalistic } from './Cannibalistic';
import { Urbavore } from './Urbavore';
import { ThrowATanker } from './ThrowATanker';

export const CARD_REGISTRY: Record<string, CardImplementation> = {
  [HighAltitudeBombing.id]: HighAltitudeBombing,
  [ItHasAChild.id]: ItHasAChild,
  [JetFighters.id]: JetFighters,
  [Jets.id]: Jets,
  [MadeInALab.id]: MadeInALab,
  [Metamorph.id]: Metamorph,
  [Mimic.id]: Mimic,
  [MonsterBatteries.id]: MonsterBatteries,
  [NationalGuard.id]: NationalGuard,
  [NuclearPowerPlant.id]: NuclearPowerPlant,
  [Skyscraper.id]: Skyscraper,
  [Tanks.id]: Tanks,
  [AmusementPark.id]: AmusementPark,
  [NovaBreath.id]: NovaBreath,
  [Omnivore.id]: Omnivore,
  [PoisonQuills.id]: PoisonQuills,
  [Regeneration.id]: Regeneration,
  [SolarPowered.id]: SolarPowered,
  [SpikedTail.id]: SpikedTail,
  [Army.id]: Army,
  [Cannibalistic.id]: Cannibalistic,
  [Urbavore.id]: Urbavore,
  [ThrowATanker.id]: ThrowATanker,
};
