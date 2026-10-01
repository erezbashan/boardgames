import React from 'react';
import type { DominionState } from '../engine/types';
import { LineChartWidget, LineChartData, LineConfig, PLAYER_COLORS } from '@erez/boardgame-core';
import { getCardDef } from '../engine/cards';

interface DominionStatsProps {
  gameState: DominionState;
}

function getTreasureValue(cardId: string): number {
  if (cardId === 'copper') return 1;
  if (cardId === 'silver') return 2;
  if (cardId === 'gold') return 3;
  return 0;
}

export const DominionStats: React.FC<DominionStatsProps> = ({ gameState }) => {
  const { players, playerOrder, history } = gameState;

  // 1. Table Data — sorted by VP descending
  const tableData = playerOrder.map(id => {
    const p = players[id];
    const allCards = [...p.deck, ...p.hand, ...p.discard, ...p.playArea];
    const treasures = allCards.filter(c => getCardDef(c.cardId).types.includes('TREASURE')).length;
    const actions = allCards.filter(c => getCardDef(c.cardId).types.includes('ACTION')).length;
    const victory = allCards.filter(c => getCardDef(c.cardId).types.includes('VICTORY')).length;
    const totalMoney = allCards.reduce((sum, c) => sum + getTreasureValue(c.cardId), 0);
    return {
      id,
      name: p.name,
      color: p.color,
      vp: p.victoryPoints,
      total: allCards.length,
      treasures,
      actions,
      victory,
      totalMoney,
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

  const lines: LineConfig[] = playerOrder.map((id, index) => ({
    key: players[id].name,
    color: players[id].color || PLAYER_COLORS[index % PLAYER_COLORS.length],
    name: players[id].name,
  }));

  const uniqueCards = Array.from(new Set(
    playerOrder.flatMap(id => {
      const p = players[id];
      return [...p.deck, ...p.hand, ...p.discard, ...p.playArea].map(c => c.cardId);
    })
  )).sort((a,b) => {
    const defA = getCardDef(a);
    const defB = getCardDef(b);
    const getRank = (def: any) => def.types.includes('VICTORY') ? 1 : def.types.includes('TREASURE') ? 2 : 3;
    if (getRank(defA) !== getRank(defB)) return getRank(defA) - getRank(defB);
    return defB.cost - defA.cost || defA.name.localeCompare(defB.name);
  });

  const [hoveredCardDef, setHoveredCardDef] = React.useState<any | null>(null);
  const [popupPos, setPopupPos] = React.useState<{ x: number, y: number } | null>(null);

  const showPopup = (e: React.MouseEvent, def: any) => {
    setHoveredCardDef(def);
    setPopupPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', position: 'relative' }}>

      {/* Popup Overlay */}
      {hoveredCardDef && popupPos && (
        <div 
          onClick={() => setHoveredCardDef(null)}
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 99998 }}
        >
          <div 
            style={{ 
              position: 'fixed', 
              top: Math.min(popupPos.y + 15, window.innerHeight - 150) + 'px', 
              left: Math.min(popupPos.x + 15, window.innerWidth - 220) + 'px', 
              background: '#1e293b', 
              border: '1px solid #475569', 
              padding: '12px', 
              borderRadius: '8px', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)', 
              zIndex: 99999,
              width: '200px',
              pointerEvents: 'none'
            }}
          >
            <div style={{ fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>{hoveredCardDef.name} ({hoveredCardDef.cost}$)</div>
            <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '8px' }}>{hoveredCardDef.types.join(' - ')}</div>
            <div style={{ fontSize: '12px', color: '#cbd5e1' }}>{hoveredCardDef.description}</div>
          </div>
        </div>
      )}

      {/* Final Standings Table */}
      <div>
        <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>Final Standings</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
              <th style={{ padding: '10px' }}>Player</th>
              <th style={{ padding: '10px' }}>⭐ VP</th>
              <th style={{ padding: '10px' }}>🃏 Cards in Deck</th>
              <th style={{ padding: '10px' }}>💰 Treasure Cards</th>
              <th style={{ padding: '10px' }}>💵 Total Coin Value</th>
              <th style={{ padding: '10px' }}>⚡ Action Cards</th>
              <th style={{ padding: '10px' }}>🏆 Victory Cards</th>
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
                <td style={{ padding: '10px', color: '#fbbf24' }}>{row.totalMoney}</td>
                <td style={{ padding: '10px', color: '#3b82f6' }}>{row.actions}</td>
                <td style={{ padding: '10px', color: '#22c55e' }}>{row.victory}</td>
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
          hideLegend
          hideDots
          hideXAxis
          yAxisWidth={40}
        />
      ) : (
        <p style={{ textAlign: 'center', color: 'gray', fontStyle: 'italic' }}>
          Play a few turns to see VP progression!
        </p>
      )}

      {/* Deck Composition Table */}
      <div>
        <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>Deck Composition</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', overflow: 'hidden', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Player</th>
                {uniqueCards.map(cardId => {
                  const def = getCardDef(cardId);
                  return (
                    <th key={cardId} style={{ padding: '8px' }}>
                      <span 
                        onClick={(e) => showPopup(e, def)}
                        style={{ cursor: 'pointer', color: '#60a5fa', textDecoration: 'underline' }}
                      >
                        {def.name}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => {
                const p = players[row.id];
                const allCards = [...p.deck, ...p.hand, ...p.discard, ...p.playArea];
                const counts: Record<string, number> = {};
                allCards.forEach(c => { counts[c.cardId] = (counts[c.cardId] || 0) + 1; });
                
                return (
                  <tr key={row.id} style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <td style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', color: row.color || 'white' }}>{row.name}</td>
                    {uniqueCards.map(cardId => (
                      <td key={cardId} style={{ padding: '8px', color: counts[cardId] ? 'white' : 'rgba(255,255,255,0.2)' }}>
                        {counts[cardId] || '-'}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
