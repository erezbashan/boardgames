import React from 'react';
import type { KotState } from '../engine/types';
import { getPlayerMaxHealth } from '../engine/utils';
import { LineChartWidget, TimelineBarWidget, LineChartData, LineConfig, TimelineSegment, PLAYER_COLORS } from '@erez/boardgame-core';

interface KotStatsProps {
  gameState: KotState;
}

export const KotStats: React.FC<KotStatsProps> = ({ gameState }) => {
  const { players, history, playerOrder } = gameState;

  // 1. Prepare Table Data
  const tableData = playerOrder.map(id => players[id]);
  tableData.sort((a, b) => {
    const aAlive = a.health > 0;
    const bAlive = b.health > 0;
    if (aAlive && !bAlive) return -1;
    if (!aAlive && bAlive) return 1;
    if (aAlive && bAlive) {
       return (b.vp || 0) - (a.vp || 0); 
    }
    return (b.stats?.turnDied || 0) - (a.stats?.turnDied || 0); 
  });

  // 2. Prepare Line Chart Data
  const vpData: LineChartData[] = [];
  const healthData: LineChartData[] = [];
  
  const isDeadObj: Record<string, boolean> = {};

  const fullHistory = [...history];
  if (gameState.status === 'Finished') {
    const tokyoOccupant = playerOrder.find(id => players[id].location === 'TokyoCity') || null;
    fullHistory.push({
      turnNum: 'Final',
      healths: playerOrder.reduce((acc, id) => ({ ...acc, [id]: players[id].health }), {}),
      vps: playerOrder.reduce((acc, id) => ({ ...acc, [id]: players[id].vp }), {}),
      tokyoOccupant
    });
  }

  fullHistory.forEach((snapshot: any, turnIndex: number) => {
    const vpEntry: LineChartData = { name: `T${snapshot.turnNum}` };
    const hpEntry: LineChartData = { name: `T${snapshot.turnNum}` };
    
    playerOrder.forEach((id, pIdx) => {
      let p = null;
      if (snapshot.healths && snapshot.healths[id] !== undefined) {
        p = { health: snapshot.healths[id], vp: snapshot.vps[id] };
      } else if (snapshot.players && snapshot.players[id]) {
        p = { health: snapshot.players[id].health, vp: snapshot.players[id].vp };
      }
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
  const tokyoData: TimelineSegment[] = fullHistory.map((snapshot: any) => {
    let color = 'rgba(255,255,255,0.1)';
    let label = 'Empty';
    if (snapshot.tokyoOccupant) {
      const occupant = players[snapshot.tokyoOccupant];
      if (occupant) {
        const index = playerOrder.indexOf(snapshot.tokyoOccupant);
        color = occupant.color || PLAYER_COLORS[index % PLAYER_COLORS.length];
        label = occupant.name;
      }
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
              <th style={{ padding: '10px' }}>⭐ VPs</th>
              <th style={{ padding: '10px' }}>❤️ Healed</th>
              <th style={{ padding: '10px' }}>⚡ Gained</th>
              <th style={{ padding: '10px' }}>💥 Dealt</th>
              <th style={{ padding: '10px' }}>💀 Kills</th>
              <th style={{ padding: '10px' }}>🃏 Cards Bought</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map(p => (
              <tr key={p.id} style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <td style={{ padding: '10px', fontWeight: 'bold', color: p.color }}>{p.name}</td>
                <td style={{ padding: '10px' }}>{p.vp}</td>
                <td style={{ padding: '10px' }}>{p.stats?.healthHealed || 0}</td>
                <td style={{ padding: '10px' }}>{p.stats?.energyGained || 0}</td>
                <td style={{ padding: '10px' }}>{p.stats?.damageDealt || 0}</td>
                <td style={{ padding: '10px' }}>{p.stats?.playersKilled || 0}</td>
                <td style={{ padding: '10px' }}>{p.stats?.cardsBought || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Charts */}
      {fullHistory.length > 0 ? (
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
