import type { GameState } from '@king-of-tokyo/shared';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface Props {
  gameState: GameState;
  onLobbyReturn: () => void;
  onClose: () => void;
}

export function GameOverScreen({ gameState, onLobbyReturn, onClose }: Props) {
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
      const turnData: any = { name: `Turn ${turn}` };
      for (const id of playerIds) {
        const h = gameState.history.find(x => x.turnNumber === turn && x.playerId === id);
        if (h) {
          turnData[`${gameState.players[id].name} VP`] = h.vp;
          turnData[`${gameState.players[id].name} Health`] = h.health;
          turnData[`${gameState.players[id].name} Energy`] = h.energy;
        }
      }
      chartData.push(turnData);
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
        
        <div style={{ marginTop: '24px' }}>
          <button className="btn primary" onClick={onLobbyReturn}>Return to Lobby</button>
        </div>

        {/* Stats Table */}
        <div style={{ marginTop: '40px', background: 'rgba(0,0,0,0.5)', padding: '16px', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '16px' }}>Game Summary</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '16px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #555' }}>
                <th style={{ padding: '8px' }}>Player</th>
                
                <th style={{ padding: '8px' }}>Total Damage Dealt</th>
                <th style={{ padding: '8px' }}>Cards Bought</th>
                <th style={{ padding: '8px' }}>Energy Spent</th>
                <th style={{ padding: '8px' }}>Energy Gained</th>
                <th style={{ padding: '8px' }}>Total Healing</th>
                <th style={{ padding: '8px' }}>Times Entered Tokyo</th>
                <th style={{ padding: '8px' }}>Times Started in Tokyo</th>
              </tr>
            </thead>
            <tbody>
              {playerIds.map(id => {
                const p = gameState.players[id];
                return (
                  <tr key={id} style={{ borderBottom: '1px solid #444', color: p.color || 'white' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>{p.name}</td>
                    
                    <td style={{ padding: '8px' }}>{p.gameStats?.damageDealt || 0}</td>
                    <td style={{ padding: '8px' }}>{p.gameStats?.cardsBought || 0}</td>
                    <td style={{ padding: '8px' }}>{p.gameStats?.energySpent || 0}</td>
                    <td style={{ padding: '8px' }}>{p.gameStats?.energyGained || 0}</td>
                    <td style={{ padding: '8px' }}>{p.gameStats?.healingGained || 0}</td>
                    <td style={{ padding: '8px' }}>{p.gameStats?.enteredTokyoCount || 0}</td>
                    <td style={{ padding: '8px' }}>{p.gameStats?.startedTurnInTokyoCount || 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {chartData.length > 0 && (
          <div style={{ marginTop: '24px', background: 'rgba(0,0,0,0.5)', padding: '16px', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '16px' }}>Game Progress</h3>
            
            <h4 style={{ textAlign: 'left', margin: '8px 0' }}>Victory Points</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" stroke="#ccc" tick={false} />
                <YAxis stroke="#ccc" domain={[0, 20]} />
                
                {playerIds.map(id => (
                  <Line key={id} type="monotone" dataKey={`${gameState.players[id].name} VP`} stroke={gameState.players[id]?.color || '#8884d8'} strokeWidth={3} dot={false} />
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
                  <Line key={id} type="monotone" dataKey={`${gameState.players[id].name} Health`} stroke={gameState.players[id]?.color || '#8884d8'} strokeWidth={3} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>

            <h4 style={{ textAlign: 'left', margin: '24px 0 8px 0' }}>Energy</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" stroke="#ccc" tick={false} />
                <YAxis stroke="#ccc" />
                {playerIds.map(id => (
                  <Line key={id} type="monotone" dataKey={`${gameState.players[id].name} Energy`} stroke={gameState.players[id]?.color || '#8884d8'} strokeWidth={3} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
