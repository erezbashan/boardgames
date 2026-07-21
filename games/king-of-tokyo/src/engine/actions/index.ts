import { KotState, PendingAction } from '../types';

import { handleStartGame } from './START_GAME';
import { handleStartTurn } from './START_TURN';
import { handleEndTurn } from './END_TURN';
import { handleVP } from './VP';
import { handleEnergy } from './ENERGY';
import { handleHealth } from './HEALTH';
import { handleSetupDice } from './SETUP_DICE';
import { handleResponseRoll } from './RESPONSE_ROLL';
import { handleResolveRolls } from './RESOLVE_ROLLS';
import { handleTakeDamage } from './TAKE_DAMAGE';
import { handleDead } from './DEAD';
import { handleAttack } from './ATTACK';
import { handleResponseYield } from './RESPONSE_YIELD';
import { handleEnterTokyo } from './ENTER_TOKYO';
import { handleGoToMarket } from './GO_TO_MARKET';
import { handleSetupCardPrices } from './SETUP_CARD_PRICES';
import { handleBuyOrSweep } from './BUY_OR_SWEEP';
import { handleResponseMarket } from './RESPONSE_MARKET';
import { handleSweep } from './SWEEP';
import { handleBuy } from './BUY';
import { handleDiscard } from './DISCARD';

export type ActionHandler = (st: KotState, action: PendingAction, pId: string) => void;

export const ACTION_HANDLERS: Record<string, ActionHandler> = {
  START_GAME: handleStartGame,
  START_TURN: handleStartTurn,
  END_TURN: handleEndTurn,
  VP: handleVP,
  ENERGY: handleEnergy,
  HEALTH: handleHealth,
  SETUP_DICE: handleSetupDice,
  RESPONSE_ROLL: handleResponseRoll,
  RESOLVE_ROLLS: handleResolveRolls,
  TAKE_DAMAGE: handleTakeDamage,
  DEAD: handleDead,
  ATTACK: handleAttack,
  RESPONSE_YIELD: handleResponseYield,
  ENTER_TOKYO: handleEnterTokyo,
  GO_TO_MARKET: handleGoToMarket,
  SETUP_CARD_PRICES: handleSetupCardPrices,
  BUY_OR_SWEEP: handleBuyOrSweep,
  RESPONSE_MARKET: handleResponseMarket,
  SWEEP: handleSweep,
  BUY: handleBuy,
  DISCARD: handleDiscard,
};
