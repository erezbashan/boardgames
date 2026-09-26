import re

with open('games/dominion/src/ui/DominionBoard.tsx', 'r') as f:
    code = f.read()

# Add Recharts import
if "import { BarChart" not in code:
    code = code.replace("import { motion, AnimatePresence } from 'framer-motion';", "import { motion, AnimatePresence } from 'framer-motion';\nimport { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';")

# Add renderEndGame
endgame_func = """
  const renderEndGame = () => {
    // Generate stats for all players
    const statsData = Object.values(gameState.players).map(p => {
      const allCards = [...p.deck, ...p.hand, ...p.discard, ...p.playArea];
      const treasures = allCards.filter(c => getCardDef(c.cardId).types.includes('TREASURE')).length;
      const actions = allCards.filter(c => getCardDef(c.cardId).types.includes('ACTION')).length;
      const victory = allCards.filter(c => getCardDef(c.cardId).types.includes('VICTORY')).length;
      const curses = allCards.filter(c => getCardDef(c.cardId).types.includes('CURSE')).length;
      return {
        name: p.name,
        VP: p.victoryPoints,
        Treasures: treasures,
        Actions: actions,
        VictoryCards: victory,
        Curses: curses,
        TotalCards: allCards.length
      };
    }).sort((a, b) => b.VP - a.VP); // Sort by highest VP

    return (
      <div style={{ color: 'white', padding: '40px', background: '#0f172a', borderRadius: '12px', margin: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
        <h1 style={{ textAlign: 'center', color: '#fbbf24', fontSize: '42px', margin: '0 0 20px 0' }}>Game Over!</h1>
        <h2 style={{ textAlign: 'center', color: '#f8fafc', marginBottom: '40px' }}>
          Winner: {statsData[0]?.name} with {statsData[0]?.VP} VP!
        </h2>
        
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* Deck Composition Chart */}
          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '8px', width: '100%', maxWidth: '600px', height: '350px' }}>
            <h3 style={{ marginTop: 0, textAlign: 'center', color: '#94a3b8' }}>Deck Composition</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" width={80} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #475569', color: 'white' }} />
                <Legend />
                <Bar dataKey="Treasures" stackId="a" fill="#eab308" />
                <Bar dataKey="Actions" stackId="a" fill="#3b82f6" />
                <Bar dataKey="VictoryCards" stackId="a" fill="#22c55e" />
                <Bar dataKey="Curses" stackId="a" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* VP Summary */}
          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '8px', width: '100%', maxWidth: '400px' }}>
             <h3 style={{ marginTop: 0, textAlign: 'center', color: '#94a3b8' }}>Final Standings</h3>
             <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #475569', color: '#94a3b8', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>Player</th>
                    <th style={{ padding: '8px' }}>VP</th>
                    <th style={{ padding: '8px' }}>Total Cards</th>
                  </tr>
                </thead>
                <tbody>
                  {statsData.map((s, i) => (
                    <tr key={s.name} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '12px 8px', fontWeight: i === 0 ? 'bold' : 'normal', color: i === 0 ? '#fbbf24' : 'white' }}>
                        {i === 1 ? '🥇 ' : ''}{s.name}
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{s.VP}</td>
                      <td style={{ padding: '12px 8px' }}>{s.TotalCards}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        </div>
      </div>
    );
  };
"""

code = code.replace("  const renderGameArea = () => {", endgame_func + "\n  const renderGameArea = () => {")

# Update main render block to show endgame
old_render = """      {gameState.status === 'Lobby' ? (
        <div style={{ color: 'white', padding: '40px', textAlign: 'center' }}>
          <h2>Waiting in Lobby...</h2>
          <p>Once players have joined, click Start Game.</p>
        </div>
      ) : (
        renderGameArea()
      )}"""
new_render = """      {gameState.status === 'Lobby' ? (
        <div style={{ color: 'white', padding: '40px', textAlign: 'center' }}>
          <h2>Waiting in Lobby...</h2>
          <p>Once players have joined, click Start Game.</p>
        </div>
      ) : gameState.status === 'Finished' ? (
        renderEndGame()
      ) : (
        renderGameArea()
      )}"""
code = code.replace(old_render, new_render)

with open('games/dominion/src/ui/DominionBoard.tsx', 'w') as f:
    f.write(code)

print("Endgame Patched")
