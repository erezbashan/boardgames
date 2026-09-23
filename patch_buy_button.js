const fs = require('fs');
const file = 'games/acquire/src/components/AcquireBoard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /visibility: \(state\.phase === 'BuyStocks' \|\| state\.phase === 'PlayTile'\) \? 'visible' : 'hidden'/,
  'visibility: (isMyTurn && state.phase === \'BuyStocks\' && cState.isActive) ? \'visible\' : \'hidden\''
);

content = content.replace(
  /className="action-required-buy"/,
  'className={isMyTurn && state.phase === \'BuyStocks\' && me!.money >= cState.stockPrice && state.sharesBoughtThisTurn < 3 && cState.availableStocks > 0 ? "action-required-buy" : ""}'
);

fs.writeFileSync(file, content);
