import "./mock-css.js";
import { initialSplendorState, splendorReducer } from '../src/reducer';
import { HeuristicBot } from '../src/bots/HeuristicBot';
import { RandomBot } from '../src/bots/RandomBot';

const heuristicBot = new HeuristicBot();
const randomBot = new RandomBot();

function simulateGame(bot1: 'heuristic' | 'random', bot2: 'heuristic' | 'random'): { winner: 1 | 2, turns: number, p1Score: number, p2Score: number } {
  let state = { ...initialSplendorState };
  
  state.playerOrder = ['p1', 'p2'];
  state.players = {
    'p1': { id: 'p1', name: 'Bot 1', isBot: true } as any,
    'p2': { id: 'p2', name: 'Bot 2', isBot: true } as any,
  };
  
  state = splendorReducer(state, { type: 'START_GAME' } as any);
  
  let turns = 0;
  while (state.status === 'Playing' && turns < 500) {
    turns++;
    const currentPlayerId = state.playerOrder[state.currentPlayerIndex];
    const bot = currentPlayerId === 'p1' ? 
        (bot1 === 'heuristic' ? heuristicBot : randomBot) : 
        (bot2 === 'heuristic' ? heuristicBot : randomBot);
    
    const action = bot.takeTurn(state, currentPlayerId);
    if (!action) break;
    state = splendorReducer(state, action);
    state = { ...state, actionQueue: [] };
  }

  const p1Score = state.players['p1'].score;
  const p2Score = state.players['p2'].score;
  if (state.winnerId === 'p1') return { winner: 1, turns, p1Score, p2Score };
  if (state.winnerId === 'p2') return { winner: 2, turns, p1Score, p2Score };
  if (p1Score > p2Score) return { winner: 1, turns, p1Score, p2Score };
  return { winner: 2, turns, p1Score, p2Score };
}

console.log("Simulating 100 games: Heuristic (P1) vs Random (P2)");
let heuristicWins = 0;
let randomWins = 0;
let totalTurns = 0;

for (let i = 0; i < 100; i++) {
  const result = simulateGame('heuristic', 'random');
  if (result.winner === 1) heuristicWins++;
  else randomWins++;
  totalTurns += result.turns;
}

console.log(`Heuristic (P1) Win%: ${heuristicWins}%`);
console.log(`Random (P2) Win%: ${randomWins}%`);
console.log(`Average Turns: ${(totalTurns / 100).toFixed(1)}`);

console.log("\nSimulating 100 games: Random (P1) vs Heuristic (P2)");
heuristicWins = 0;
randomWins = 0;
totalTurns = 0;

for (let i = 0; i < 100; i++) {
  const result = simulateGame('random', 'heuristic');
  if (result.winner === 2) heuristicWins++;
  else randomWins++;
  totalTurns += result.turns;
}

console.log(`Heuristic (P2) Win%: ${heuristicWins}%`);
console.log(`Random (P1) Win%: ${randomWins}%`);
console.log(`Average Turns: ${(totalTurns / 100).toFixed(1)}`);
