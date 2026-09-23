const fs = require('fs');
let code = fs.readFileSync('games/acquire/src/components/AcquireBoard.tsx', 'utf8');

const targetStr = `        <div style={{ width: '220px', flex: 'none', overflowY: 'auto' }}>
          <div className="glass" style={{ padding: '15px', borderRadius: '12px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Shares</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>`;

const replacementStr = `        <div style={{ width: '220px', flex: 'none' }}>
          <div className="glass" style={{ padding: '10px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ margin: 0 }}>Shares</h3>
              {state.phase === 'BuyStocks' && isMyTurn && (
                 <button 
                   className="end-turn-btn action-required-buy" 
                   onClick={() => dispatch({ type: 'END_TURN', payload: { playerId } })}
                   style={{ padding: '4px 8px', fontSize: '12px', width: 'auto', margin: 0 }}
                 >
                   End ({state.sharesBoughtThisTurn}/3)
                 </button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>`;

code = code.replace(targetStr, replacementStr);

const targetBlock = `                <div key={cName} style={{ 
                  background: 'rgba(0,0,0,0.3)', 
                  border: \`1px solid var(--corp-\${cName.toLowerCase()})\`, 
                  borderRadius: '8px', 
                  padding: '12px', 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  opacity: cState.isActive ? 1 : 0.4
                }}>`;

const replacementBlock = `                <div key={cName} style={{ 
                  background: 'rgba(0,0,0,0.3)', 
                  border: \`1px solid var(--corp-\${cName.toLowerCase()})\`, 
                  borderRadius: '6px', 
                  padding: '6px 8px', 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  opacity: cState.isActive ? 1 : 0.4
                }}>`;

code = code.replace(targetBlock, replacementBlock);

const targetEndBtn = `            {state.phase === 'BuyStocks' && isMyTurn && (
               <div style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}>
                 <button 
                   className="end-turn-btn action-required-buy" 
                   onClick={() => dispatch({ type: 'END_TURN', payload: { playerId } })}
                   style={{ padding: '10px 20px', fontSize: '16px' }}
                 >
                   End Turn (Bought {state.sharesBoughtThisTurn}/3)
                 </button>
               </div>
            )}`;

code = code.replace(targetEndBtn, '');

fs.writeFileSync('games/acquire/src/components/AcquireBoard.tsx', code);
