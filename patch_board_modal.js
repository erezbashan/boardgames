const fs = require('fs');
const file = 'games/acquire/src/components/AcquireBoard.tsx';
let content = fs.readFileSync(file, 'utf8');

const modalState = `  const [showMergerModal, setShowMergerModal] = React.useState(false);
  React.useEffect(() => {
    if (state?.phase === 'MergeResolution') {
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

content = content.replace(
  /\{isMyTurn && state\.phase === 'MergeResolution' && pm && dCorp && aCorp && \(/,
  '{isMyTurn && state.phase === \'MergeResolution\' && pm && dCorp && aCorp && showMergerModal && ('
);

fs.writeFileSync(file, content);
