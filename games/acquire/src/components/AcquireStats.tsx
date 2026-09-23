import React from 'react';
import type { AcquireState } from '../engine/types';
import { getPlayerFinancials } from '../engine/engine';
import { LineChartWidget, LineChartData, LineConfig, PLAYER_COLORS } from '@erez/boardgame-core';

interface AcquireStatsProps {
  gameState: AcquireState;
}

export const AcquireStats: React.FC<AcquireStatsProps> = ({ gameState }) => {
  const { players, history, playerOrder } = gameState;

  // 1. Prepare Table Data
  const tableData = playerOrder.map(id => {
    const fin = getPlayerFinancials(gameState, id);
    return { ...players[id], netWorth: fin.netWorth };
  });
  
  tableData.sort((a, b) => b.netWorth - a.netWorth);

  // 2. Prepare Line Chart Data
  const nwData: LineChartData[] = [];
  
  const fullHistory = history || [];

  fullHistory.forEach((snapshot: any, turnIndex: number) => {
    const nwEntry: LineChartData = { name: `T${snapshot.turn}` };
    
    playerOrder.forEach((id, pIdx) => {
      let nw = 0;
      if (snapshot.netWorths && snapshot.netWorths[id] !== undefined) {
        nw = snapshot.netWorths[id];
      }
      // Jitter overlapping lines slightly
      const jitter = pIdx * 0.15;
      nwEntry[players[id].name] = nw + jitter;
    });
    
    nwData.push(nwEntry);
  });

  const lines: LineConfig[] = playerOrder.map((id, index) => ({
    key: players[id].name,
    color: players[id].color || PLAYER_COLORS[index % PLAYER_COLORS.length],
    name: players[id].name
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Table Stats */}
      <div>
        <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>Player Totals</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
              <th style={{ padding: '10px' }}>Player</th>
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
                <td style={{ padding: '10px' }}>${p.netWorth.toLocaleString()}</td>
                <td style={{ padding: '10px' }}>${p.money.toLocaleString()}</td>
                <td style={{ padding: '10px' }}>{p.stats?.sharesBought || 0}</td>
                <td style={{ padding: '10px' }}>{p.stats?.chainsFounded || 0}</td>
                <td style={{ padding: '10px' }}>{p.stats?.mergesCaused || 0}</td>
                <td style={{ padding: '10px' }}>{p.stats?.firstBonuses || 0} / {p.stats?.secondBonuses || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Charts */}
      {fullHistory.length > 0 ? (
        <LineChartWidget title="Net Worth Progression" data={nwData} lines={lines} height={300} hideLegend hideXAxis hideTooltip yAxisWidth={60} />
      ) : (
        <p style={{ textAlign: 'center', color: 'gray', fontStyle: 'italic' }}>Play a few turns to see graphs!</p>
      )}
    </div>
  );
};
