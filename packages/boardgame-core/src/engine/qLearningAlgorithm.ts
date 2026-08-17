export const GlobalQTableCache = new Map<string, { qTable: number[][][], epsilon: number }>();

export function createInitialQTable(): number[][][] {
  const table: number[][][] = [];
  for (let i = 0; i < 54; i++) {
    // 5 independent genes, each with 2 choices (False, True) initialized to 0
    const genes = [
      [0, 0], // Attack
      [0, 0], // Health
      [0, 0], // Energy
      [0, 0], // Points
      [0, 0]  // Stay in Tokyo
    ];
    table.push(genes);
  }
  return table;
}

export function qTableToBestDna(qTable: number[][][]): number[] {
  const dna: number[] = [];
  for (let i = 0; i < 54; i++) {
    const row = qTable[i];
    let mask = 0;
    if (row[0][1] > row[0][0]) mask |= 1; // Attack
    if (row[1][1] > row[1][0]) mask |= 2; // Health
    if (row[2][1] > row[2][0]) mask |= 4; // Energy
    if (row[3][1] > row[3][0]) mask |= 8; // Points
    if (row[4][1] > row[4][0]) mask |= 16; // Stay
    
    // Fallback to random default (e.g. 15) if mask is 0, to prevent breaking
    // wait, mask = 0 is a valid action (do nothing), so we can just return it. 
    // The bitmask is 1-indexed in the original bot? No, the bitmask is actually literal bits (1,2,4,8,16).
    // In the bot, we check (mask & 1), (mask & 2), etc.
    // The Q-learning UI expects dna values to map to strategy masks.
    dna.push(mask);
  }
  return dna;
}
