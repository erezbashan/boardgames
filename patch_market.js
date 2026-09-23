const fs = require('fs');
let code = fs.readFileSync('games/acquire/src/components/AcquireBoard.tsx', 'utf8');

code = code.replace(
  '<div style={{ flex: 1, overflowY: \\'auto\\' }}>\\n          <div className="glass" style={{ padding: \\'15px\\', borderRadius: \\'12px\\' }}>\\n            <h3 style={{ marginTop: 0, marginBottom: \\'15px\\' }}>Market</h3>',
  '<div style={{ width: \\'240px\\', flex: \\'none\\', overflowY: \\'auto\\' }}>\\n          <div className="glass" style={{ padding: \\'15px\\', borderRadius: \\'12px\\' }}>\\n            <h3 style={{ marginTop: 0, marginBottom: \\'15px\\' }}>Shares</h3>'
);

fs.writeFileSync('games/acquire/src/components/AcquireBoard.tsx', code);
