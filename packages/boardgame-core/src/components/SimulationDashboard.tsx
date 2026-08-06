import React, { useState, useEffect, useRef, useMemo } from 'react';
import { runSimulationBatch, PlayerConfig, SimulationResult } from '../engine/simulateGame';
import { BOT_NAMES } from '../engine/types';
import { createInitialPopulation, evolvePopulation, getStrategyString, PopulationMember } from '../engine/geneticAlgorithm';

export interface SimulationDashboardProps {
  gameName: string;
  gameType: string;
  reducer: (state: any, action: any) => any;
  initialState: any;
  onStartGeneticSim?: (config: any) => Promise<string>;
  onListenGeneticSim?: (simId: string, cb: (data: any) => void) => () => void;
}

export const SimulationDashboard: React.FC<SimulationDashboardProps> = ({ gameName, gameType, reducer, initialState, onStartGeneticSim, onListenGeneticSim }) => {
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
  const [historicalBestDna, setHistoricalBestDna] = useState<number[] | null>(null);
  const [historyDocs, setHistoryDocs] = useState<any[]>([]);
  const [selectedGen, setSelectedGen] = useState<number | null>(null);
  const [simId, setSimId] = useState<string | null>(null);

  useEffect(() => {
    if (!simId || !onListenGeneticSim) return;
    
    return onListenGeneticSim(simId, (data) => {
      if (!data) return;
      setCurrentGen(data.currentGeneration || 1);
      setGamesCompleted(data.gamesCompleted || 0);
      
      if (data.history && data.history.length > 0) {
        setHistoryDocs(data.history);
        
        // If user hasn't overridden it, show the latest generation's DNA
        if (!selectedGen || selectedGen === data.currentGeneration - 1) {
           const latest = data.history[data.history.length - 1];
           setBestBotDna(latest.bestDna);
        }
      }

      if (data.status === 'finished') {
        setIsRunning(false);
      }
    });
  }, [simId, onListenGeneticSim, selectedGen]);

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

  const startGenetic = async () => {
    setIsRunning(true);
    setCurrentGen(1);
    setBestBotDna(null);
    setHistoryDocs([]);
    setSelectedGen(null);
    
    if (onStartGeneticSim) {
      try {
        const id = await onStartGeneticSim({ popSize, numGenerations, gamesPerGen, gameType });
        setSimId(id);
      } catch (e) {
        console.error(e);
        setIsRunning(false);
      }
    }
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

    const decodeStrategyMask = (mask: number) => {
      const targets = [];
      if ((mask & 1) > 0) targets.push('Attack');
      if ((mask & 2) > 0) targets.push('Health');
      if ((mask & 4) > 0) targets.push('Energy');
      if ((mask & 8) > 0) targets.push('Points');
      return targets.length > 0 ? targets.join(' + ') : 'Nothing';
    };

    const renderReadableDNA = (dna: number[]) => {
      const rows = [];
      const locationStats = { Outside: { total: 0, a: 0, h: 0, e: 0, p: 0 }, InTokyo: { total: 0, a: 0, h: 0, e: 0, p: 0 } };
      const playerStats = { '2': { total: 0, a: 0, h: 0, e: 0, p: 0 }, '3-4': { total: 0, a: 0, h: 0, e: 0, p: 0 }, '5-6': { total: 0, a: 0, h: 0, e: 0, p: 0 } };
      const hpStats = { '1-3': { total: 0, a: 0, h: 0, e: 0, p: 0 }, '4-6': { total: 0, a: 0, h: 0, e: 0, p: 0 }, '7-10': { total: 0, a: 0, h: 0, e: 0, p: 0 } };
      const vpStats = { '0-9': { total: 0, a: 0, h: 0, e: 0, p: 0 }, '10-14': { total: 0, a: 0, h: 0, e: 0, p: 0 }, '15-19': { total: 0, a: 0, h: 0, e: 0, p: 0 } };

      const addStat = (statObj: any, mask: number) => {
        statObj.total++;
        let activeTraits = 0;
        if ((mask & 1) > 0) activeTraits++;
        if ((mask & 2) > 0) activeTraits++;
        if ((mask & 4) > 0) activeTraits++;
        if ((mask & 8) > 0) activeTraits++;
        
        if (activeTraits > 0) {
          const weight = 1 / activeTraits;
          if ((mask & 1) > 0) statObj.a += weight;
          if ((mask & 2) > 0) statObj.h += weight;
          if ((mask & 4) > 0) statObj.e += weight;
          if ((mask & 8) > 0) statObj.p += weight;
        }
      };

      for (let inTokyo = 0; inTokyo < 2; inTokyo++) {
        for (let remGroup = 0; remGroup < 3; remGroup++) {
          for (let hpGroup = 0; hpGroup < 3; hpGroup++) {
            for (let vpGroup = 0; vpGroup < 3; vpGroup++) {
              const index = inTokyo * 27 + remGroup * 9 + hpGroup * 3 + vpGroup;
              const mask = dna[index];
              
              const locStr = inTokyo ? 'In Tokyo' : 'Outside';
              const pStr = remGroup === 0 ? '2' : remGroup === 1 ? '3-4' : '5-6';
              const hpStr = hpGroup === 0 ? '1-3' : hpGroup === 1 ? '4-6' : '7-10';
              const vpStr = vpGroup === 0 ? '0-9' : vpGroup === 1 ? '10-14' : '15-19';

              // Update summaries
              addStat(inTokyo ? locationStats.InTokyo : locationStats.Outside, mask);
              addStat(remGroup === 0 ? playerStats['2'] : remGroup === 1 ? playerStats['3-4'] : playerStats['5-6'], mask);
              addStat(hpGroup === 0 ? hpStats['1-3'] : hpGroup === 1 ? hpStats['4-6'] : hpStats['7-10'], mask);
              addStat(vpGroup === 0 ? vpStats['0-9'] : vpGroup === 1 ? vpStats['10-14'] : vpStats['15-19'], mask);

              rows.push(
                <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <td style={{ padding: '4px 8px' }}>{locStr}</td>
                  <td style={{ padding: '4px 8px' }}>{pStr} left</td>
                  <td style={{ padding: '4px 8px', color: hpGroup === 0 ? '#ef4444' : 'inherit' }}>{hpStr} HP</td>
                  <td style={{ padding: '4px 8px', color: vpGroup === 2 ? '#4ade80' : 'inherit' }}>{vpStr} VP</td>
                  <td style={{ padding: '4px 8px', fontWeight: 'bold', color: '#a855f7' }}>{decodeStrategyMask(mask)}</td>
                </tr>
              );
            }
          }
        }
      }

      const renderSummaryTable = (title: string, dataObj: any) => (
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h4 style={{ margin: '10px 0 5px 0' }}>{title}</h4>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '13px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid gray' }}>
                <th style={{ padding: '4px' }}>Group</th>
                <th style={{ padding: '4px', color: '#ef4444' }}>ATK</th>
                <th style={{ padding: '4px', color: '#ec4899' }}>HP</th>
                <th style={{ padding: '4px', color: '#3b82f6' }}>NRG</th>
                <th style={{ padding: '4px', color: '#eab308' }}>PTS</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(dataObj).map(([key, stats]: [string, any]) => (
                <tr key={key} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <td style={{ padding: '4px' }}>{key}</td>
                  <td style={{ padding: '4px' }}>{Math.round((stats.a / stats.total) * 100)}%</td>
                  <td style={{ padding: '4px' }}>{Math.round((stats.h / stats.total) * 100)}%</td>
                  <td style={{ padding: '4px' }}>{Math.round((stats.e / stats.total) * 100)}%</td>
                  <td style={{ padding: '4px' }}>{Math.round((stats.p / stats.total) * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

      return (
        <div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
             {renderSummaryTable('By Location', locationStats)}
             {renderSummaryTable('By Players Left', playerStats)}
             {renderSummaryTable('By Health', hpStats)}
             {renderSummaryTable('By VP', vpStats)}
          </div>
          
          <h4 style={{ margin: '0 0 10px 0' }}>Full DNA Mapping</h4>
          <div style={{ maxHeight: '400px', overflowY: 'auto', background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '8px' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid gray' }}>
                  <th style={{ padding: '8px' }}>Location</th>
                  <th style={{ padding: '8px' }}>Players</th>
                  <th style={{ padding: '8px' }}>Health</th>
                  <th style={{ padding: '8px' }}>Victory Points</th>
                  <th style={{ padding: '8px' }}>Target Strategy</th>
                </tr>
              </thead>
              <tbody>
                {rows}
              </tbody>
            </table>
          </div>
        </div>
      );
    };

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

      {(isRunning || historyDocs.length > 0) && mode === 'genetic' && (
        <div style={{ marginTop: '30px', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', maxWidth: '800px' }}>
          <h2>Generation: {currentGen} / {numGenerations}</h2>
          
          {isRunning && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#4ade80' }}>
                 <div style={{ width: '20px', height: '20px', border: '3px solid #4ade80', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                 Computing massively parallel simulation on backend...
              </div>
              <p style={{ marginTop: '10px' }}>Games Played: {gamesCompleted} / {gamesPerGen}</p>
              <div style={{ width: '100%', height: '20px', background: 'rgba(0,0,0,0.4)', borderRadius: '10px', overflow: 'hidden', marginTop: '10px', marginBottom: '20px' }}>
                <div style={{ width: `${(gamesCompleted / gamesPerGen) * 100}%`, height: '100%', background: '#a855f7', transition: 'width 0.1s' }} />
              </div>
            </div>
          )}

          {historyDocs.length > 0 && (
            <div style={{ marginTop: '20px', background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ color: '#4ade80', margin: 0 }}>🏆 Best Bot DNA</h3>
                <select value={selectedGen || currentGen - 1} onChange={e => {
                   const gen = parseInt(e.target.value);
                   setSelectedGen(gen);
                   const doc = historyDocs.find(d => d.generation === gen);
                   if (doc) setBestBotDna(doc.bestDna);
                }} style={{ background: 'rgba(0,0,0,0.4)', color: 'white', border: '1px solid gray', borderRadius: '4px', padding: '8px' }}>
                   {historyDocs.map(d => (
                     <option key={d.generation} value={d.generation}>Generation {d.generation}</option>
                   ))}
                </select>
              </div>
              <p style={{ color: 'gray', fontSize: '13px', margin: '0 0 10px 0' }}>
                This is a map of exactly what this bot targets in all 54 possible game states.
              </p>
              {bestBotDna && renderReadableDNA(bestBotDna)}
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
