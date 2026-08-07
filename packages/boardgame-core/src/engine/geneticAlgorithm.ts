import { runSimulationBatch, PlayerConfig, SimulationResult } from './simulateGame';
import { BaseGameState } from './types';

export type DNA = number[]; // length 54, values 1 to 31

export interface PopulationMember {
  id: string;
  dna: DNA;
  wins: number;
  gamesPlayed: number;
}

export function generateRandomDNA(): DNA {
  const dna: DNA = [];
  for (let i = 0; i < 54; i++) {
    dna.push(Math.floor(Math.random() * 31) + 1); // 1 to 31 (5 bits: Attack, Health, Energy, Points, StayTokyo)
  }
  return dna;
}

export function createInitialPopulation(size: number = 750): PopulationMember[] {
  const pop: PopulationMember[] = [];
  for (let i = 0; i < size; i++) {
    pop.push({
      id: `bot_gen0_${i}`,
      dna: generateRandomDNA(),
      wins: 0,
      gamesPlayed: 0
    });
  }
  return pop;
}

export function crossoverAndMutate(parentA: DNA, parentB: DNA, mutationRate: number = 0.05): DNA {
  const child: DNA = [];
  for (let i = 0; i < 54; i++) {
    // 50/50 from parents
    let gene = Math.random() < 0.5 ? parentA[i] : parentB[i];
    
    // Mutation
    if (Math.random() < mutationRate) {
      gene = Math.floor(Math.random() * 31) + 1;
    }
    child.push(gene);
  }
  return child;
}

export function evolvePopulation(oldPopulation: PopulationMember[], generationIndex: number): PopulationMember[] {
  // Sort by win rate (wins / gamesPlayed)
  const sorted = [...oldPopulation].sort((a, b) => {
    const rateA = a.gamesPlayed > 0 ? a.wins / a.gamesPlayed : 0;
    const rateB = b.gamesPlayed > 0 ? b.wins / b.gamesPlayed : 0;
    return rateB - rateA;
  });

  // Keep top 50%
  const survivorsCount = Math.floor(sorted.length / 2);
  const survivors = sorted.slice(0, survivorsCount);
  
  const newPop: PopulationMember[] = [];
  
  // Elitism: Keep the top 5% exactly as they are so we don't lose the best
  const eliteCount = Math.floor(sorted.length * 0.05);
  for (let i = 0; i < eliteCount; i++) {
    newPop.push({
      id: `bot_gen${generationIndex}_elite_${i}`,
      dna: [...survivors[i].dna],
      wins: 0,
      gamesPlayed: 0
    });
  }

  // Fill the rest by breeding survivors
  while (newPop.length < oldPopulation.length) {
    const parentA = survivors[Math.floor(Math.random() * survivors.length)].dna;
    const parentB = survivors[Math.floor(Math.random() * survivors.length)].dna;
    
    newPop.push({
      id: `bot_gen${generationIndex}_${newPop.length}`,
      dna: crossoverAndMutate(parentA, parentB, 0.05),
      wins: 0,
      gamesPlayed: 0
    });
  }

  return newPop;
}

export function getStrategyString(dna: DNA): string {
  return `param:${JSON.stringify(dna)}`;
}
