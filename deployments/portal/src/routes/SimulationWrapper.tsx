import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase';
import { flipsReducer, initialFlipsState } from '@erez/flips';
import { kingOfTokyoReducer, initialKotState } from '@erez/king-of-tokyo';
import { SimulationDashboard } from '@erez/boardgame-core';

export function SimulationWrapper() {
  const { gameType, simId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const handleStartGeneticSim = async (config: any) => {
    const isQLearning = location.pathname.includes('/qlearning');
    const funcName = isQLearning ? 'startQLearningEvolution' : 'startGeneticEvolution';
    const startSim = httpsCallable(functions, funcName);
    const result = await startSim({ ...config, gameType });
    return (result.data as any).simId;
  };

  const handleListenGeneticSim = (simId: string, cb: (data: any) => void) => {
    import('firebase/firestore').then(({ doc, onSnapshot }) => {
      const unsubscribe = onSnapshot(doc(db, 'genetic_simulations', simId), (snapshot) => {
        cb(snapshot.data());
      });
      return unsubscribe;
    });
    return () => {};
  };

  const handleListGeneticSims = (gt: string, cb: (sims: any[]) => void) => {
    import('firebase/firestore').then(({ collection, query, where, onSnapshot, orderBy }) => {
      const isQLearning = location.pathname.includes('/qlearning');
      
      let q = query(collection(db, 'genetic_simulations'), where('gameType', '==', gt), orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        let sims = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (isQLearning) sims = sims.filter((s: any) => s.method === 'q-learning');
        else sims = sims.filter((s: any) => s.method !== 'q-learning');
        cb(sims);
      });
      return unsubscribe;
    });
    return () => {};
  };

  const handleStopGeneticSim = async (id: string) => {
    const { doc, updateDoc } = await import('firebase/firestore');
    await updateDoc(doc(db, 'genetic_simulations', id), { status: 'paused' });
  };

  const handleResumeGeneticSim = async (id: string) => {
    const { doc, updateDoc } = await import('firebase/firestore');
    await updateDoc(doc(db, 'genetic_simulations', id), { status: 'running' });
  };

  const handleDeleteGeneticSim = async (id: string) => {
    const { doc, deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'genetic_simulations', id));
  };

  const handleNavigateToSim = (id: string) => {
    const isQLearning = location.pathname.includes('/qlearning');
    const pathBase = isQLearning ? '/simulation/qlearning' : '/simulation/genetic';
    if (id) {
      navigate(`${pathBase}/${gameType}/${id}`);
    } else {
      navigate(`${pathBase}/${gameType}`);
    }
  };

  let viewType: 'head-to-head' | 'genetic-list' | 'genetic-detail' | 'tournament-list' | 'tournament-detail' = 'head-to-head';
  if (location.pathname.includes('/genetic') || location.pathname.includes('/qlearning')) {
    viewType = simId ? 'genetic-detail' : 'genetic-list';
  } else if (location.pathname.includes('/tournament')) {
    viewType = simId ? 'tournament-detail' : 'tournament-list';
  }

  const commonProps = {
    simId,
    viewType,
    onStartGeneticSim: handleStartGeneticSim,
    onListenGeneticSim: handleListenGeneticSim,
    onListGeneticSims: handleListGeneticSims,
    onStopGeneticSim: handleStopGeneticSim,
    onNavigateToSim: handleNavigateToSim,
    onResumeGeneticSim: handleResumeGeneticSim,
    onDeleteGeneticSim: handleDeleteGeneticSim,
    
    // Quick tournament specific overrides
    onStartTournament: async (config: any) => {
      const startSim = httpsCallable(functions, 'startTournament');
      
      let bots: any[] = [];
      if (gameType === 'king-of-tokyo') {
        const vpOptions = [0, 5, 10, 15, 20];
        const enOptions = [0, 5, 10, 15, 20];
        const hlOptions = [0, 2, 4, 6, 8, 10];
        const ydOptions = [0, 2, 4, 6, 8, 10];
        const atOptions = [1, 2, 3];

        for (const vp of vpOptions) {
          for (const en of enOptions) {
            for (const hl of hlOptions) {
              for (const at of atOptions) {
                for (const yd of ydOptions) {
                  const botConfig = { vp, en, hl, at, yd };
                  const id = `rule:${JSON.stringify(botConfig)}`;
                  bots.push({
                    id,
                    config: botConfig
                  });
                }
              }
            }
          }
        }
      } else {
        bots = [];
      }

      const result = await startSim({ gameType, bots, gamesPerPhase: config.gamesPerPhase || 100 });
      return (result.data as any).simId;
    },
    onListTournamentSims: (gt: string, cb: (sims: any[]) => void) => {
      import('firebase/firestore').then(({ collection, query, where, onSnapshot, orderBy }) => {
        let q = query(collection(db, 'tournament_simulations'), where('gameType', '==', gt), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          let sims = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          cb(sims);
        });
        return unsubscribe;
      });
      return () => {};
    },
    onListenTournamentSim: (id: string, cb: (data: any) => void) => {
      import('firebase/firestore').then(({ doc, onSnapshot }) => {
        const unsubscribe = onSnapshot(doc(db, 'tournament_simulations', id), (snapshot) => {
          cb(snapshot.data());
        });
        return unsubscribe;
      });
      return () => {};
    },
    onNavigateToTournament: (id: string) => {
      if (id) navigate(`/simulation/tournament/${gameType}/${id}`);
      else navigate(`/simulation/tournament/${gameType}`);
    },
    onStopTournament: async (id: string) => {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'tournament_simulations', id), { status: 'paused' });
    },
    onResumeTournament: async (id: string) => {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'tournament_simulations', id), { status: 'running' });
    },
    onDeleteTournament: async (id: string) => {
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'tournament_simulations', id));
    }
  };

  if (gameType === 'flips') {
    return <SimulationDashboard gameName="Flips" gameType="flips" reducer={flipsReducer as any} initialState={initialFlipsState} {...commonProps} />;
  }
  
  if (gameType === 'king-of-tokyo') {
    return <SimulationDashboard gameName="King of Tokyo" gameType="king-of-tokyo" reducer={kingOfTokyoReducer as any} initialState={initialKotState} {...commonProps} />;
  }

  return <div style={{ color: 'white', padding: '40px' }}>Unknown game type for simulation</div>;
}
