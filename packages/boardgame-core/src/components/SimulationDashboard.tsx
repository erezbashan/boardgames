import React, { useState, useEffect, useRef } from 'react';
import { runSimulationBatch, PlayerConfig, SimulationResult } from '../engine/simulateGame';

export interface SimulationDashboardProps {
  gameName: string;
  gameType: string;
  reducer: (state: any, action: any) => any;
  initialState: any;
  simId?: string;
  viewType?: 'head-to-head' | 'genetic-list' | 'genetic-detail';
  onStartGeneticSim?: (config: any) => Promise<string>;
  onListenGeneticSim?: (simId: string, cb: (data: any) => void) => () => void;
  onListGeneticSims?: (gameType: string, cb: (sims: any[]) => void) => () => void;
  onStopGeneticSim?: (simId: string) => Promise<void>;
  onResumeGeneticSim?: (simId: string) => Promise<void>;
  onDeleteGeneticSim?: (simId: string) => Promise<void>;
  onNavigateToSim?: (simId: string) => void;
}

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
    for (let hpGroup = 0; hpGroup < 3; hpGroup++) {
      for (let vpGroup = 0; vpGroup < 3; vpGroup++) {
        const index = inTokyo * 9 + hpGroup * 3 + vpGroup;
        const mask = dna[index];
        
        const locStr = inTokyo ? 'In Tokyo' : 'Outside';
        const hpStr = hpGroup === 0 ? '1-3' : hpGroup === 1 ? '4-6' : '7-10';
        const vpStr = vpGroup === 0 ? '0-9' : vpGroup === 1 ? '10-14' : '15-19';

        rows.push(
          <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <td style={{ padding: '4px 8px' }}>{locStr}</td>
            <td style={{ padding: '4px 8px', color: hpGroup === 0 ? '#ef4444' : 'inherit' }}>{hpStr} HP</td>
            <td style={{ padding: '4px 8px', color: vpGroup === 2 ? '#4ade80' : 'inherit' }}>{vpStr} VP</td>
            <td style={{ padding: '4px 8px', fontWeight: 'bold', color: '#a855f7' }}>{decodeStrategyMask(mask)}</td>
          </tr>
        );
      }
    }
  }
  return rows;
};

