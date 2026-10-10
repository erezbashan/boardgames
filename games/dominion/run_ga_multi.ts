import { dominionReducer as reducer } from './src/engine/reducer';
import { DominionState } from './src/engine/types';
import { Cards } from './src/engine/cards';
import { getRandomBotAction } from './src/bot/randomBot';
import fs from 'fs';

const ALL_CARDS = Object.keys(Cards);
const BASE_CARDS = ['copper', 'silver', 'gold', 'estate', 'duchy', 'province', 'curse'];
const ACTION_CARDS = ALL_CARDS.filter(c => !BASE_CARDS.includes(c));

interface BotGenome {
   cardWeights: Record<string, number>;
   linear: { provInt: number; provSlp: number; duchyInt: number; duchySlp: number; estInt: number; estSlp: number; goldInt: number; goldSlp: number; silvInt: number; silvSlp: number; };
}

function createInitialState(candidate: BotGenome, baseline: BotGenome, playerCount: number, candidateSeat: number): DominionState {
    const players: Record<string, any> = {};
    const playerOrder: string[] = [];
    
    for (let i = 0; i < playerCount; i++) {
        const id = `bot${i}`;
        players[id] = { id, name: `Bot ${i}`, hand: [], deck: [], discard: [], playArea: [], actions: 1, buys: 1, coins: 0, victoryPoints: 0, isBot: true };
        playerOrder.push(id);
    }
    
    const botParams: Record<string, any> = {};
    for (let i = 0; i < playerCount; i++) {
        const id = `bot${i}`;
        botParams[id] = { strategy: 'GA_V3', ...(i === candidateSeat ? candidate : baseline) };
    }
    
    return reducer({
        status: 'Lobby', winnerId: null, chatMessages: [], history: [],
        players, playerOrder, currentPlayerIndex: 0, supply: {}, trash: [], logs: [], pendingActions: [], phase: 'ACTION',
        settings: { botParams }, actionQueue: []
    }, { type: 'START_GAME' } as any);
}

function runGame(candidate: BotGenome, baseline: BotGenome, playerCount: number, candidateSeat: number): number {
  let state = createInitialState(candidate, baseline, playerCount, candidateSeat);
  let iterations = 0;
  while (state.status !== 'Finished' && iterations < 5000) {
    iterations++;
    if (state.actionQueue && state.actionQueue.length > 0) {
      state = reducer(state, state.actionQueue[0].action as any);
      state.actionQueue = state.actionQueue.slice(1);
      continue;
    }
    const isInputPhase = state.pendingActions.length > 0 && state.pendingActions[0].type === 'REQUEST_INPUT';
    const curPlayer = isInputPhase ? (state.pendingActions[0] as any).playerId : state.playerOrder[state.currentPlayerIndex];
    const botAction = getRandomBotAction(state, curPlayer);
    if (botAction) state = reducer(state, botAction as any);
    else state = reducer(state, { type: 'END_PHASE', playerId: curPlayer } as any);
  }
  
  if (!state.winnerId) return 0; // fallback if game looped forever
  
  const candidateId = `bot${candidateSeat}`;
  if (state.winnerId === 'tie') {
      // Need to find if candidate was among the tied players.
      // We don't have a strict tie-breaker array in the state natively exposed easily, 
      // but in randomBot/reducer, ties usually just declare winnerId = 'tie'.
      // We'll award a fractional win if the candidate tied.
      return 1.0 / playerCount; 
  }
  
  return state.winnerId === candidateId ? 1 : 0;
}

function playMatch(candidate: BotGenome, baseline: BotGenome, playerCount: number, matchesPerSeat: number): number {
   let candidateWins = 0;
   for (let seat = 0; seat < playerCount; seat++) {
       for (let i = 0; i < matchesPerSeat; i++) {
           candidateWins += runGame(candidate, baseline, playerCount, seat);
       }
   }
   return candidateWins;
}

