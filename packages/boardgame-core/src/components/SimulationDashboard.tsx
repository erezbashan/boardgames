import React, { useState, useEffect, useRef } from 'react';
import { runSimulationBatch, PlayerConfig, SimulationResult } from '../engine/simulateGame';
import { BOT_NAMES } from '../engine/types';
import { createInitialPopulation, evolvePopulation, getStrategyString, PopulationMember } from '../engine/geneticAlgorithm';

export interface SimulationDashboardProps {
  gameName: string;
  reducer: (state: any, action: any) => any;
  initialState: any;
}

export const SimulationDashboard: React.FC<SimulationDashboardProps> = ({ gameName, reducer, initialState }) => {
  const [mode, setMode] = useState<'standard' | 'genetic'>('standard');

  // Standard Mode State
  const [numPlayers, setNumPlayers] = useState(4);
  const [playerConfigs, setPlayerConfigs] = useState<PlayerConfig[]>(
    Array.from({ length: 4 }).map((_, i) => ({ id: `bot_${i}`, botStrategy: 'random' }))
  );
  const [totalSimulations, setTotalSimulations] = useState(100);
  
  // Genetic Mode State
  const [popSize, setPopSize] = useState(100); // Small for faster testing by default
  const [numGenerations, setNumGenerations] = useState(10);
  const [gamesPerGen, setGamesPerGen] = useState(1000);
  
  const [isRunning, setIsRunning] = useState(false);
  
  // Shared Progress State
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [gamesCompleted, setGamesCompleted] = useState(0);
  const [currentGen, setCurrentGen] = useState(0);
  const [bestBotDna, setBestBotDna] = useState<number[] | null>(null);

  const resultsRef = useRef<SimulationResult[]>([]);
  const completedRef = useRef(0);
  
  // Genetic Refs
  const popRef = useRef<PopulationMember[]>([]);
  const genRef = useRef(0);

  useEffect(() => {
    setPlayerConfigs(prev => {
      const newConfigs = [...prev];
      while (newConfigs.length < numPlayers) {
        newConfigs.push({ id: `bot_${newConfigs.length}`, botStrategy: 'random' });
      }
      return newConfigs.slice(0, numPlayers);
    });
  }, [numPlayers]);

  const startStandard = () => {
    setIsRunning(true);
    setResults([]);
    setGamesCompleted(0);
    resultsRef.current = [];
    completedRef.current = 0;
    runNextStandardBatch();
  };

  const runNextStandardBatch = () => {
    if (completedRef.current >= totalSimulations) {
      setIsRunning(false);
      return;
    }
    const remaining = totalSimulations - completedRef.current;
    const batchSize = Math.min(10, remaining);
    
    setTimeout(() => {
      runSimulationBatch(reducer, initialState, playerConfigs, batchSize, (batchResults) => {
        resultsRef.current = [...resultsRef.current, ...batchResults];
        completedRef.current += batchSize;
        setResults(resultsRef.current);
        setGamesCompleted(completedRef.current);
        runNextStandardBatch();
      });
    }, 0);
  };

  const startGenetic = () => {
    setIsRunning(true);
    setResults([]);
    setGamesCompleted(0);
    setCurrentGen(1);
    setBestBotDna(null);
    
    popRef.current = createInitialPopulation(popSize);
    genRef.current = 1;
    completedRef.current = 0;
    resultsRef.current = [];
    
    runNextGeneticBatch();
  };

  const runNextGeneticBatch = () => {
    if (completedRef.current >= gamesPerGen) {
      // Generation finished! Evolve!
      const best = [...popRef.current].sort((a,b) => (b.wins / Math.max(1, b.gamesPlayed)) - (a.wins / Math.max(1, a.gamesPlayed)))[0];
      setBestBotDna(best.dna);

      if (genRef.current >= numGenerations) {
        setIsRunning(false);
        return; // All generations done
      }
      
      // Evolve
      popRef.current = evolvePopulation(popRef.current, genRef.current);
      genRef.current++;
      setCurrentGen(genRef.current);
      completedRef.current = 0;
      resultsRef.current = [];
      setGamesCompleted(0);
      
      // Yield before next generation
      setTimeout(runNextGeneticBatch, 0);
      return;
    }

    const batchSize = Math.min(10, gamesPerGen - completedRef.current);
    
    // For genetic batch, generate random players per game
    // To batch this effectively in `runSimulationBatch`, we need identical configs for the batch.
    // So we'll just run 1 game at a time in a loop synchronously for `batchSize` games, then yield.
    
    let batchResults: SimulationResult[] = [];
    
    try {
        for (let i = 0; i < batchSize; i++) {
          const gamePlayersCount = Math.floor(Math.random() * 5) + 2; // 2 to 6
          const pConfigs: PlayerConfig[] = [];
          const selectedBots: PopulationMember[] = [];
          
          for (let p = 0; p < gamePlayersCount; p++) {
            const bot = popRef.current[Math.floor(Math.random() * popRef.current.length)];
            selectedBots.push(bot);
            pConfigs.push({ id: bot.id, botStrategy: getStrategyString(bot.dna) });
          }
          
          // Run 1 game synchronously
          runSimulationBatch(reducer, initialState, pConfigs, 1, (res) => {
            batchResults.push(res[0]);
            selectedBots.forEach(b => b.gamesPlayed++);
            if (res[0].winnerId) {
              const winnerBot = selectedBots.find(b => b.id === res[0].winnerId);
              if (winnerBot) winnerBot.wins++;
            }
          });
        }
    } catch (e) {
       console.error(e);
    }

    completedRef.current += batchSize;
    setGamesCompleted(completedRef.current);
    setTimeout(runNextGeneticBatch, 0);
  };

  const strategyWins: Record<string, number> = {};
  let errors = 0;
  results.forEach(r => {
    if (r.error) {
      console.error(r.error);
      errors++;
    } else if (r.winnerStrategy) {
      strategyWins[r.winnerStrategy] = (strategyWins[r.winnerStrategy] || 0) + 1;
    }
  });

  return (
    <div style={{ padding: '40px', color: 'white', backgroundColor: '#1a1a2e', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: '20px' }}>{gameName} Bot Simulation</h1>
      
      {!isRunning && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => setMode('standard')} style={{ padding: '10px', background: mode === 'standard' ? '#3b82f6' : '#334155', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Standard Mode</button>
          <button onClick={() => setMode('genetic')} style={{ padding: '10px', background: mode === 'genetic' ? '#3b82f6' : '#334155', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Genetic Evolution</button>
        </div>
      )}

      {mode === 'standard' && !isRunning && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
          <div>
            <label style={{ marginRight: '10px' }}>Number of Players: </label>
            <input type="number" min={2} max={6} value={numPlayers} onChange={e => setNumPlayers(parseInt(e.target.value) || 2)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid gray', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
          </div>
          
          <div>
            <h3 style={{ marginBottom: '10px' }}>Player Configs:</h3>
            {playerConfigs.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                <span style={{ width: '80px', color: 'gray' }}>Player {i + 1}:</span>
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

          <button onClick={startStandard} style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            Start Simulation
          </button>
        </div>
      )}

      {mode === 'genetic' && !isRunning && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
          <div>
            <label style={{ marginRight: '10px' }}>Population Size: </label>
            <input type="number" value={popSize} onChange={e => setPopSize(parseInt(e.target.value) || 10)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid gray', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
          </div>
          <div>
            <label style={{ marginRight: '10px' }}>Generations: </label>
            <input type="number" value={numGenerations} onChange={e => setNumGenerations(parseInt(e.target.value) || 1)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid gray', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
          </div>
          <div>
            <label style={{ marginRight: '10px' }}>Games per Gen: </label>
            <input type="number" value={gamesPerGen} onChange={e => setGamesPerGen(parseInt(e.target.value) || 100)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid gray', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
          </div>

          <button onClick={startGenetic} style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            Start Genetic Evolution
          </button>
        </div>
      )}

      {isRunning && mode === 'standard' && (
        <div style={{ marginTop: '30px', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', maxWidth: '600px' }}>
          <h2>Running... {gamesCompleted} / {totalSimulations}</h2>
          <div style={{ width: '100%', height: '20px', background: 'rgba(0,0,0,0.4)', borderRadius: '10px', overflow: 'hidden', marginTop: '15px' }}>
            <div style={{ width: `${(gamesCompleted / totalSimulations) * 100}%`, height: '100%', background: '#4ade80', transition: 'width 0.1s' }} />
          </div>
        </div>
      )}

      {(isRunning || bestBotDna) && mode === 'genetic' && (
        <div style={{ marginTop: '30px', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', maxWidth: '800px' }}>
          <h2>Generation: {currentGen} / {numGenerations}</h2>
          <p>Games Played: {gamesCompleted} / {gamesPerGen}</p>
          <div style={{ width: '100%', height: '20px', background: 'rgba(0,0,0,0.4)', borderRadius: '10px', overflow: 'hidden', marginTop: '15px', marginBottom: '20px' }}>
            <div style={{ width: `${(gamesCompleted / gamesPerGen) * 100}%`, height: '100%', background: '#a855f7', transition: 'width 0.1s' }} />
          </div>

          {bestBotDna && (
            <div style={{ marginTop: '20px', background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '8px' }}>
              <h3 style={{ color: '#4ade80' }}>🏆 Best Bot DNA (Current Generation Leader)</h3>
              <div style={{ fontSize: '12px', wordBreak: 'break-all', color: 'gray', marginTop: '10px' }}>
                {JSON.stringify(bestBotDna)}
              </div>
            </div>
          )}
        </div>
      )}

      {!isRunning && results.length > 0 && mode === 'standard' && (
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
                    <td style={{ padding: '8px', textTransform: 'capitalize', wordBreak: 'break-all' }}>{strat}</td>
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
              <p style={{ margin: 0 }}>{errors} games failed to complete. Check console for details.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
