import React from 'react';
import type { KotState } from '../engine/reducer';
import { LineChartWidget, TimelineBarWidget, LineChartData, LineConfig, TimelineSegment, PLAYER_COLORS } from '@erez/boardgame-core';

interface KotStatsProps {
  gameState: KotState;
}

export const KotStats: React.FC<KotStatsProps> = ({ gameState }) => {
  const { players, history, playerOrder } = gameState;

  // 1. Prepare Table Data
  const tableData = playerOrder.map(id => players[id]);

  // 2. Prepare Line Chart Data
  const vpData: LineChartData[] = [];
  const healthData: LineChartData[] = [];
  
  const isDeadObj: Record<string, boolean> = {};

  history.forEach((snapshot, turnIndex) => {
    const vpEntry: LineChartData = { name: `T${snapshot.turnNum}` };
    const hpEntry: LineChartData = { name: `T${snapshot.turnNum}` };
    
    playerOrder.forEach((id, pIdx) => {
      const p = snapshot.healths[id] !== undefined ? { health: snapshot.healths[id], vp: snapshot.vps[id] } : null;
      if (!p) return;

      if (isDeadObj[id]) {
        // Line stops if already dead (null breaks the line)
        vpEntry[players[id].name] = null;
        hpEntry[players[id].name] = null;
        return;
      }

      const isNowDead = p.health <= 0;
      
      // Jitter overlapping lines slightly
      const jitter = pIdx * 0.15;

      vpEntry[players[id].name] = p.vp + jitter;
      hpEntry[players[id].name] = p.health + jitter;

      if (isNowDead) {
        vpEntry[`${players[id].name}_dead`] = true;
        hpEntry[`${players[id].name}_dead`] = true;
        isDeadObj[id] = true;
      }
    });
    
    vpData.push(vpEntry);
    healthData.push(hpEntry);
  });

  const customDot = (props: any) => {
    const { cx, cy, payload, dataKey } = props;
    if (payload[`${dataKey}_dead`]) {
      return <text x={cx} y={cy} dy={5} dx={-8} fontSize={14}>💀</text>;
    }
    return null;
  };

  const lines: LineConfig[] = playerOrder.map((id, index) => ({
    key: players[id].name,
    color: players[id].color || PLAYER_COLORS[index % PLAYER_COLORS.length],
    name: players[id].name,
    dot: customDot
  }));

  // 3. Prepare Timeline Bar Data
  const tokyoData: TimelineSegment[] = history.map(snapshot => {
    let color = 'rgba(255,255,255,0.1)';
    let label = 'Empty';
    if (snapshot.tokyoOccupant) {
      const occupant = players[snapshot.tokyoOccupant];
      const index = playerOrder.indexOf(snapshot.tokyoOccupant);
      color = occupant.color || PLAYER_COLORS[index % PLAYER_COLORS.length];
      label = occupant.name;
    }
    return {
      name: snapshot.turnNum,
      color,
      label
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Table Stats */}
      <div>
        <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>Player Totals</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
              <th style={{ padding: '10px' }}>Player</th>
              <th style={{ padding: '10px' }}>❤️ Healed</th>
              <th style={{ padding: '10px' }}>⚡ Gained</th>
              <th style={{ padding: '10px' }}>💥 Dealt</th>
              <th style={{ padding: '10px' }}>💀 Kills</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map(p => (
              <tr key={p.id} style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <td style={{ padding: '10px', fontWeight: 'bold', color: p.color }}>{p.name}</td>
                <td style={{ padding: '10px' }}>{p.stats.healthHealed}</td>
                <td style={{ padding: '10px' }}>{p.stats.energyGained}</td>
                <td style={{ padding: '10px' }}>{p.stats.damageDealt}</td>
                <td style={{ padding: '10px' }}>{p.stats.playersKilled}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Charts */}
      {history.length > 0 ? (
        <>
          <TimelineBarWidget title="Tokyo Occupancy" data={tokyoData} height={40} />
          <LineChartWidget title="VP Progression" data={vpData} lines={lines} height={200} hideLegend hideXAxis hideTooltip yAxisWidth={40} />
          <LineChartWidget title="Health Progression" data={healthData} lines={lines} height={200} hideLegend hideXAxis hideTooltip yAxisWidth={40} />
        </>
      ) : (
        <p style={{ textAlign: 'center', color: 'gray', fontStyle: 'italic' }}>Play a few turns to see graphs!</p>
      )}
    </div>
  );
};
