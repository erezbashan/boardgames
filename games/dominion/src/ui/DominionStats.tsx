import React from 'react';
import type { DominionState } from '../engine/types';
import { LineChartWidget, LineChartData, LineConfig, PLAYER_COLORS } from '@erez/boardgame-core';
import { getCardDef } from '../engine/cards';

interface DominionStatsProps {
  gameState: DominionState;
}

export const DominionStats: React.FC<DominionStatsProps> = ({ gameState }) => {
  const { players, playerOrder, history } = gameState;

  // 1. Table Data — sorted by VP descending
  const tableData = playerOrder.map(id => {
    const p = players[id];
    const allCards = [...p.deck, ...p.hand, ...p.discard, ...p.playArea];
    const treasures = allCards.filter(c => getCardDef(c.cardId).types.includes('TREASURE')).length;
    const actions = allCards.filter(c => getCardDef(c.cardId).types.includes('ACTION')).length;
    const victory = allCards.filter(c => getCardDef(c.cardId).types.includes('VICTORY') && c.cardId !== 'curse').length;
    const curses = allCards.filter(c => c.cardId === 'curse').length;
    return {
      id,
      name: p.name,
      color: p.color,
      vp: p.victoryPoints,
      total: allCards.length,
      treasures,
      actions,
      victory,
      curses,
    };
  }).sort((a, b) => b.vp - a.vp);

  // 2. VP Line Chart Data (one point per turn snapshot in history)
  const vpData: LineChartData[] = (history || []).map(snap => {
    const entry: LineChartData = { name: `T${snap.turnNum}` };
    playerOrder.forEach(pid => {
      entry[players[pid].name] = snap.vps[pid] ?? 0;
    });
    return entry;
  });

  // Add final state
  if (vpData.length > 0) {
    const finalEntry: LineChartData = { name: 'Final' };
    playerOrder.forEach(pid => {
      finalEntry[players[pid].name] = players[pid].victoryPoints;
    });
    vpData.push(finalEntry);
  }

  // 3. Deck Size Line Chart Data
  const deckData: LineChartData[] = (history || []).map(snap => {
    const entry: LineChartData = { name: `T${snap.turnNum}` };
    playerOrder.forEach(pid => {
      entry[players[pid].name] = snap.deckSizes[pid] ?? 0;
    });
    return entry;
  });

  const lines: LineConfig[] = playerOrder.map((id, index) => ({
    key: players[id].name,
    color: players[id].color || PLAYER_COLORS[index % PLAYER_COLORS.length],
    name: players[id].name,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

      {/* Final Standings Table */}
      <div>
        <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>Final Standings</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
              <th style={{ padding: '10px' }}>Player</th>
              <th style={{ padding: '10px' }}>⭐ VP</th>
              <th style={{ padding: '10px' }}>🃏 Total Cards</th>
              <th style={{ padding: '10px' }}>💰 Treasures</th>
              <th style={{ padding: '10px' }}>⚡ Actions</th>
              <th style={{ padding: '10px' }}>🏆 Victory</th>
              <th style={{ padding: '10px' }}>💀 Curses</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, i) => (
              <tr key={row.id} style={{ borderTop: '1px solid rgba(255,255,255,0.1)', background: i === 0 ? 'rgba(251,191,36,0.05)' : 'transparent' }}>
                <td style={{ padding: '10px', fontWeight: 'bold', color: row.color || 'white' }}>
                  {i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : ''}{row.name}
                </td>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>{row.vp}</td>
                <td style={{ padding: '10px' }}>{row.total}</td>
                <td style={{ padding: '10px', color: '#eab308' }}>{row.treasures}</td>
                <td style={{ padding: '10px', color: '#3b82f6' }}>{row.actions}</td>
                <td style={{ padding: '10px', color: '#22c55e' }}>{row.victory}</td>
                <td style={{ padding: '10px', color: '#ef4444' }}>{row.curses || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VP Progression Chart */}
      {vpData.length > 1 ? (
        <LineChartWidget
          title="VP Progression"
          data={vpData}
          lines={lines}
          height={220}
          yAxisWidth={40}
        />
      ) : (
        <p style={{ textAlign: 'center', color: 'gray', fontStyle: 'italic' }}>
          Play a few turns to see VP progression!
        </p>
      )}

      {/* Deck Size Chart */}
      {deckData.length > 1 && (
        <LineChartWidget
          title="Deck Size Over Time"
          data={deckData}
          lines={lines}
          height={180}
          yAxisWidth={40}
        />
      )}
    </div>
  );
};