const renderEvolutionTable = (history: any[]) => {
  if (!history || history.length === 0) return null;
  
  const sortedHistory = [...history].sort((a,b) => b.generation - a.generation);
  
  const categoryKeys = [
    'Location / Outside', 'Location / In Tokyo',
    'Health / 1-3 HP', 'Health / 4-6 HP', 'Health / 7-10 HP',
    'VP / 0-9 VP', 'VP / 10-14 VP', 'VP / 15-19 VP'
  ];
  
  const genStats: Record<number, Record<string, any>> = {};
  
  sortedHistory.forEach(doc => {
    const gen = doc.generation;
    genStats[gen] = {};
    categoryKeys.forEach(k => { genStats[gen][k] = { total: 0, a: 0, h: 0, e: 0, p: 0 }; });

    if (doc.avgDna) {
      for (let inTokyo = 0; inTokyo < 2; inTokyo++) {
        for (let hpGroup = 0; hpGroup < 3; hpGroup++) {
          for (let vpGroup = 0; vpGroup < 3; vpGroup++) {
            const index = inTokyo * 9 + hpGroup * 3 + vpGroup;
            const stats = doc.avgDna[index];
            if (!stats) continue;
            
            const addAvgStat = (catObj: any, s: any) => {
              catObj.total += s.total;
              catObj.a += s.a;
              catObj.h += s.h;
              catObj.e += s.e;
              catObj.p += s.p;
            };

            addAvgStat(genStats[gen][inTokyo ? 'Location / In Tokyo' : 'Location / Outside'], stats);
            addAvgStat(genStats[gen][hpGroup === 0 ? 'Health / 1-3 HP' : hpGroup === 1 ? 'Health / 4-6 HP' : 'Health / 7-10 HP'], stats);
            addAvgStat(genStats[gen][vpGroup === 0 ? 'VP / 0-9 VP' : vpGroup === 1 ? 'VP / 10-14 VP' : 'VP / 15-19 VP'], stats);
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
                if (!stats || stats.total === 0) return <td key={doc.generation}>-</td>;
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


function HeadToHeadView({ reducer, initialState }: any) {
  const [numPlayers, setNumPlayers] = useState(4);
  const [playerConfigs, setPlayerConfigs] = useState<PlayerConfig[]>(
    Array.from({ length: 4 }).map((_, i) => ({ id: `bot_${i}`, botStrategy: 'random' }))
  );
  const [totalSimulations, setTotalSimulations] = useState(100);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [gamesCompleted, setGamesCompleted] = useState(0);

  const resultsRef = useRef<SimulationResult[]>([]);
  const completedRef = useRef(0);

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

  const strategyWins: Record<string, number> = {};
  let errors = 0;
  results.forEach(r => {
    if (r.error) {
      errors++;
    } else if (r.winnerStrategy) {
      strategyWins[r.winnerStrategy] = (strategyWins[r.winnerStrategy] || 0) + 1;
    }
  });

  return (
    <div>
      {!isRunning && (
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

      {isRunning && (
        <div style={{ marginTop: '30px', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', maxWidth: '600px' }}>
          <h2>Running... {gamesCompleted} / {totalSimulations}</h2>
          <div style={{ width: '100%', height: '20px', background: 'rgba(0,0,0,0.4)', borderRadius: '10px', overflow: 'hidden', marginTop: '15px' }}>
            <div style={{ width: `${(gamesCompleted / totalSimulations) * 100}%`, height: '100%', background: '#4ade80', transition: 'width 0.1s' }} />
          </div>
        </div>
      )}

      {!isRunning && results.length > 0 && (
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
                    <td style={{ padding: '8px' }}>{wins as number}</td>
                    <td style={{ padding: '8px' }}>{(((wins as number) / results.length) * 100).toFixed(1)}%</td>
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
}

function GeneticListView({ gameType, onStartGeneticSim, onListGeneticSims, onNavigateToSim }: any) {
  const [popSize, setPopSize] = useState(100);
  const [gamesPerGen, setGamesPerGen] = useState(1000);
  const [simList, setSimList] = useState<any[]>([]);

  useEffect(() => {
    if (onListGeneticSims) {
      return onListGeneticSims(gameType, (sims: any) => {
        setSimList(sims);
      });
    }
  }, [onListGeneticSims, gameType]);

  const startGenetic = async () => {
    if (onStartGeneticSim && onNavigateToSim) {
      try {
        const id = await onStartGeneticSim({ popSize, gamesPerGen, gameType });
        onNavigateToSim(id);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', maxWidth: '800px', marginBottom: '30px' }}>
        <h3>Start New Evolution</h3>
        <div style={{ display: 'flex', gap: '20px', marginTop: '15px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'gray', marginBottom: '5px' }}>Population Size</label>
            <input type="number" value={popSize} onChange={e => setPopSize(parseInt(e.target.value))} style={{ background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid gray', padding: '8px', borderRadius: '4px', width: '120px' }} />
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

      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', maxWidth: '1000px' }}>
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
                <th style={{ padding: '10px' }}>Config</th>
                <th style={{ padding: '10px' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {simList.map(s => (
                <tr key={s.id} onClick={() => onNavigateToSim && onNavigateToSim(s.id)} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                  <td style={{ padding: '10px', color: '#3b82f6', textDecoration: 'underline' }}>{s.id.substring(0, 8)}...</td>
                  <td style={{ padding: '10px', color: s.status === 'running' ? '#4ade80' : s.status === 'paused' ? '#eab308' : 'gray' }}>{s.status.toUpperCase()}</td>
                  <td style={{ padding: '10px' }}>{s.currentGeneration}</td>
                  <td style={{ padding: '10px', fontSize: '12px', color: 'gray' }}>
                    Pop: {s.config?.popSize} | Games/Gen: {s.config?.gamesPerGen}
                  </td>
                  <td style={{ padding: '10px', fontSize: '12px', color: 'gray' }}>
                    {s.createdAt?.toDate ? s.createdAt.toDate().toLocaleString() : 'Just now'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function GeneticDetailView({ simId, onListenGeneticSim, onStopGeneticSim, onResumeGeneticSim, onDeleteGeneticSim, onNavigateToSim }: any) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!simId || !onListenGeneticSim) return;
    return onListenGeneticSim(simId, (newData: any) => {
      setData(newData);
    });
  }, [simId, onListenGeneticSim]);

  if (!data) return <div style={{ color: 'white' }}>Loading simulation...</div>;

  const isRunning = data.status === 'running';
  const isPaused = data.status === 'paused';
  const historyDocs = data.history || [];
  const bestBotDna = historyDocs.length > 0 ? historyDocs[historyDocs.length - 1].bestDna : null;

  return (
    <div style={{ marginTop: '20px', maxWidth: '1000px' }}>
      <button onClick={() => onNavigateToSim && onNavigateToSim('')} style={{ marginBottom: '20px', background: 'transparent', color: '#3b82f6', border: '1px solid #3b82f6', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
        &larr; Back to List
      </button>

      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 10px 0' }}>Simulation: {simId}</h2>
            <div style={{ display: 'flex', gap: '20px', color: 'gray', fontSize: '14px' }}>
              <span>Status: <span style={{ color: isRunning ? '#4ade80' : isPaused ? '#eab308' : 'gray' }}>{data.status.toUpperCase()}</span></span>
              <span>Population: {data.config?.popSize}</span>
              <span>Games/Gen: {data.config?.gamesPerGen}</span>
              <span>Created: {data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : 'Just now'}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            {isRunning && (
              <button onClick={() => onStopGeneticSim && onStopGeneticSim(simId)} style={{ background: '#eab308', color: 'black', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                Pause
              </button>
            )}
            {isPaused && (
              <button onClick={() => onResumeGeneticSim && onResumeGeneticSim(simId)} style={{ background: '#4ade80', color: 'black', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                Resume
              </button>
            )}
            <button onClick={() => onDeleteGeneticSim && onDeleteGeneticSim(simId).then(() => onNavigateToSim(''))} style={{ background: '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
              Delete
            </button>
          </div>
        </div>

        {isRunning && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#4ade80' }}>Computing Generation {data.currentGeneration}...</span>
              <span>{data.gamesCompleted} / {data.config?.gamesPerGen}</span>
            </div>
            <div style={{ width: '100%', height: '10px', background: 'rgba(0,0,0,0.4)', borderRadius: '5px', overflow: 'hidden', marginTop: '10px' }}>
              <div style={{ width: `${(data.gamesCompleted / (data.config?.gamesPerGen || 1)) * 100}%`, height: '100%', background: '#a855f7', transition: 'width 0.1s' }} />
            </div>
          </div>
        )}
      </div>

      {historyDocs.length > 0 && (
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ color: '#4ade80', margin: '0 0 15px 0' }}>🏆 Best Bot DNA (Current Gen: {data.currentGeneration - 1})</h3>
          
          <h4 style={{ margin: '0 0 10px 0' }}>Evolutionary Progress</h4>
          {renderEvolutionTable(historyDocs)}
          
          <p style={{ color: 'gray', fontSize: '13px', margin: '0 0 10px 0' }}>
            This is a map of exactly what this bot targets in all 18 possible game states.
          </p>
          <div style={{ maxHeight: '400px', overflowY: 'auto', background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '8px' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid gray' }}>
                  <th style={{ padding: '8px' }}>Location</th>
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
  );
}

export const SimulationDashboard: React.FC<SimulationDashboardProps> = (props) => {
  const { gameName, viewType } = props;

  return (
    <div style={{ padding: '40px', color: 'white', backgroundColor: '#1a1a2e', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: '10px' }}>{gameName} Bot Simulation</h1>
      
      {viewType === 'head-to-head' && <HeadToHeadView {...props} />}
      {viewType === 'genetic-list' && <GeneticListView {...props} />}
      {viewType === 'genetic-detail' && <GeneticDetailView {...props} />}
    </div>
  );
};
