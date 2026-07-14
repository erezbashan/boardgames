import { GameState, SOCKET_EVENTS } from '@king-of-tokyo/shared';

// Helper for delays
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const FLAVOR_TEXTS = [
  "Roarrrr!!",
  "Me smash Tokyo!",
  "Shiny green cubes... mine!",
  "You look tasty.",
  "Oof, that hurt.",
  "I'm feeling lucky today!"
];

export async function playBotTurn(gameId: string, games: Record<string, GameState>, broadcastState: (gameId: string) => void, resolveDiceAutomatically: any) {
  const game = games[gameId];
  if (!game || game.status !== 'Playing') return;

  const botId = game.currentTurnPlayerId;
  if (!botId) return;

  const bot = game.players[botId];
  if (!bot.isBot) return;

  const { rollDice } = require('./gameLogic');

  // Initial roll
  await delay(1500);
  const extraDice = bot.cards.reduce((sum, c) => sum + (c.effect?.extraDie || 0), 0);
  game.currentDice = rollDice(6 + extraDice);
  game.rollsLeft = 2;
  broadcastState(gameId);

  // Up to 2 rerolls
  for (let i = 0; i < 2; i++) {
    await delay(2000);
    // Random chance to stop early
    if (Math.random() > 0.7) break;

    // Randomly keep or unkeep dice
    game.currentDice.forEach(d => {
      if (!d.kept) {
        if (Math.random() > 0.5) d.kept = true;
      } else {
        if (Math.random() > 0.8) d.kept = false; // 20% chance to unlock
      }
    });
    broadcastState(gameId);

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
    broadcastState(gameId);
  }

  await delay(2000);

  if (!(game as any).botsMuted && Math.random() > 0.6) {
    const text = FLAVOR_TEXTS[Math.floor(Math.random() * FLAVOR_TEXTS.length)];
    if (!(game as any).chatMessages) (game as any).chatMessages = [];
    (game as any).chatMessages.push({ sender: bot.name, text });
  }

  // Resolve dice
  resolveDiceAutomatically(gameId, bot.id);
}

export async function playBotBuyPhase(gameId: string, games: Record<string, GameState>, broadcastState: (gameId: string) => void, endTurnAutomatically: any) {
  const game = games[gameId];
  if (!game || game.status !== 'Playing') return;

  const botId = game.currentTurnPlayerId;
  if (!botId) return;

  const bot = game.players[botId];
  if (!bot.isBot) return;

  // Try to buy affordable cards randomly
  await delay(1000);
  
  let canAfford = game.marketCards.filter(c => c.cost <= bot.energy);
  while (canAfford.length > 0 && Math.random() > 0.3) {
    // Pick a random affordable card
    const cardToBuy = canAfford[Math.floor(Math.random() * canAfford.length)];
    
    // Simulate buy (we can just emit a mock BUY_CARD logic or do it inline)
    const cardIndex = game.marketCards.findIndex(c => c.id === cardToBuy.id);
    if (cardIndex !== -1) {
      bot.energy -= cardToBuy.cost;
      if (cardToBuy.type !== 'Discard') {
        bot.cards.push(cardToBuy);
      }
      // Don't splice yet, we'll replace or splice at the end
      
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

      broadcastState(gameId);
      await delay(1500);
    }
    
    canAfford = game.marketCards.filter(c => c.cost <= bot.energy);
  }

  endTurnAutomatically(gameId, bot.id);
}
