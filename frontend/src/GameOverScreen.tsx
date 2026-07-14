import React from 'react';
import type { GameState } from '@king-of-tokyo/shared';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props {
  gameState: GameState;
  onLobbyReturn: () => void;
}

export function GameOverScreen({ gameState, onLobbyReturn }: Props) {
  const winner = gameState.winner ? gameState.players[gameState.winner] : null;

  // Transform history data for recharts
  // We want an array of objects like: { turn: 1, "Player A": 10, "Player B": 12 }
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
    <div className="game-over-screen glass-panel" style={{ padding: '24px', maxWidth: '800px', margin: '40px auto', textAlign: 'center', color: 'white' }}>
      <h1>Game Over!</h1>
      {winner ? (
        <h2>🎉 {winner.name} wins the game! 🎉</h2>
      ) : (
        <h2>💀 Everyone was defeated. The game ends in a draw!</h2>
      )}
      
      <div style={{ marginTop: '24px' }}>
        <button className="btn primary" onClick={onLobbyReturn}>Return to Lobby</button>
      </div>

      {chartData.length > 0 && (
        <div style={{ marginTop: '40px', background: 'rgba(0,0,0,0.5)', padding: '16px', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '16px' }}>Game Progress</h3>
          
          <h4 style={{ textAlign: 'left', margin: '8px 0' }}>Victory Points</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="name" stroke="#ccc" />
              <YAxis stroke="#ccc" domain={[0, 20]} />
              <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#444' }} />
              <Legend />
              {playerIds.map((id, index) => (
                <Line key={id} type="monotone" dataKey={`${gameState.players[id].name} VP`} stroke={colors[index % colors.length]} strokeWidth={3} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>

          <h4 style={{ textAlign: 'left', margin: '24px 0 8px 0' }}>Health</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="name" stroke="#ccc" />
              <YAxis stroke="#ccc" domain={[0, 12]} />
              <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#444' }} />
              <Legend />
              {playerIds.map((id, index) => (
                <Line key={id} type="monotone" dataKey={`${gameState.players[id].name} Health`} stroke={colors[index % colors.length]} strokeWidth={3} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>

          <h4 style={{ textAlign: 'left', margin: '24px 0 8px 0' }}>Energy</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="name" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#444' }} />
              <Legend />
              {playerIds.map((id, index) => (
                <Line key={id} type="monotone" dataKey={`${gameState.players[id].name} Energy`} stroke={colors[index % colors.length]} strokeWidth={3} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
