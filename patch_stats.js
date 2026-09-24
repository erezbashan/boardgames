const fs = require('fs');
const file = 'games/acquire/src/components/AcquireStats.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldTable = `              <th style={{ padding: '10px' }}>Player</th>
              <th style={{ padding: '10px' }}>Net Worth</th>
              <th style={{ padding: '10px' }}>Cash</th>
              <th style={{ padding: '10px' }}>Shares Bought</th>
              <th style={{ padding: '10px' }}>Chains Founded</th>
              <th style={{ padding: '10px' }}>Merges Caused</th>
              <th style={{ padding: '10px' }}>Bonuses (1st/2nd)</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map(p => (
              <tr key={p.id} style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <td style={{ padding: '10px', fontWeight: 'bold', color: p.color }}>{p.name}</td>
                <td style={{ padding: '10px' }}>\${p.netWorth.toLocaleString()}</td>
                <td style={{ padding: '10px' }}>\${p.money.toLocaleString()}</td>
                <td style={{ padding: '10px' }}>{p.stats?.sharesBought || 0}</td>
                <td style={{ padding: '10px' }}>{p.stats?.chainsFounded || 0}</td>
                <td style={{ padding: '10px' }}>{p.stats?.mergesCaused || 0}</td>
                <td style={{ padding: '10px' }}>{p.stats?.firstBonuses || 0} / {p.stats?.secondBonuses || 0}</td>
              </tr>
            ))}
          </tbody>`;

const newTable = `              <th style={{ padding: '10px' }}>Player</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>Net Worth</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>Cash</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>Shares Bought</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>Chains Founded</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>Merges Caused</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>1st Bonuses</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>2nd Bonuses</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map(p => (
              <tr key={p.id} style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <td style={{ padding: '10px', fontWeight: 'bold', color: p.color }}>{p.name}</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>\${p.netWorth.toLocaleString()}</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>\${p.money.toLocaleString()}</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>{p.stats?.sharesBought || 0}</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>{p.stats?.chainsFounded || 0}</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>{p.stats?.mergesCaused || 0}</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>{p.stats?.firstBonuses || 0}</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>{p.stats?.secondBonuses || 0}</td>
              </tr>
            ))}
          </tbody>`;

content = content.replace(oldTable, newTable);

const oldLines = `  const lines: LineConfig[] = playerOrder.map((id, index) => ({
    key: players[id].name,
    color: players[id].color || PLAYER_COLORS[index % PLAYER_COLORS.length],
    name: players[id].name
  }));`;

const newLines = `  const lines: LineConfig[] = playerOrder.map((id, index) => ({
    key: players[id].name,
    color: players[id].color || PLAYER_COLORS[index % PLAYER_COLORS.length],
    name: players[id].name,
    dot: false
  }));`;

content = content.replace(oldLines, newLines);
fs.writeFileSync(file, content);
