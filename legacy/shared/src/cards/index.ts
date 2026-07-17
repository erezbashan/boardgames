import { CardBehavior } from './types';

import { EvenBigger } from './c1_EvenBigger';
import { NovaBreath } from './c2_NovaBreath';
import { ExtraHead } from './c3_ExtraHead';
import { FireBreathing } from './c4_FireBreathing';
import { Heal } from './c5_Heal';
import { EnergyHoard } from './c6_EnergyHoard';
import { Points } from './c7_Points';
import { MorePoints } from './c8_MorePoints';
import { PoisonSpit } from './c9_PoisonSpit';
import { Armor } from './c10_Armor';
import { ShrinkRay } from './c11_ShrinkRay';
import { Jetpack } from './c12_Jetpack';
import { EnergyHoarder } from './c13_EnergyHoarder';
import { Regeneration } from './c14_Regeneration';
import { Frenzy } from './c15_Frenzy';
import { Evade } from './c16_Evade';
import { SpikedTail } from './c17_SpikedTail';
import { SolarPowered } from './c18_SolarPowered';
import { ParasiticTentacles } from './c19_ParasiticTentacles';
import { AlphaMonster } from './c20_AlphaMonster';
import { AlienMetabolism } from './c21_AlienMetabolism';
import { GiantBrain } from './c22_GiantBrain';
import { Omnivore } from './c23_Omnivore';
import { PoisonQuills } from './c24_PoisonQuills';
import { DedicatedNewsTeam } from './c25_DedicatedNewsTeam';
import { Herbivore } from './c26_Herbivore';
import { RapidHealing } from './c27_RapidHealing';
import { EvacuationOrders } from './c28_EvacuationOrders';
import { HighAltitudeBombing } from './c29_HighAltitudeBombing';
import { SpikedArmor } from './c30_SpikedArmor';
import { Wings } from './c31_Wings';
import { Gourmet } from './c32_Gourmet';
import { BackgroundDweller } from './c33_BackgroundDweller';
import { FriendofChildren } from './c34_FriendofChildren';
import { GasRefinery } from './c35_GasRefinery';
import { NuclearPowerPlant } from './c36_NuclearPowerPlant';
import { Skyscrapers } from './c37_Skyscrapers';
import { CornerStore } from './c38_CornerStore';
import { Energize } from './c39_Energize';
import { ApartmentBuilding } from './c40_ApartmentBuilding';
import { CommuterTrain } from './c41_CommuterTrain';
import { NationalGuard } from './c42_NationalGuard';
import { FighterSquadron } from './c43_FighterSquadron';
import { RootingForTheUnderdog } from './c44_RootingForTheUnderdog';
import { WereOnlyMakingItStronger } from './c45_WereOnlyMakingItStronger';
import { Urbavore } from './c46_Urbavore';
import { VastStorm } from './c47_VastStorm';

export const CardRegistry: Record<string, CardBehavior> = {
  'c1': EvenBigger,
  'c2': NovaBreath,
  'c3': ExtraHead,
  'c4': FireBreathing,
  'c5': Heal,
  'c6': EnergyHoard,
  'c7': Points,
  'c8': MorePoints,
  'c9': PoisonSpit,
  'c10': Armor,
  'c11': ShrinkRay,
  'c12': Jetpack,
  'c13': EnergyHoarder,
  'c14': Regeneration,
  'c15': Frenzy,
  'c16': Evade,
  'c17': SpikedTail,
  'c18': SolarPowered,
  'c19': ParasiticTentacles,
  'c20': AlphaMonster,
  'c21': AlienMetabolism,
  'c22': GiantBrain,
  'c23': Omnivore,
  'c24': PoisonQuills,
  'c25': DedicatedNewsTeam,
  'c26': Herbivore,
  'c27': RapidHealing,
  'c28': EvacuationOrders,
  'c29': HighAltitudeBombing,
  'c30': SpikedArmor,
  'c31': Wings,
  'c32': Gourmet,
  'c33': BackgroundDweller,
  'c34': FriendofChildren,
  'c35': GasRefinery,
  'c36': NuclearPowerPlant,
  'c37': Skyscrapers,
  'c38': CornerStore,
  'c39': Energize,
  'c40': ApartmentBuilding,
  'c41': CommuterTrain,
  'c42': NationalGuard,
  'c43': FighterSquadron,
  'c44': RootingForTheUnderdog,
  'c45': WereOnlyMakingItStronger,
  'c46': Urbavore,
  'c47': VastStorm,
};
import { PoisonToken } from './t1_PoisonToken';
import { ShrinkToken } from './t2_ShrinkToken';
CardRegistry['t1'] = PoisonToken;
CardRegistry['t2'] = ShrinkToken;
