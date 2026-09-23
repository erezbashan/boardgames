import re

with open('games/acquire/src/components/AcquireBoard.tsx', 'r') as f:
    code = f.read()

old_func = re.search(r'const renderLogMessage = \(.*?const renderPlayerDetails =', code, re.DOTALL)
if not old_func:
    print("Not found")
    exit(1)

new_func = """const renderLogMessage = (msg: string, defaultRenderer: (m: string) => React.ReactNode) => {
    if (msg.includes("'s Turn ---")) {
      return (
        <span style={{ display: 'block', margin: '15px 0 5px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2px', color: 'gray', fontSize: '0.85rem' }}>
          {defaultRenderer(msg)}
        </span>
      );
    }

    let cleanLog = msg.replace(/🤖 /g, '');
    let parts: React.ReactNode[] = [cleanLog];
    
    const corpColors: Record<string, string> = {
      Tower: 'var(--corp-tower)',
      Luxor: 'var(--corp-luxor)',
      American: 'var(--corp-american)',
      Worldwide: 'var(--corp-worldwide)',
      Festival: 'var(--corp-festival)',
      Imperial: 'var(--corp-imperial)',
      Continental: 'var(--corp-continental)'
    };
    
    Object.entries(corpColors).forEach(([corp, color]) => {
      const newParts: React.ReactNode[] = [];
      parts.forEach(part => {
        if (typeof part === 'string') {
          const split = part.split(corp);
          split.forEach((s, idx) => {
            newParts.push(s);
            if (idx < split.length - 1) {
              newParts.push(<span key={`${corp}-${idx}`} style={{ color, fontWeight: 'bold' }}>{corp}</span>);
            }
          });
        } else {
          newParts.push(part);
        }
      });
      parts = newParts;
    });

    let emoji = '';
    if (msg.includes('founded')) emoji = '🏢 ';
    else if (msg.includes('bought')) emoji = '💰 ';
    else if (msg.includes('discarded')) emoji = '🗑️ ';
    else if (msg.includes('gets bonus')) emoji = '💵 ';
    else if (msg.includes('played tile')) emoji = '⬜ ';
    else if (msg.includes('Merger!')) emoji = '💥 ';
    else if (msg.includes('grows by')) emoji = '📈 ';
    else if (msg.includes('resolved')) emoji = '⚖️ ';
    else if (msg.includes('caused a merger')) emoji = '⚠️ ';

    let bg = 'transparent';
    if (msg.includes('founded')) bg = 'rgba(255, 255, 255, 0.1)';
    if (msg.includes('Merger!')) bg = 'rgba(239, 68, 68, 0.2)';

    return (
      <span style={{ 
        backgroundColor: bg,
        padding: bg !== 'transparent' ? '2px 4px' : '0',
        borderRadius: '4px',
        fontWeight: msg.includes('founded') || msg.includes('Merger!') ? 'bold' : 'normal',
        fontSize: '0.85rem'
      }}>
        {emoji}{parts.map((el, i) => typeof el === 'string' ? <React.Fragment key={i}>{defaultRenderer(el)}</React.Fragment> : el)}
      </span>
    );
  };

  const renderPlayerDetails ="""

code = code.replace(old_func.group(0), new_func)

with open('games/acquire/src/components/AcquireBoard.tsx', 'w') as f:
    f.write(code)