function mutate(g: BotGenome): BotGenome {
   const newW = { ...g.cardWeights };
   const newL = { ...g.linear };
   
   const numMutations = 1 + Math.floor(Math.random() * 3);
   for (let i=0; i<numMutations; i++) {
      const card = ACTION_CARDS[Math.floor(Math.random() * ACTION_CARDS.length)];
      newW[card] = (newW[card] || 0) + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 2) + 1);
   }
   if (Math.random() > 0.5) {
       const keys = Object.keys(newL) as (keyof typeof newL)[];
       const key = keys[Math.floor(Math.random() * keys.length)];
       newL[key] += (Math.random() > 0.5 ? 2 : -2) * (Math.floor(Math.random() * 5) + 1);
   }
   return { cardWeights: newW, linear: newL };
}

async function evolveForPlayerCount(playerCount: number) {
   const POPULATION_SIZE = 15;
   const GENERATIONS = 30;
   const MATCHES_PER_SEAT = 30; // for 4 players, 120 games per bot
   
   console.log(`\n\n=== STARTING EVOLUTION FOR ${playerCount} PLAYERS ===`);
   
   // Seed with the 2-player optimal
   const seed: BotGenome = {
       cardWeights: {"sentry":5,"witch":4,"vassal":4,"cellar":3,"chapel":3,"library":3,"council_room":2,"moat":2,"throne_room":2,"poacher":2,"village":1,"merchant":1,"workshop":0,"festival":0,"gardens":-1,"remodel":-1,"mine":-1,"bureaucrat":-3,"market":-2,"laboratory":0,"harbinger":-3,"militia":-3,"moneylender":-3,"artisan":-5,"bandit":-5,"smithy":-5},
       linear: {"provInt":19,"provSlp":78,"duchyInt":9,"duchySlp":21,"estInt":-2,"estSlp":7,"goldInt":19,"goldSlp":10,"silvInt":8,"silvSlp":-7}
   };
   
   let population = [seed];
   for(let i=1; i<POPULATION_SIZE; i++) population.push(mutate(seed));
   
   let bestOverallScore = 0;
   let bestOverallGenome: BotGenome = seed;
   let stalledGens = 0;
   
   const maxPossibleScore = MATCHES_PER_SEAT * playerCount;
   
   for (let gen = 1; gen <= GENERATIONS; gen++) {
      const baseline = bestOverallGenome;
      const scores = population.map(p => ({ genome: p, score: 0 }));
      
      for (let i=0; i<POPULATION_SIZE; i++) {
         scores[i].score = playMatch(population[i], baseline, playerCount, MATCHES_PER_SEAT);
      }
      
      scores.sort((a, b) => b.score - a.score);
      const topScore = scores[0].score;
      console.log(`Gen ${gen}: Top bot won ${topScore.toFixed(1)} / ${maxPossibleScore} against baseline.`);
      
      // Since it plays against baseline (bestOverallGenome), a score > (maxPossibleScore / playerCount) 
      // means it wins more than its fair share against the baseline copies!
      const fairShare = maxPossibleScore / playerCount; 
      
      if (topScore > fairShare && topScore > bestOverallScore) {
          bestOverallScore = topScore;
          bestOverallGenome = scores[0].genome;
          stalledGens = 0;
          console.log(`-> New Champion!`);
      } else {
          stalledGens++;
      }
      
      if (stalledGens >= 10) {
          console.log(`Stopping early: No improvement in 10 generations.`);
          break;
      }
      
      const top3 = scores.slice(0, 3).map(s => s.genome);
      population = [...top3, bestOverallGenome];
      while (population.length < POPULATION_SIZE) {
         const parent = top3[Math.floor(Math.random() * top3.length)];
         population.push(mutate(parent));
      }
   }
   
   console.log(`FINAL CHAMPION FOR ${playerCount} PLAYERS:`);
   console.log(JSON.stringify(bestOverallGenome));
   return bestOverallGenome;
}

async function runAll() {
    const results: Record<string, BotGenome> = {};
    for (let pc = 3; pc <= 6; pc++) {
        results[pc] = await evolveForPlayerCount(pc);
    }
    fs.writeFileSync('../../results/multiplayer_ga.json', JSON.stringify(results, null, 2));
    console.log("All simulations complete. Results saved to results/multiplayer_ga.json");
}

runAll();
