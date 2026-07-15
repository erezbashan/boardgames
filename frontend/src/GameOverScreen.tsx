import type { GameState } from '@king-of-tokyo/shared';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface Props {
  gameState: GameState;

  onClose: () => void;
}

const CustomDot = (props: any) => {
  const { cx, cy, payload, playerId, gameState } = props;
  const p = gameState.players[playerId];
  if (!p || p.health > 0) return null;
  const isDeathPoint = p.gameStats?.turnDied && payload.name === `Turn ${p.gameStats.turnDied + 1}`;
  if (isDeathPoint) {
    return (
      <text x={cx} y={cy} dy={5} dx={-8} fill="white" fontSize="16px" style={{ zIndex: 10 }}>
        💀
      </text>
    );
  }
  return null;
};




export function GameOverScreen({ gameState, onClose }: Props) {
  const winner = gameState.winner ? gameState.players[gameState.winner] : null;

  // Transform history data for recharts
  const chartData: any[] = [];
  const playerIds = Object.keys(gameState.players).sort((a, b) => {
    const pA = gameState.players[a];
    const pB = gameState.players[b];
    
    // 1. Winner on top
    if (gameState.winner === a) return -1;
    if (gameState.winner === b) return 1;
    
    // 2. Alive players above dead players
    const aAlive = pA.health > 0;
    const bAlive = pB.health > 0;
    if (aAlive && !bAlive) return -1;
    if (!aAlive && bAlive) return 1;
    
    // 3. If both alive, sort by VP descending
    if (aAlive && bAlive) {
      return pB.victoryPoints - pA.victoryPoints;
    }
    
    // 4. If both dead, sort by turnDied ascending (earliest death first, which puts them lower in the overall list if we consider 1 = top)
    // Wait, earlier death should be lower in the table. So they should be sorted by turnDied DESCENDING so later deaths are higher up.
    // The user said: "The order of death was Alice -> Hank -> Frank. But the order in the table is the other way around."
    // Meaning the table showed Frank -> Hank -> Alice.
    // Frank died last (highest turnDied), so Frank is at the top of the dead players.
    // The user wants the earliest death (Alice) at the top of the dead players?
    // Let's sort turnA - turnB (ascending) so the earliest death is higher in the table.
    const turnA = pA.gameStats?.turnDied || 0;
    const turnB = pB.gameStats?.turnDied || 0;
    return turnB - turnA;
  });
  
  if (gameState.history) {
    const turns = Array.from(new Set(gameState.history.map(h => h.turnNumber))).sort((a,b)=>a-b);
    for (const turn of turns) {
      const turnData: any = { name: `Turn ${turn}`, turnNumber: turn };
      for (const id of playerIds) {
        const p = gameState.players[id];
        // Graph Truncation: don't plot points past the turn they died
        if (p.health <= 0 && p.gameStats?.turnDied && turn > p.gameStats.turnDied + 1) {
          continue;
        }
        const h = gameState.history.find(x => x.turnNumber === turn && x.playerId === id);
        if (h) {
          const jitter = playerIds.indexOf(id) * 0.1;
          turnData[`${p.name} VP`] = h.vp + jitter;
          turnData[`${p.name} Health`] = h.health + jitter;
          turnData[`${p.name} Energy`] = h.energy + jitter;
        }
      }
      chartData.push(turnData);
    }
    // Recharts requires at least 2 points to draw a line. 
    // If the game ended on turn 1 (or history was lost), duplicate the point.
    if (chartData.length === 1) {
      chartData.push({ ...chartData[0], name: 'End' });
    }
  }

  // colors replaced by p.color

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
      <div className="game-over-screen glass-panel" style={{ position: 'relative', padding: '24px', width: '100%', maxWidth: '800px', margin: '40px 16px', textAlign: 'center', color: 'white', height: 'fit-content' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer', padding: '4px' }}>✕</button>
        
        <h1>Game Over!</h1>
        {winner ? (
          <h2>🎉 {winner.name} wins the game! 🎉</h2>
        ) : (
          <h2>💀 Everyone was defeated. The game ends in a draw!</h2>
        )}
        
        

                

        {/* Stats Table */}
        <div style={{ marginTop: '40px', background: 'rgba(0,0,0,0.5)', padding: '16px', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '16px' }}>Game Summary</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '16px', overflowX: 'auto', display: 'block' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #555' }}>
                <th style={{ padding: '8px', minWidth: '160px' }}>Stat</th>
                {playerIds.map(id => (
                  <th key={id} style={{ padding: '8px', textAlign: 'right', color: gameState.players[id].color || 'white', minWidth: '80px' }}>
                    {gameState.players[id].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Total Damage Dealt', key: 'damageDealt' },
                { label: 'Players Killed', key: 'playersKilled' },
                { label: 'Cards Bought', key: 'cardsBought' },
                { label: 'Energy Spent', key: 'energySpent' },
                { label: 'Total Healing', key: 'healingGained' },
                { label: 'VP From Dice', key: 'vpFromDice' },
                { label: 'VP From Cards', key: 'vpFromOther' },
                { label: 'VP From Entering Tokyo', key: 'vpFromEnteringTokyo' },
                { label: 'VP From Starting Tokyo', key: 'vpFromStartingTokyo' },
              ].map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #444' }}>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>{row.label}</td>
                  {playerIds.map(id => {
                    const p = gameState.players[id];
                    const val = (p.gameStats as any)?.[row.key] || 0;
                    return (
                      <td key={id} style={{ padding: '8px', textAlign: 'right', color: p.color || 'white' }}>
                        {val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {chartData.length > 0 && (
          <div style={{ marginTop: '24px', background: 'rgba(0,0,0,0.5)', padding: '16px', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '16px' }}>Game Progress</h3>
            <h4 style={{ textAlign: 'left', margin: '24px 0 8px 65px' }}>Who was in Tokyo City?</h4>
            <div style={{ display: 'flex', margin: '0 5px 24px 65px', height: '30px', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'transparent', border: '1px solid #555' }}>
              {chartData.map((d) => {
                const historyForTurn = gameState.history?.filter(h => h.turnNumber === d.turnNumber) || [];
                const tokyoPlayerHistory = historyForTurn.find(h => h.inTokyo && !h.inTokyoBay);
                const tokyoPlayerId = historyForTurn.length > 0 && historyForTurn[0].tokyoPlayerId ? historyForTurn[0].tokyoPlayerId : (tokyoPlayerHistory ? tokyoPlayerHistory.playerId : null);
                const player = tokyoPlayerId ? gameState.players[tokyoPlayerId] : null;
                const color = player ? (player.color || '#888') : 'transparent';
                const name = player ? player.name : '';
                return (
                  <div 
                    key={d.turnNumber} 
                    style={{ flex: 1, backgroundColor: color, borderRight: '1px solid rgba(255,255,255,0.1)', cursor: 'crosshair' }}
                    title={`Turn ${d.turnNumber}: ${name || 'Empty'}`}
                  />
                );
              })}
            </div>

            {playerIds.length >= 5 && gameState.history?.some(h => h.inTokyoBay) && (
              <>
                <h4 style={{ textAlign: 'left', margin: '0px 0 8px 65px' }}>Who was in Tokyo Bay?</h4>
            <div style={{ display: 'flex', margin: '0 5px 24px 65px', height: '30px', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'transparent', border: '1px solid #555' }}>
                  {chartData.map((d) => {
                    const historyForTurn = gameState.history?.filter(h => h.turnNumber === d.turnNumber) || [];
                    const tokyoBayHistory = historyForTurn.find(h => h.inTokyo && h.inTokyoBay);
                    const player = tokyoBayHistory ? gameState.players[tokyoBayHistory.playerId] : null;
                    const color = player ? (player.color || '#888') : 'transparent';
                    const name = player ? player.name : '';
                    return (
                      <div 
                        key={d.turnNumber} 
                        style={{ flex: 1, backgroundColor: color, borderRight: '1px solid rgba(255,255,255,0.1)', cursor: 'crosshair' }}
                        title={`Turn ${d.turnNumber}: ${name || 'Empty'}`}
                      />
                    );
                  })}
                </div>
              </>
            )}
            
            <h4 style={{ textAlign: 'left', margin: '8px 0' }}>Victory Points</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" stroke="#ccc" tick={false} />
                <YAxis stroke="#ccc" domain={[0, 20]} />
                
                {playerIds.map(id => (
                  <Line key={id} type="monotone" dataKey={`${gameState.players[id].name} VP`} stroke={gameState.players[id]?.color || '#8884d8'} strokeWidth={3} dot={<CustomDot playerId={id} gameState={gameState} />} activeDot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>

            <h4 style={{ textAlign: 'left', margin: '24px 0 8px 0' }}>Health</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" stroke="#ccc" tick={false} />
                <YAxis stroke="#ccc" domain={[0, 12]} />
                {playerIds.map(id => (
                  <Line key={id} type="monotone" dataKey={`${gameState.players[id].name} Health`} stroke={gameState.players[id]?.color || '#8884d8'} strokeWidth={3} dot={<CustomDot playerId={id} gameState={gameState} />} activeDot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>

            
          </div>
        )}
      </div>
    </div>
  );
}
