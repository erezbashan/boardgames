const fs = require('fs');
const files = [
  'c25_DedicatedNewsTeam.ts', 'c35_GasRefinery.ts', 'c36_NuclearPowerPlant.ts',
  'c37_Skyscrapers.ts', 'c38_CornerStore.ts', 'c40_ApartmentBuilding.ts',
  'c41_CommuterTrain.ts', 'c42_NationalGuard.ts', 'c44_RootingForTheUnderdog.ts',
  'c47_VastStorm.ts', 'c7_Points.ts', 'c8_MorePoints.ts'
];
for (const file of files) {
  let content = fs.readFileSync('shared/src/cards/' + file, 'utf8');
  content = content.replace(/(player|p)\.victoryPoints \+= (\d+);/, (match, p1, p2) => {
    return `${match}\n    if (${p1}.gameStats) ${p1}.gameStats.vpFromCards = (${p1}.gameStats.vpFromCards || 0) + ${p2};`;
  });
  // Also fix the generic log if it exists! "gained X !" -> "from [Card Name]!"
  // Wait, I can just do that manually for the missing ones.
  fs.writeFileSync('shared/src/cards/' + file, content);
}
console.log('done');
