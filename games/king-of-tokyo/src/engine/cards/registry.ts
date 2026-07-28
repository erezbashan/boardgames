import { CardImplementation } from './types';
import { AmusementPark } from './AmusementPark';
import { Army } from './Army';
import { Cannibalistic } from './Cannibalistic';
import { HighAltitudeBombing } from './HighAltitudeBombing';
import { ItHasAChild } from './ItHasAChild';
import { JetFighters } from './JetFighters';
import { Jets } from './Jets';
import { MadeInALab } from './MadeInALab';
import { Metamorph } from './Metamorph';
import { Mimic } from './Mimic';
import { MonsterBatteries } from './MonsterBatteries';
import { NationalGuard } from './NationalGuard';
import { NovaBreath } from './NovaBreath';
import { NuclearPowerPlant } from './NuclearPowerPlant';
import { Omnivore } from './Omnivore';
import { Opportunist } from './Opportunist';
import { PoisonQuills } from './PoisonQuills';
import { PoisonSpit } from './PoisonSpit';
import { Regeneration } from './Regeneration';
import { Skyscraper } from './Skyscraper';
import { SolarPowered } from './SolarPowered';
import { SpikedTail } from './SpikedTail';
import { Tanks } from './Tanks';
import { ThrowATanker } from './ThrowATanker';
import { Urbavore } from './Urbavore';

import { AlienMetabolism } from './AlienMetabolism';
import { DropFromHighAltitude } from './DropFromHighAltitude';
import { Energize } from './Energize';
import { Wings } from './Wings';
import { ExtraHead } from './ExtraHead';
import { Frenzy } from './Frenzy';
import { GasRefinery } from './GasRefinery';
import { GiantBrain } from './GiantBrain';
import { HealCard } from './HealCard';
import { WeAreOnlyMakingItStronger } from './WeAreOnlyMakingItStronger';

import { AlphaMonster } from './AlphaMonster';
import { ArmorPlating } from './ArmorPlating';
import { Camouflage } from './Camouflage';
import { CommuterTrain } from './CommuterTrain';
import { CompleteDestruction } from './CompleteDestruction';
import { CornerStore } from './CornerStore';
import { DedicatedNewsTeam } from './DedicatedNewsTeam';
import { EaterOfTheDead } from './EaterOfTheDead';
import { EvenBigger } from './EvenBigger';
import { RootingForTheUnderdog } from './RootingForTheUnderdog';

import { FriendOfChildren } from './FriendOfChildren';
import { Gourmet } from './Gourmet';
import { EnergyHoarder } from './EnergyHoarder';
import { EvacuationOrders } from './EvacuationOrders';
import { UrbanLegend } from './UrbanLegend';
import { ElectricArmor } from './ElectricArmor';
import { SuperJump } from './SuperJump';
import { Telepath } from './Telepath';
import { Vampiric } from './Vampiric';
import { Unstoppable } from './Unstoppable';

export const CARD_REGISTRY: Record<string, CardImplementation> = {
  [AlphaMonster.id]: AlphaMonster,
  [AlienMetabolism.id]: AlienMetabolism,
  [AmusementPark.id]: AmusementPark,
  [ArmorPlating.id]: ArmorPlating,
  [Army.id]: Army,
  [Camouflage.id]: Camouflage,
  [Cannibalistic.id]: Cannibalistic,
  [CommuterTrain.id]: CommuterTrain,
  [CompleteDestruction.id]: CompleteDestruction,
  [CornerStore.id]: CornerStore,
  [DedicatedNewsTeam.id]: DedicatedNewsTeam,
  [DropFromHighAltitude.id]: DropFromHighAltitude,
  [EaterOfTheDead.id]: EaterOfTheDead,
  [ElectricArmor.id]: ElectricArmor,
  [Energize.id]: Energize,
  [EnergyHoarder.id]: EnergyHoarder,
  [EvacuationOrders.id]: EvacuationOrders,
  [EvenBigger.id]: EvenBigger,
  [ExtraHead.id]: ExtraHead,
  [Frenzy.id]: Frenzy,
  [FriendOfChildren.id]: FriendOfChildren,
  [GasRefinery.id]: GasRefinery,
  [GiantBrain.id]: GiantBrain,
  [Gourmet.id]: Gourmet,
  [HealCard.id]: HealCard,
  [HighAltitudeBombing.id]: HighAltitudeBombing,
  [ItHasAChild.id]: ItHasAChild,
  [JetFighters.id]: JetFighters,
  [Jets.id]: Jets,
  [MadeInALab.id]: MadeInALab,
  [Metamorph.id]: Metamorph,
  [Mimic.id]: Mimic,
  [MonsterBatteries.id]: MonsterBatteries,
  [NationalGuard.id]: NationalGuard,
  [NovaBreath.id]: NovaBreath,
  [NuclearPowerPlant.id]: NuclearPowerPlant,
  [Omnivore.id]: Omnivore,
  [Opportunist.id]: Opportunist,
  [PoisonQuills.id]: PoisonQuills,
  [PoisonSpit.id]: PoisonSpit,
  [Regeneration.id]: Regeneration,
  [RootingForTheUnderdog.id]: RootingForTheUnderdog,
  [Skyscraper.id]: Skyscraper,
  [SolarPowered.id]: SolarPowered,
  [SpikedTail.id]: SpikedTail,
  [Tanks.id]: Tanks,
  [ThrowATanker.id]: ThrowATanker,
  [Urbavore.id]: Urbavore,
  [WeAreOnlyMakingItStronger.id]: WeAreOnlyMakingItStronger,
  [SuperJump.id]: SuperJump,
  [Telepath.id]: Telepath,
  [Vampiric.id]: Vampiric,
  [Unstoppable.id]: Unstoppable,
  [Wings.id]: Wings,
};
