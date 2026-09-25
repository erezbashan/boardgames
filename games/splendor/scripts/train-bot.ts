import fs from 'fs';
import path from 'path';
import { SplendorGameState, SplendorPlayer, SplendorAction } from '../src/types';
import { initialSplendorState, splendorReducer } from '../src/reducer';
import { HeuristicBot, BotWeights, defaultWeights } from '../src/bots/HeuristicBot';

// A simple genetic algorithm to tune bot weights offline

const GENERATIONS = 50;
const POPULATION_SIZE = 20; // 20 bots
const GAMES_PER_EVAL = 5; // How many games a bot plays per generation to evaluate its fitness

// Generate a random bot weight set
function randomWeights(): BotWeights {
  return {
    pointValue: Math.random() * 20,
    bonusValue: Math.random() * 15,
    nobleSynergy: Math.random() * 10,
    goldValue: Math.random() * 10,
    tokenValue: Math.random() * 5,
    costPenalty: Math.random() * 5,
    distanceDiscount: 0.3 + (Math.random() * 0.6), // 0.3 to 0.9
    denialValue: Math.random() * 5
  };
}

// Mutate a bot slightly
function mutate(weights: BotWeights): BotWeights {
  const mut = () => 1 + ((Math.random() - 0.5) * 0.2); // +/- 10%
  return {
    pointValue: Math.max(0, weights.pointValue * mut()),
    bonusValue: Math.max(0, weights.bonusValue * mut()),
    nobleSynergy: Math.max(0, weights.nobleSynergy * mut()),
    goldValue: Math.max(0, weights.goldValue * mut()),
    tokenValue: Math.max(0, weights.tokenValue * mut()),
    costPenalty: Math.max(0, weights.costPenalty * mut()),
    distanceDiscount: Math.max(0.1, Math.min(0.95, weights.distanceDiscount * mut())),
    denialValue: Math.max(0, weights.denialValue * mut())
  };
}

// Run a completely headless game between two bots
function simulateGame(weights1: BotWeights, weights2: BotWeights): { winner: 1 | 2, turns: number } {
  let state = { ...initialSplendorState };
  
  // Setup players
  state.playerOrder = ['p1', 'p2'];
  state.players = {
    'p1': { id: 'p1', name: 'Bot 1', isBot: true } as any,
    'p2': { id: 'p2', name: 'Bot 2', isBot: true } as any,
  };
  
  state = splendorReducer(state, { type: 'START_GAME' } as any);
  
  let turns = 0;
  while (state.status === 'Playing' && turns < 500) { // hard limit to prevent infinite loops
    turns++;
    const currentPlayerId = state.playerOrder[state.currentPlayerIndex];
    const w = currentPlayerId === 'p1' ? weights1 : weights2;
    const bot = new HeuristicBot(w);
    
    // Instead of using the reducer's built-in PLAY_BOT queue, we force the bot action
    const action = bot.takeTurn(state, currentPlayerId);
    if (!action) {
       // Bot is stuck, break
       break;
    }
    state = splendorReducer(state, action);
    
    // Clear action queue if any, because we are driving it synchronously
    state = { ...state, actionQueue: [] };
  }

  if (state.winnerId === 'p1') return { winner: 1, turns };
  if (state.winnerId === 'p2') return { winner: 2, turns };
  
  // Draw or stuck
  if (state.players['p1'].score > state.players['p2'].score) return { winner: 1, turns };
  return { winner: 2, turns };
}

async function runGA() {
  console.log("Starting Genetic Algorithm for Splendor Bot...");
  
  let population = Array.from({ length: POPULATION_SIZE }, randomWeights);
  
  // Include our default weights to see if they survive!
  population[0] = defaultWeights;

  for (let gen = 1; gen <= GENERATIONS; gen++) {
    const scores = new Array(POPULATION_SIZE).fill(0);
    
    // Every bot plays against random opponents
    for (let i = 0; i < POPULATION_SIZE; i++) {
      for (let g = 0; g < GAMES_PER_EVAL; g++) {
        let opponent = Math.floor(Math.random() * POPULATION_SIZE);
        while (opponent === i) opponent = Math.floor(Math.random() * POPULATION_SIZE);
        
        // Bot i vs Bot opponent
        const result = simulateGame(population[i], population[opponent]);
        if (result.winner === 1) scores[i]++;
        else scores[opponent]++;
      }
    }
    
    // Sort population by score
    const scoredPopulation = population.map((weights, i) => ({ weights, score: scores[i] }))
      .sort((a, b) => b.score - a.score);
      
    console.log(`Generation ${gen}: Best Score = ${scoredPopulation[0].score}`);
    
    // Keep top 20%
    const survivors = scoredPopulation.slice(0, Math.max(2, Math.floor(POPULATION_SIZE * 0.2))).map(x => x.weights);
    
    // Generate new population
    const newPopulation: BotWeights[] = [...survivors];
    while (newPopulation.length < POPULATION_SIZE) {
      // Pick random survivor to mutate
      const parent = survivors[Math.floor(Math.random() * survivors.length)];
      newPopulation.push(mutate(parent));
    }
    
    population = newPopulation;
  }
  
  console.log("Finished! Best Weights:");
  console.log(JSON.stringify(population[0], null, 2));
}

runGA().catch(console.error);
