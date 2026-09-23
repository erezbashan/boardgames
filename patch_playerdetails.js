const fs = require('fs');
let code = fs.readFileSync('games/acquire/src/components/AcquireBoard.tsx', 'utf8');

const targetStr = `        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '5px' }}>
          {(Object.keys(state.corporations) as Corporation[]).map(cName => {
             const count = p.stocks[cName] || 0;
             if (count === 0) return null;
             return (
               <div key={cName} style={{ 
                 padding: '2px 6px', 
                 borderRadius: '4px', 
                 background: 'rgba(0,0,0,0.3)',
                 border: \`1px solid var(--corp-\${cName.toLowerCase()})\`,
                 color: 'white',
                 fontSize: '11px',
                 fontWeight: 'bold'
               }}>
                 <span style={{ color: \`var(--corp-\${cName.toLowerCase()})\` }}>{cName.substring(0,3)}:</span> {count}
               </div>
             )
          })}
        </div>`;

const replacementStr = `        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginTop: '5px', textAlign: 'center' }}>
          {(Object.keys(state.corporations) as Corporation[]).map(cName => {
             const count = p.stocks[cName] || 0;
             
             let icon = null;
             if (count > 0) {
               const holders = Object.values(state.players)
                   .map((px: any) => ({ id: px.id, count: px.stocks[cName] || 0 }))
                   .filter(h => h.count > 0)
                   .sort((a,b) => b.count - a.count);
                   
               if (holders.length > 0 && holders[0].id === pId) {
                 icon = '🥇';
               } else if (holders.length > 1) {
                 if (holders[0].count === count) icon = '🥇'; // Tied for 1st
                 else if (holders[1].count === count || holders[1].id === pId) icon = '🥈'; // 2nd or tied for 2nd
               }
             }

             if (count === 0) {
               return <div key={cName} style={{ minHeight: '30px' }}></div>;
             }

             return (
               <div key={cName} style={{ 
                 display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                 padding: '2px', 
                 borderRadius: '4px', 
                 background: 'rgba(0,0,0,0.3)',
                 border: \`1px solid var(--corp-\${cName.toLowerCase()})\`,
                 color: \`var(--corp-\${cName.toLowerCase()})\`,
                 fontSize: '10px',
                 fontWeight: 'bold',
                 lineHeight: 1.1
               }}>
                 <div>{cName.substring(0,3)}</div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                   {count}{icon && <span style={{ fontSize: '9px' }}>{icon}</span>}
                 </div>
               </div>
             )
          })}
        </div>`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('games/acquire/src/components/AcquireBoard.tsx', code);
