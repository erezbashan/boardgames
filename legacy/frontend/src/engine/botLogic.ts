import type { GameState } from '@king-of-tokyo/shared';
import { rollDice } from './gameLogic';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const FLAVOR_TEXTS = [
  "Roarrrr!!",
  "Me smash Tokyo!",
  "Shiny green cubes... mine!",
  "You look tasty.",
  "Oof, that hurt.",
  "I'm feeling lucky today!"
];

export async function playBotTurn(gameId: string, game: GameState, saveGame: (gameId: string, state: GameState) => Promise<void>, resolveDiceAutomatically: any) {
  if (!game || game.status !== 'Playing') return;

  const botId = game.currentTurnPlayerId;
  if (!botId) return;

  const bot = game.players[botId];
  if (!bot.isBot) return;

  await delay(1500);
  const extraDice = bot.cards.reduce((sum, c) => sum + (c.effect?.extraDie || 0), 0);
  const shrink = bot.shrinkTokens || 0;
  const base = game.settings?.startingDice || 6;
  game.currentDice = rollDice(Math.max(1, base + extraDice - shrink));
  game.rollsLeft = 2;
  await saveGame(gameId, game);

  for (let i = 0; i < 2; i++) {
    await delay(2000);
    if (Math.random() > 0.7) break;

    game.currentDice.forEach(d => {
      if (!d.kept) {
        if (Math.random() > 0.5) d.kept = true;
      } else {
        if (Math.random() > 0.8) d.kept = false;
      }
    });
    await saveGame(gameId, game);

    await delay(1000);
    const unkeptCount = game.currentDice.filter(d => !d.kept).length;
    if (unkeptCount === 0) break;

    const newRolls = rollDice(unkeptCount);
    let newRollsIndex = 0;
    game.currentDice = game.currentDice.map(d => {
      if (d.kept) return d;
      return newRolls[newRollsIndex++];
    });
    game.rollsLeft--;
    await saveGame(gameId, game);
  }

  await delay(2000);

  if (!(game as any).botsMuted && Math.random() > 0.6) {
    const text = FLAVOR_TEXTS[Math.floor(Math.random() * FLAVOR_TEXTS.length)];
    if (!(game as any).chatMessages) (game as any).chatMessages = [];
    (game as any).chatMessages.push({ sender: bot.name, text });
  }

  await resolveDiceAutomatically(gameId, bot.id);
}

export async function playBotBuyPhase(gameId: string, game: GameState, saveGame: (gameId: string, state: GameState) => Promise<void>, endTurnAutomatically: any) {
  if (!game || game.status !== 'Playing') return;

  const botId = game.currentTurnPlayerId;
  if (!botId) return;

  const bot = game.players[botId];
  if (!bot.isBot) return;

  await delay(1000);
  
  let canAfford = game.marketCards.filter(c => c.cost <= bot.energy);
  while (canAfford.length > 0 && Math.random() > 0.3) {
    const cardToBuy = canAfford[Math.floor(Math.random() * canAfford.length)];
    
    const cardIndex = game.marketCards.findIndex(c => c.id === cardToBuy.id);
    if (cardIndex !== -1) {
      bot.energy -= cardToBuy.cost;
      if (cardToBuy.type !== 'Discard') {
        bot.cards.push(cardToBuy);
      }
      
      if (cardToBuy.effect?.maxHealth) {
        bot.maxHealth = (bot.maxHealth || 10) + cardToBuy.effect.maxHealth;
      }
      if (cardToBuy.effect?.heal) {
        bot.health = Math.min(bot.maxHealth || 10, bot.health + cardToBuy.effect.heal);
      }
      if (cardToBuy.effect?.energy) {
        bot.energy += cardToBuy.effect.energy;
      }
      if (cardToBuy.effect?.vp) {
        bot.victoryPoints = Math.min(20, bot.victoryPoints + cardToBuy.effect.vp);
      }
      
      if (game.deck.length > 0) {
        game.marketCards[cardIndex] = game.deck.shift()!;
      } else {
        game.marketCards.splice(cardIndex, 1);
      }
      game.deckCount = game.deck.length;
      if (bot.gameStats) {
        bot.gameStats.cardsBought += 1;
        bot.gameStats.energySpent += cardToBuy.cost;
      }
      game.logs.push(`BUY_CARD:${bot.name}:${JSON.stringify(cardToBuy)}`);
      
      if (!(game as any).botsMuted && Math.random() > 0.5) {
        if (!(game as any).chatMessages) (game as any).chatMessages = [];
        (game as any).chatMessages.push({ sender: bot.name, text: `Haha! I bought ${cardToBuy.name}!` });
      }

      await saveGame(gameId, game);
      await delay(1500);
    }
    
    canAfford = game.marketCards.filter(c => c.cost <= bot.energy);
  }

  await saveGame(gameId, game);
  await endTurnAutomatically(gameId, bot.id);
}
