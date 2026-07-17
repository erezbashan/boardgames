const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf8');

// Insert renderLogLine helper before App component
const helperCode = `
const renderLogLine = (log: string, i: number, gameState: any, setSelectedCard: any) => {
  if (log.startsWith('TURN_START:')) {
    return (
      <div key={i} style={{ 
        margin: '12px 0 4px 0', 
        borderBottom: '1px solid rgba(255,255,255,0.15)'
      }}></div>
    );
  }
  
  if (log.startsWith('BUY_CARD:')) {
    const parts = log.split('BUY_CARD:')[1];
    const firstColon = parts.indexOf(':');
    const pName = parts.substring(0, firstColon);
    const cardJson = parts.substring(firstColon + 1);
    let card: any = null;
    try { card = JSON.parse(cardJson); } catch (e) {}
    
    return (
      <div key={i} style={{ 
        padding: '6px', 
        background: 'rgba(0,0,0,0.2)', 
        borderRadius: '4px', 
      }}>
        {pName} bought{' '}
        <span 
          onClick={() => card && setSelectedCard(card)} 
          style={{ 
            cursor: 'pointer', 
            color: 'var(--primary)', 
            textDecoration: 'underline',
            fontWeight: 'bold'
          }}
        >
          {card?.name || 'a card'}
        </span>
        .
      </div>
    );
  }
  
  const isTurnEnd = log.startsWith('Turn ended.');
  return (
    <div key={i} style={{ 
      padding: '6px', 
      background: isTurnEnd ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)', 
      borderRadius: '4px', 
      fontWeight: isTurnEnd ? 'bold' : 'normal',
      marginTop: isTurnEnd ? '4px' : '0',
      marginBottom: isTurnEnd ? '4px' : '0'
    }}>
      {(() => {
        const players = Object.values(gameState.players);
        const sortedPlayers = [...players].sort((a: any, b: any) => b.name.length - a.name.length);
        
        const renderText = (logText: string): React.ReactNode => {
          for (const p of sortedPlayers as any[]) {
            if (p.name && logText.includes(p.name)) {
              const split = logText.split(p.name);
              return (
                <React.Fragment key={logText}>
                  {renderText(split[0])}
                  <span style={{ color: p.color || 'white', fontWeight: 'bold' }}>{p.name}</span>
                  {renderText(split.slice(1).join(p.name))}
                </React.Fragment>
              );
            }
          }
          return logText;
        };
        return renderText(log);
      })()}
    </div>
  );
};
`;

if (!content.includes('const renderLogLine')) {
  content = content.replace(`function App() {`, helperCode + `\nfunction App() {`);
}

// Replace recent logs map
content = content.replace(
  /return recentLogs\.map\(\(log, i\) => \{([\s\S]*?)return renderLog\(log\);\s*\}\)\(\)\}\s*<\/div>\s*\);\s*\}\);/m,
  `return recentLogs.map((log, i) => renderLogLine(log, i, gameState, setSelectedCard));`
);

// Replace full logs map
content = content.replace(
  /\{gameState\.logs\.slice\(\)\.reverse\(\)\.map\(\(log, i\) => \{([\s\S]*?)<\/div>\s*\);\s*\}\)\}/m,
  `{gameState.logs.slice().reverse().map((log, i) => renderLogLine(log, i, gameState, setSelectedCard))}`
);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf8');
