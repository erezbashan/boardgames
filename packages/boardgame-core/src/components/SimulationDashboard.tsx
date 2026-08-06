import React, { useState, useEffect, useRef, useMemo } from 'react';
import { runSimulationBatch, PlayerConfig, SimulationResult } from '../engine/simulateGame';
import { BOT_NAMES } from '../engine/types';
import { createInitialPopulation, evolvePopulation, getStrategyString, PopulationMember } from '../engine/geneticAlgorithm';

export interface SimulationDashboardProps {
  gameName: string;
  gameType: string;
  reducer: (state: any, action: any) => any;
  initialState: any;
  simId?: string; // Optional URL parameter for detail view
  onStartGeneticSim?: (config: any) => Promise<string>;
  onListenGeneticSim?: (simId: string, cb: (data: any) => void) => () => void;
  onListGeneticSims?: (gameType: string, cb: (sims: any[]) => void) => () => void;
  onStopGeneticSim?: (simId: string) => Promise<void>;
  onNavigateToSim?: (simId: string) => void;
}

export const SimulationDashboard: React.FC<SimulationDashboardProps> = ({ gameName, gameType, reducer, initialState, simId: urlSimId, onStartGeneticSim, onListenGeneticSim, onListGeneticSims, onStopGeneticSim, onNavigateToSim }) => {
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
  const [simId, setSimId] = useState<string | null>(urlSimId || null);
  const [simList, setSimList] = useState<any[]>([]);
  const [isListView, setIsListView] = useState<boolean>(!urlSimId);

  // Sync state if urlSimId changes
  useEffect(() => {
    setSimId(urlSimId || null);
    setIsListView(!urlSimId);
  }, [urlSimId]);

  useEffect(() => {
    if (isListView && onListGeneticSims) {
      return onListGeneticSims(gameType, (sims) => {
        setSimList(sims);
      });
    }
  }, [isListView, onListGeneticSims, gameType]);

  useEffect(() => {
    if (isListView || !simId || !onListenGeneticSim) return;
    
    return onListenGeneticSim(simId, (data) => {
      if (!data) return;
      setCurrentGen(data.currentGeneration || 1);
      setGamesCompleted(data.gamesCompleted || 0);
      setIsRunning(data.status === 'running');
      if (data.config) {
        setNumGenerations(data.config.numGenerations);
        setGamesPerGen(data.config.gamesPerGen);
        setPopSize(data.config.popSize);
      }
      
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
        if (onNavigateToSim) {
          onNavigateToSim(id);
        } else {
          setSimId(id);
          setIsListView(false);
        }
      } catch (e) {
        console.error(e);
        setIsRunning(false);
      }
    }
  };

  const handleStopSim = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onStopGeneticSim) {
      await onStopGeneticSim(id);
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
      return rows;
    };

      const renderEvolutionTable = (history: any[]) => {
        if (!history || history.length === 0) return null;
        
        const sortedHistory = [...history].sort((a,b) => a.generation - b.generation);
        
        // Define all categories we want to track
        const categoryKeys = [
          'Location / Outside', 'Location / In Tokyo',
          'Players / 2 left', 'Players / 3-4 left', 'Players / 5-6 left',
          'Health / 1-3 HP', 'Health / 4-6 HP', 'Health / 7-10 HP',
          'VP / 0-9 VP', 'VP / 10-14 VP', 'VP / 15-19 VP'
        ];
        
        // Initialize an object to hold the computed stats for every generation and every category
        // genStats[genNum][categoryKey] = { total: 0, a: 0, h: 0, e: 0, p: 0 }
        const genStats: Record<number, Record<string, any>> = {};
        
        sortedHistory.forEach(doc => {
          const gen = doc.generation;
          const dna = doc.bestDna;
          genStats[gen] = {};
          categoryKeys.forEach(k => { genStats[gen][k] = { total: 0, a: 0, h: 0, e: 0, p: 0 }; });
          
          const addStat = (catObj: any, mask: number) => {
            catObj.total++;
            let activeTraits = 0;
            if ((mask & 1) > 0) activeTraits++;
            if ((mask & 2) > 0) activeTraits++;
            if ((mask & 4) > 0) activeTraits++;
            if ((mask & 8) > 0) activeTraits++;
            
            if (activeTraits > 0) {
              const weight = 1 / activeTraits;
              if ((mask & 1) > 0) catObj.a += weight;
              if ((mask & 2) > 0) catObj.h += weight;
              if ((mask & 4) > 0) catObj.e += weight;
              if ((mask & 8) > 0) catObj.p += weight;
            }
          };

          for (let inTokyo = 0; inTokyo < 2; inTokyo++) {
            for (let remGroup = 0; remGroup < 3; remGroup++) {
              for (let hpGroup = 0; hpGroup < 3; hpGroup++) {
                for (let vpGroup = 0; vpGroup < 3; vpGroup++) {
                  const index = inTokyo * 27 + remGroup * 9 + hpGroup * 3 + vpGroup;
                  const mask = dna[index];
                  
                  addStat(genStats[gen][inTokyo ? 'Location / In Tokyo' : 'Location / Outside'], mask);
                  addStat(genStats[gen][remGroup === 0 ? 'Players / 2 left' : remGroup === 1 ? 'Players / 3-4 left' : 'Players / 5-6 left'], mask);
                  addStat(genStats[gen][hpGroup === 0 ? 'Health / 1-3 HP' : hpGroup === 1 ? 'Health / 4-6 HP' : 'Health / 7-10 HP'], mask);
                  addStat(genStats[gen][vpGroup === 0 ? 'VP / 0-9 VP' : vpGroup === 1 ? 'VP / 10-14 VP' : 'VP / 15-19 VP'], mask);
                }
              }
            }
          }
        });

        return (
          <div style={{ overflowX: 'auto', background: 'rgba(0,0,0,0.5)', padding: '15px', borderRadius: '8px', marginBottom: '30px' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid gray' }}>
                  <th style={{ padding: '8px', minWidth: '150px' }}>Category</th>
                  {sortedHistory.map(doc => (
                    <th key={doc.generation} style={{ padding: '8px', minWidth: '100px' }}>Gen {doc.generation}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categoryKeys.map((catKey, i) => (
                  <tr key={catKey} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>{catKey}</td>
                    {sortedHistory.map(doc => {
                      const stats = genStats[doc.generation][catKey];
                      const a = Math.round((stats.a / stats.total) * 100);
                      const h = Math.round((stats.h / stats.total) * 100);
                      const e = Math.round((stats.e / stats.total) * 100);
                      const p = Math.round((stats.p / stats.total) * 100);
                      return (
                        <td key={doc.generation} style={{ padding: '8px', verticalAlign: 'top' }}>
                          <div style={{ color: '#ef4444' }}>ATK: {a}%</div>
                          <div style={{ color: '#ec4899' }}>HP: {h}%</div>
                          <div style={{ color: '#3b82f6' }}>NRG: {e}%</div>
                          <div style={{ color: '#eab308' }}>PTS: {p}%</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      };



  return (
    <div style={{ padding: '40px', color: 'white', backgroundColor: '#1a1a2e', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: '20px' }}>{gameName} Bot Simulation</h1>
      
      {!isRunning && (
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <button 
          onClick={() => {
            setMode('standard');
            setIsListView(false);
          }}
          style={{ background: mode === 'standard' && !isListView ? '#3b82f6' : 'rgba(255,255,255,0.1)', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
        >
          Head-to-Head Simulation
        </button>
        <button 
          onClick={() => {
            setMode('genetic');
            setIsListView(true); // Always go to list view when clicking the main tab
            if (onNavigateToSim) onNavigateToSim(''); // clear URL
          }}
          style={{ background: mode === 'genetic' || isListView ? '#4ade80' : 'rgba(255,255,255,0.1)', color: mode === 'genetic' ? 'black' : 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
        >
          Genetic Evolution
        </button>
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

      {mode === 'genetic' && isListView && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', maxWidth: '800px', marginBottom: '30px' }}>
            <h3>Start New Evolution</h3>
            <div style={{ display: 'flex', gap: '20px', marginTop: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'gray', marginBottom: '5px' }}>Population Size</label>
                <input type="number" value={popSize} onChange={e => setPopSize(parseInt(e.target.value))} style={{ background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid gray', padding: '8px', borderRadius: '4px', width: '120px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'gray', marginBottom: '5px' }}>Generations</label>
                <input type="number" value={numGenerations} onChange={e => setNumGenerations(parseInt(e.target.value))} style={{ background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid gray', padding: '8px', borderRadius: '4px', width: '120px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'gray', marginBottom: '5px' }}>Games per Generation</label>
                <input type="number" value={gamesPerGen} onChange={e => setGamesPerGen(parseInt(e.target.value))} style={{ background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid gray', padding: '8px', borderRadius: '4px', width: '120px' }} />
              </div>
            </div>
            <button 
              onClick={startGenetic}
              style={{ marginTop: '20px', background: '#4ade80', color: 'black', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Start Evolution
            </button>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', maxWidth: '800px' }}>
            <h3>Past & Ongoing Simulations</h3>
            {simList.length === 0 ? (
              <p style={{ color: 'gray' }}>No simulations found for this game.</p>
            ) : (
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '15px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid gray' }}>
                    <th style={{ padding: '10px' }}>ID</th>
                    <th style={{ padding: '10px' }}>Status</th>
                    <th style={{ padding: '10px' }}>Generation</th>
                    <th style={{ padding: '10px' }}>Created</th>
                    <th style={{ padding: '10px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {simList.map(s => (
                    <tr key={s.id} onClick={() => onNavigateToSim ? onNavigateToSim(s.id) : (setSimId(s.id), setIsListView(false))} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', ':hover': { background: 'rgba(255,255,255,0.05)' } } as any}>
                      <td style={{ padding: '10px', color: '#3b82f6', textDecoration: 'underline' }}>{s.id.substring(0, 8)}...</td>
                      <td style={{ padding: '10px', color: s.status === 'running' ? '#4ade80' : s.status === 'stopped' ? '#ef4444' : 'gray' }}>{s.status.toUpperCase()}</td>
                      <td style={{ padding: '10px' }}>{s.currentGeneration} / {s.config?.numGenerations || '?'}</td>
                      <td style={{ padding: '10px', fontSize: '12px', color: 'gray' }}>
                        {s.createdAt?.toDate ? s.createdAt.toDate().toLocaleString() : 'Just now'}
                      </td>
                      <td style={{ padding: '10px' }}>
                        {s.status === 'running' && (
                          <button 
                            onClick={(e) => handleStopSim(s.id, e)}
                            style={{ background: '#ef4444', color: 'white', padding: '4px 10px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Stop
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
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

      {(isRunning || historyDocs.length > 0) && mode === 'genetic' && !isListView && (
        <div style={{ marginTop: '30px', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', maxWidth: '800px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Generation: {currentGen} / {numGenerations}</h2>
            {isRunning && (
              <button 
                 onClick={() => simId && handleStopSim(simId)}
                 style={{ background: '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
              >
                 Stop Simulation
              </button>
            )}
          </div>
          
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
              <h4 style={{ margin: '0 0 10px 0' }}>Evolutionary Progress</h4>
              {renderEvolutionTable(historyDocs)}
              
              <p style={{ color: 'gray', fontSize: '13px', margin: '0 0 10px 0' }}>
                This is a map of exactly what this bot targets in all 54 possible game states.
              </p>
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
                    {bestBotDna && renderReadableDNA(bestBotDna)}
                  </tbody>
                </table>
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
