export function createInitialQTable(): number[][] {
  const table: number[][] = [];
  for (let i = 0; i < 54; i++) {
    // 31 actions
    const row = new Array(31).fill(0);
    table.push(row);
  }
  return table;
}

export function qTableToBestDna(qTable: number[][]): number[] {
  const dna: number[] = [];
  for (let i = 0; i < 54; i++) {
    const row = qTable[i];
    let maxQ = -Infinity;
    let bestA = 0;
    for (let a = 0; a < row.length; a++) {
      if (row[a] > maxQ) {
        maxQ = row[a];
        bestA = a;
      }
    }
    dna.push(bestA + 1); // 1-indexed (1 to 31)
  }
  return dna;
}
