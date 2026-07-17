import { GameState } from '../index';

export interface GameEventContext {
  gameState: GameState;
  playerId: string; // The player who owns or is buying the card
  log: (msg: string) => void;
  highlight: (playerId: string, stat: string, dir?: 'up' | 'down') => void;
}

export interface PromptRequest {
  id: string; // A unique ID so the card knows what the prompt is about
  question: string;
  options: { label: string, value: string, buttonClass?: string }[]; // e.g. "Yes", "No", primary/warning
}

export interface CardBehavior {
  id: string;
  onDetermineRolls?: (context: GameEventContext, rollsLeft: number) => number;
  onDetermineDiceCount?: (context: GameEventContext, diceCount: number) => number;
  onDetermineAttackTargets?: (context: GameEventContext, currentTargets: string[]) => string[];
  onBeforeBuyCard?: (context: GameEventContext, cost: number) => number;
  onBuy?: (context: GameEventContext) => void;
  onTurnStart?: (context: GameEventContext) => void;
  onTurnEnd?: (context: GameEventContext) => void;
  onAttackOut?: (context: GameEventContext, baseDmg: number) => number; 
  onBeforeDamageTaken?: (context: GameEventContext, damage: number, sourceId: string) => number;
  onDamageTaken?: (context: GameEventContext, damage: number, sourceId: string) => void;
  onDamageDealt?: (context: GameEventContext, damage: number, targetId: string) => void;
  onYieldTokyo?: (context: GameEventContext) => void;
  onBuyCard?: (context: GameEventContext, cost: number) => void;
  onEnterTokyo?: (context: GameEventContext) => void;
  onAttackTargeted?: (context: GameEventContext, targetId: string, damage: number) => number;
  onBeforeHeal?: (context: GameEventContext, heal: number) => number;
  onBeforeGainEnergy?: (context: GameEventContext, energy: number) => number;
  onBeforeScoreVP?: (context: GameEventContext, vp: number) => number;
  onAttackResolved?: (context: GameEventContext, hitSomeone: boolean) => void;
  
  // Prompt Hooks
  onBeforeResolve?: (context: GameEventContext) => PromptRequest | void;
  onPromptAnswer?: (context: GameEventContext, promptId: string, answerValue: string) => PromptRequest | void;
}
