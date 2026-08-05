import React, { useState, useEffect, useRef } from 'react';
import { runSimulationBatch, PlayerConfig, SimulationResult } from '../engine/simulateGame';
import { BOT_NAMES } from '../engine/types';

export interface SimulationDashboardProps {
  gameName: string;
  reducer: (state: any, action: any) => any;
  initialState: any;
}

export const SimulationDashboard: React.FC<SimulationDashboardProps> = ({ gameName, reducer, initialState }) => {
  const [numPlayers, setNumPlayers] = useState(4);
  const [playerConfigs, setPlayerConfigs] = useState<PlayerConfig[]>(
    Array.from({ length: 4 }).map((_, i) => ({ id: `bot_${i}`, name: BOT_NAMES[i % BOT_NAMES.length], botStrategy: 'random' }))
  );
  const [totalSimulations, setTotalSimulations] = useState(100);
  
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [gamesCompleted, setGamesCompleted] = useState(0);

  const resultsRef = useRef<SimulationResult[]>([]);
  const completedRef = useRef(0);

  useEffect(() => {
    // Rebuild player configs if numPlayers changes
    setPlayerConfigs(prev => {
      const newConfigs = [...prev];
      while (newConfigs.length < numPlayers) {
        const i = newConfigs.length;
        newConfigs.push({ id: `bot_${i}`, name: BOT_NAMES[i % BOT_NAMES.length], botStrategy: 'random' });
      }
      return newConfigs.slice(0, numPlayers);
    });
  }, [numPlayers]);

  const startSimulation = () => {
    setIsRunning(true);
    setResults([]);
    setGamesCompleted(0);
    resultsRef.current = [];
    completedRef.current = 0;
    
    // Kick off async loop
    runNextBatch();
  };

  const runNextBatch = () => {
    if (completedRef.current >= totalSimulations) {
      setIsRunning(false);
      return;
    }
    
    const remaining = totalSimulations - completedRef.current;
    const batchSize = Math.min(10, remaining); // Run 10 games per tick
    
    // Give UI a tick to render
    setTimeout(() => {
      runSimulationBatch(reducer, initialState, playerConfigs, batchSize, (batchResults) => {
        resultsRef.current = [...resultsRef.current, ...batchResults];
        completedRef.current += batchSize;
        setResults(resultsRef.current);
        setGamesCompleted(completedRef.current);
        
        runNextBatch();
      });
    }, 0);
  };

  // Aggregated stats
  const strategyWins: Record<string, number> = {};
  const playerWins: Record<string, number> = {};
  let errors = 0;

  results.forEach(r => {
    if (r.error) {
      errors++;
    } else if (r.winnerStrategy && r.winnerName) {
      strategyWins[r.winnerStrategy] = (strategyWins[r.winnerStrategy] || 0) + 1;
      playerWins[r.winnerName] = (playerWins[r.winnerName] || 0) + 1;
    }
  });

  return (
    <div style={{ padding: '40px', color: 'white', backgroundColor: '#1a1a2e', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <h1>{gameName} Bot Simulation</h1>
      
      {!isRunning && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', marginTop: '20px' }}>
          <div>
            <label style={{ marginRight: '10px' }}>Number of Players: </label>
            <input type="number" min={2} max={6} value={numPlayers} onChange={e => setNumPlayers(parseInt(e.target.value) || 2)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid gray', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
          </div>
          
          <div>
            <h3 style={{ marginBottom: '10px' }}>Player Configs:</h3>
            {playerConfigs.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                <span style={{ width: '80px', color: 'gray' }}>Player {i + 1}:</span>
                <input value={p.name} onChange={e => {
                  const newConfigs = [...playerConfigs];
                  newConfigs[i].name = e.target.value;
                  setPlayerConfigs(newConfigs);
                }} style={{ padding: '8px', borderRadius: '4px', border: '1px solid gray', background: 'rgba(0,0,0,0.2)', color: 'white', width: '120px' }} />
                <select value={p.botStrategy} onChange={e => {
                  const newConfigs = [...playerConfigs];
                  newConfigs[i].botStrategy = e.target.value;
                  setPlayerConfigs(newConfigs);
                }} style={{ background: 'rgba(0,0,0,0.4)', color: 'white', border: '1px solid gray', borderRadius: '4px', padding: '8px', width: '120px' }}>
                  <option value="random">Random</option>
                  <option value="smart">Smart</option>
                </select>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '10px' }}>
            <label style={{ marginRight: '10px' }}>Games to Simulate: </label>
            <input type="number" min={1} max={100000} value={totalSimulations} onChange={e => setTotalSimulations(parseInt(e.target.value) || 100)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid gray', background: 'rgba(0,0,0,0.2)', color: 'white', width: '100px' }} />
          </div>

          <button onClick={startSimulation} style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '10px', width: 'fit-content' }}>
            Start Simulation
          </button>
        </div>
      )}

      {isRunning && (
        <div style={{ marginTop: '30px', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', maxWidth: '600px' }}>
          <h2>Running... {gamesCompleted} / {totalSimulations}</h2>
          <div style={{ width: '100%', height: '20px', background: 'rgba(0,0,0,0.4)', borderRadius: '10px', overflow: 'hidden', marginTop: '15px' }}>
            <div style={{ width: `${(gamesCompleted / totalSimulations) * 100}%`, height: '100%', background: '#4ade80', transition: 'width 0.1s' }} />
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div style={{ marginTop: '40px', display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 15px 0' }}>Win Rates by Strategy</h3>
            <table style={{ width: '300px', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid gray' }}>
                  <th style={{ padding: '8px' }}>Strategy</th>
                  <th style={{ padding: '8px' }}>Wins</th>
                  <th style={{ padding: '8px' }}>%</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(strategyWins).sort((a,b) => b[1]-a[1]).map(([strat, wins]) => (
                  <tr key={strat} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <td style={{ padding: '8px', textTransform: 'capitalize' }}>{strat}</td>
                    <td style={{ padding: '8px' }}>{wins}</td>
                    <td style={{ padding: '8px' }}>{((wins / results.length) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 15px 0' }}>Win Rates by Player</h3>
            <table style={{ width: '300px', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid gray' }}>
                  <th style={{ padding: '8px' }}>Player</th>
                  <th style={{ padding: '8px' }}>Wins</th>
                  <th style={{ padding: '8px' }}>%</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(playerWins).sort((a,b) => b[1]-a[1]).map(([player, wins]) => (
                  <tr key={player} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <td style={{ padding: '8px' }}>{player}</td>
                    <td style={{ padding: '8px' }}>{wins}</td>
                    <td style={{ padding: '8px' }}>{((wins / results.length) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {errors > 0 && (
            <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '20px', borderRadius: '12px' }}>
              <h3 style={{ margin: '0 0 10px 0' }}>Errors</h3>
              <p style={{ margin: 0 }}>{errors} games failed to complete.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
