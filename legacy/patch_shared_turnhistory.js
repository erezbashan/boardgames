const fs = require('fs');

let shared = fs.readFileSync('shared/src/index.ts', 'utf8');

shared = shared.replace(
  `export interface TurnHistory {
  turnNumber: number;
  playerId: string;
  vp: number;
  health: number;
  energy: number;
}`,
  `export interface TurnHistory {
  turnNumber: number;
  playerId: string;
  vp: number;
  health: number;
  energy: number;
  inTokyo?: boolean;
}`
);

fs.writeFileSync('shared/src/index.ts', shared, 'utf8');
