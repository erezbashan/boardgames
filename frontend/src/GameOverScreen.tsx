import type { GameState } from '@king-of-tokyo/shared';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';

interface Props {
  gameState: GameState;
  onLobbyReturn: () => void;
  onClose: () => void;
}

export function GameOverScreen({ gameState, onLobbyReturn, onClose }: Props) {
  const winner = gameState.winner ? gameState.players[gameState.winner] : null;

  // Transform history data for recharts
  const chartData: any[] = [];
  const playerIds = Object.keys(gameState.players);
  
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

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#387908', '#d0ed57'];

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
                <th style={{ padding: '8px' }}>Final VP</th>
                <th style={{ padding: '8px' }}>Final Health</th>
                <th style={{ padding: '8px' }}>Total Damage Dealt</th>
                <th style={{ padding: '8px' }}>Cards Bought</th>
                <th style={{ padding: '8px' }}>Energy Spent</th>
              </tr>
            </thead>
            <tbody>
              {playerIds.map((id, index) => {
                const p = gameState.players[id];
                return (
                  <tr key={id} style={{ borderBottom: '1px solid #444', color: colors[index % colors.length] }}>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>{p.name}</td>
                    <td style={{ padding: '8px' }}>{p.victoryPoints}</td>
                    <td style={{ padding: '8px' }}>{p.health > 0 ? p.health : '💀 0'}</td>
                    <td style={{ padding: '8px' }}>{p.gameStats?.damageDealt || 0}</td>
                    <td style={{ padding: '8px' }}>{p.gameStats?.cardsBought || 0}</td>
                    <td style={{ padding: '8px' }}>{p.gameStats?.energySpent || 0}</td>
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
                <Legend />
                {playerIds.map((id, index) => (
                  <Line key={id} type="monotone" dataKey={`${gameState.players[id].name} VP`} stroke={colors[index % colors.length]} strokeWidth={3} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>

            <h4 style={{ textAlign: 'left', margin: '24px 0 8px 0' }}>Health</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" stroke="#ccc" tick={false} />
                <YAxis stroke="#ccc" domain={[0, 12]} />
                {playerIds.map((id, index) => (
                  <Line key={id} type="monotone" dataKey={`${gameState.players[id].name} Health`} stroke={colors[index % colors.length]} strokeWidth={3} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>

            <h4 style={{ textAlign: 'left', margin: '24px 0 8px 0' }}>Energy</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" stroke="#ccc" tick={false} />
                <YAxis stroke="#ccc" />
                {playerIds.map((id, index) => (
                  <Line key={id} type="monotone" dataKey={`${gameState.players[id].name} Energy`} stroke={colors[index % colors.length]} strokeWidth={3} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
