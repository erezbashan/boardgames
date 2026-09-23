const fs = require('fs');
const file = 'games/acquire/src/components/AcquireBoard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. imports
content = content.replace(
  /import \{ GameLayout, useGameContext, AnimatedValue \} from '@erez\/boardgame-core';/,
  'import { GameLayout, useGameContext, AnimatedValue } from \'@erez/boardgame-core\';\nimport { AcquireStats } from \'./AcquireStats\';'
);

// 2. renderGameSpecificStats
content = content.replace(
  /renderGameSpecificPlayerDetails=\{renderPlayerDetails\}/,
  'renderGameSpecificPlayerDetails={renderPlayerDetails}\n      renderGameSpecificStats={() => <AcquireStats gameState={state} />}'
);

// 3. modal state
const modalState = `  const [showMergerModal, setShowMergerModal] = React.useState(false);
  React.useEffect(() => {
    if (state?.phase === 'MergeResolution' || state?.phase === 'ChooseMergeSurvivor' || state?.phase === 'FoundCorporation') {
      const timer = setTimeout(() => setShowMergerModal(true), 1500);
      return () => clearTimeout(timer);
    } else {
      setShowMergerModal(false);
    }
  }, [state?.phase, state?.pendingMerge?.currentDefunctIndex]);`;

content = content.replace(
  /const isMyTurn = activeId === playerId;/,
  'const isMyTurn = activeId === playerId;\n\n' + modalState
);

// 4. apply showMergerModal to modals
content = content.replace(
  /\{state\.phase === 'FoundCorporation' && state\.pendingFounding\?\.playerId === playerId && \(/,
  '{state.phase === \'FoundCorporation\' && state.pendingFounding?.playerId === playerId && showMergerModal && ('
);
content = content.replace(
  /\{state\.phase === 'ChooseMergeSurvivor' && state\.pendingSurvivorChoice\?\.playerId === playerId && \(/,
  '{state.phase === \'ChooseMergeSurvivor\' && state.pendingSurvivorChoice?.playerId === playerId && showMergerModal && ('
);
content = content.replace(
  /\{isMyTurn && state\.phase === 'MergeResolution' && pm && dCorp && aCorp && \(/,
  '{isMyTurn && state.phase === \'MergeResolution\' && pm && dCorp && aCorp && showMergerModal && ('
);

// 5. just-placed class
content = content.replace(
  /<div \n                    key=\{cIdx\} \n                    className=\{`board-cell \$\{cell \?\? ''\} \$\{isPlayable \? 'playable' : ''\} \$\{isPulsing \? 'pulsing' : ''\}`\}/,
  '<div \n                    key={cIdx} \n                    className={`board-cell ${cell ?? \'\'} ${isPlayable ? \'playable\' : \'\'} ${isPulsing ? \'pulsing\' : \'\'} ${state.turnContext?.lastPlacedTile === cellId ? \'just-placed\' : \'\'}`}'
);

// 6. buy button visibility
content = content.replace(
  /visibility: \(state\.phase === 'BuyStocks' \|\| state\.phase === 'PlayTile'\) \? 'visible' : 'hidden'/,
  'visibility: (isMyTurn && state.phase === \'BuyStocks\' && cState.isActive) ? \'visible\' : \'hidden\''
);
content = content.replace(
  /className="action-required-buy"/,
  'className={isMyTurn && state.phase === \'BuyStocks\' && me!.money >= cState.stockPrice && state.sharesBoughtThisTurn < 3 && cState.availableStocks > 0 ? "action-required-buy" : ""}'
);

// 7. rank change pop
content = content.replace(
  /<div key=\{cName\} style=\{\{ \n                 display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',/,
  '<div key={cName} className={state.turnContext?.rankChange?.corp === cName && (isGold || isSilver) ? \'rank-change-pop\' : \'\'} style={{ \n                 display: \'flex\', flexDirection: \'column\', alignItems: \'center\', justifyContent: \'center\','
);

// 8. button styles
content = content.replace(
  /<button \n                    style=\{\{ marginTop: '10px' \}\}/,
  '<button \n                    className="btn primary"\n                    style={{ marginTop: \'10px\' }}'
);
content = content.replace(
  /<button onClick=\{\(\) => dispatch\(\{ type: 'RESOLVE_MERGE_STOCKS', payload: \{ playerId, sell: 0, trade: 0, keep: 0 \} \}\)\}>Continue<\/button>/,
  '<button className="btn primary" onClick={() => dispatch({ type: \'RESOLVE_MERGE_STOCKS\', payload: { playerId, sell: 0, trade: 0, keep: 0 } })}>Continue</button>'
);
content = content.replace(
  /<button onClick=\{\(\) => setSelectedCorp\(null\)\}\n                  style=\{\{ display: 'block', width: '100%', marginTop: '15px' \}\}>\n            Close\n          <\/button>/,
  '<button className="btn primary" onClick={() => setSelectedCorp(null)}\n                  style={{ display: \'block\', width: \'100%\', marginTop: \'15px\' }}>\n            Close\n          </button>'
);

fs.writeFileSync(file, content);
