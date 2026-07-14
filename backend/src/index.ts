import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { GameState, SOCKET_EVENTS, PlayerId } from '@king-of-tokyo/shared';
import { createInitialGameState } from './gameLogic';
import { playBotTurn } from './botLogic';
import fs from 'fs';
import path from 'path';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

app.get('/health', (req, res) => {
  res.send('Backend is running');
});

const GAMES_FILE = path.join(__dirname, '../../games.json');

// In-memory store
let games: Record<string, GameState> = {};
if (fs.existsSync(GAMES_FILE)) {
  try {
    games = JSON.parse(fs.readFileSync(GAMES_FILE, 'utf8'));
    
    // Rescue games that were stuck mid-animation during a server restart
    Object.values(games).forEach(game => {
      game.isAnimating = false;
      game.pendingYields = [];
    });
    
    console.log(`Loaded ${Object.keys(games).length} games from disk.`);
  } catch (err) {
    console.error('Failed to load games from disk:', err);
  }
}

const socketToGame: Record<string, string> = {};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function broadcastState(gameId: string) {
  const state = games[gameId];
  if (state) {
    // If not already game over, check if it should be
    if (state.status === 'Playing') {
      const alivePlayers = Object.values(state.players).filter(p => p.health > 0);
      let winner = Object.values(state.players).find(p => p.victoryPoints >= 20);
      if (!winner && alivePlayers.length <= 1) {
        winner = alivePlayers[0];
      }
      if (winner || alivePlayers.length === 0) {
        state.status = 'GameOver';
        state.winner = winner ? winner.id : null;
        state.logs.push(winner ? `🎉 ${winner.name} wins the game!` : `💀 Everyone was defeated. The game ends in a draw!`);
        
        if (!state.history) state.history = [];
        const currentTurn = state.history.length > 0 ? state.history[state.history.length - 1].turnNumber + 1 : 0;
        Object.values(state.players).forEach(p => {
          state.history!.push({
            turnNumber: currentTurn,
            playerId: p.id,
            vp: p.victoryPoints,
            health: Math.max(0, p.health),
            energy: p.energy
          });
        });
      }
    }
    
    io.to(gameId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, state);
    fs.writeFileSync(GAMES_FILE, JSON.stringify(games), 'utf8');
  }
}

// Rescue games on boot after a delay
setTimeout(() => {
  const { playBotTurn, playBotBuyPhase } = require('./botLogic');
  Object.values(games).forEach(game => {
    const p = game.players[game.currentTurnPlayerId!];
    if (p && p.isBot) {
      if (game.rollsLeft > 0) {
        game.logs.push(`⚠️ ${p.name}'s turn was interrupted by a server reboot. Resuming roll...`);
        playBotTurn(game.id, games, broadcastState, resolveDiceAutomatically);
      } else {
        game.logs.push(`⚠️ ${p.name}'s turn was interrupted by a server reboot. Concluding turn...`);
        playBotBuyPhase(game.id, games, broadcastState, endTurnAutomatically);
      }
    }
  });
}, 2000);

async function startTurn(gameId: string, playerId: string) {
  const game = games[gameId];
  if (!game) return;
  
  const p = game.players[playerId];
  if (!p) return;

  game.currentTurnPlayerId = playerId;
  game.rollsLeft = 3;
  game.currentDice = [];
  game.pendingYields = [];
  game.logs.push(`TURN_START:${p.name}`);
  
  if (p.inTokyo) {
    p.victoryPoints = Math.min(20, p.victoryPoints + 2);
    game.logs.push(`👑 ${p.name} started their turn in Tokyo City! (+2 VP)`);
    broadcastState(gameId);
  }
  
  if (p.poisonTokens > 0) {
    const poisonDmg = Math.min(p.health, p.poisonTokens);
    p.health -= poisonDmg;
    game.logs.push(`☠️ ${p.name} took ${poisonDmg} poison damage!`);
    if (p.health <= 0) {
      game.logs.push(`💀 ${p.name} was killed!`);
    }
    game.isAnimating = true;
    game.highlightedStats = [{ playerId: p.id, stat: 'health' }];
    broadcastState(gameId);
    
    await delay(1500);
    game.isAnimating = false;
    
    if (p.health <= 0) {
      p.inTokyo = false;
      game.logs.push(`☠️ ${p.name} was eliminated by poison!`);
      endTurnAutomatically(gameId, p.id);
      return;
    }
  }

  // Always broadcast state so clients know whose turn it is
  broadcastState(gameId);

  // If human, they click roll. If bot, trigger bot logic.
  if (p.isBot && p.health > 0) {
    const { playBotTurn } = require('./botLogic');
    playBotTurn(gameId, games, broadcastState, resolveDiceAutomatically);
  }
}

function checkGameOver(gameId: string): boolean {
  const game = games[gameId];
  return game?.status === 'GameOver';
}

function endTurnAutomatically(gameId: string, socketId: string) {
  const game = games[gameId];
  if (!game) return;
  
  if (!game.history) game.history = [];
  const currentTurn = game.history.length > 0 ? game.history[game.history.length - 1].turnNumber + 1 : 0;
  Object.values(game.players).forEach(p => {
    game.history!.push({
      turnNumber: currentTurn,
      playerId: p.id,
      vp: p.victoryPoints,
      health: Math.max(0, p.health),
      energy: p.energy
    });
  });
  
  if (checkGameOver(gameId)) return;
  
  const idx = game.playerOrder.indexOf(socketId);
  
  let nextId = game.playerOrder[(idx + 1) % game.playerOrder.length];
  let tries = 0;
  while (game.players[nextId]?.health <= 0 && tries < game.playerOrder.length) {
    const nextIdx = game.playerOrder.indexOf(nextId);
    nextId = game.playerOrder[(nextIdx + 1) % game.playerOrder.length];
    tries++;
  }
  
  startTurn(gameId, nextId);
}

async function resolveDiceAutomatically(gameId: string, socketId: string) {
  const game = games[gameId];
  if (!game) return;
  game.rollsLeft = 0;
  game.isAnimating = true;
  game.currentDice.forEach(d => d.kept = false);
  broadcastState(gameId);
  await delay(400); // Give UI time to clear locks before animating

  const p = game.players[socketId];
  const faceMap: Record<string, string> = { '1': '1️⃣', '2': '2️⃣', '3': '3️⃣', 'Heart': '❤️', 'Lightning': '⚡', 'Claw': '💥' };
  const diceFaces = game.currentDice.map(d => faceMap[d.face]).join(' ');
  game.logs.push(`${p.name} resolved: ${diceFaces}`);
  
  const { evaluateDice } = require('./gameLogic');
  const results = evaluateDice(game.currentDice);

  // Helper to clear highlights
  const clearHighlights = () => {
    game.highlightedDice = [];
    game.highlightedStats = [];
  };

  // Phase 1: Points
  if (results.points > 0) {
    p.victoryPoints = Math.min(20, p.victoryPoints + results.points);
    game.logs.push(`${p.name} gained ${results.points} VP.`);
    
    // Only highlight number dice if they actually scored points (count >= 3)
    game.highlightedDice = game.currentDice.filter(d => {
      if (!['1', '2', '3'].includes(d.face)) return false;
      const count = game.currentDice.filter(d2 => d2.face === d.face).length;
      return count >= 3;
    }).map(d => d.id);
    
    game.highlightedStats = [{ playerId: p.id, stat: 'vp' }];
    broadcastState(gameId);
    await delay(1500);
  }

  // Phase 2: Energy
  if (results.energy > 0) {
    p.energy += results.energy;
    game.logs.push(`${p.name} gained ${results.energy} ⚡.`);
    game.highlightedDice = game.currentDice.filter(d => d.face === 'Lightning').map(d => d.id);
    game.highlightedStats = [{ playerId: p.id, stat: 'energy' }];
    broadcastState(gameId);
    await delay(1500);
  }
  
  // Phase 3: Heals
  if (results.heal > 0 && (!p.inTokyo || p.poisonTokens > 0)) {
    let healsRemaining = results.heal;
    if (p.poisonTokens > 0) {
      const poisonHealed = Math.min(p.poisonTokens, healsRemaining);
      p.poisonTokens -= poisonHealed;
      healsRemaining -= poisonHealed;
      if (poisonHealed > 0) {
        game.logs.push(`☠️ ${p.name} cured ${poisonHealed} poison token(s).`);
      }
    }
    
    let actualHeal = 0;
    if (healsRemaining > 0 && !p.inTokyo) {
      actualHeal = Math.min((p.maxHealth || 10) - p.health, healsRemaining);
      if (actualHeal > 0) {
        p.health += actualHeal;
        game.logs.push(`${p.name} healed ${actualHeal} ❤️.`);
      }
    }
    
    if (results.heal > healsRemaining || actualHeal > 0) {
      game.highlightedDice = game.currentDice.filter(d => d.face === 'Heart').map(d => d.id);
      game.highlightedStats = [{ playerId: p.id, stat: 'health' }];
      broadcastState(gameId);
      await delay(1500);
    }
  }
  
  // Phase 4: Attack
  const hasNovaBreath = p.cards.some(c => c.effect?.aoeAttack);
  const hasPoisonSpit = p.cards.some(c => c.effect?.poison);
  const hasFireBreathing = p.cards.some(c => c.effect?.fireBreathing);
  
  const pIndex = game.playerOrder.indexOf(p.id);
  const prevId = game.playerOrder[(pIndex - 1 + game.playerOrder.length) % game.playerOrder.length];
  const nextId = game.playerOrder[(pIndex + 1) % game.playerOrder.length];
  const neighbors = [prevId, nextId];

  if (results.attack > 0) {
    game.highlightedDice = game.currentDice.filter(d => d.face === 'Claw').map(d => d.id);
    game.highlightedStats = [];
    
    let hitSomeone = false;
    let hitTokyoPlayer = false;
    let playerInTokyo: any = null;
    const modifierLogs: string[] = [];

    Object.values(game.players).forEach(other => {
      if (other.id === p.id) return;
      if (other.health <= 0) return; // Ignore dead players
      
      const isTarget = (p.inTokyo && !other.inTokyo) || 
                       (!p.inTokyo && other.inTokyo) || 
                       hasNovaBreath;

      if (isTarget) {
        const armor = other.cards.reduce((sum: number, c: any) => sum + (c.effect?.armor || 0), 0);
        let dmg = results.attack;
        
        let extraFireDamage = 0;
        if (hasFireBreathing && neighbors.includes(other.id)) {
          dmg += 1;
          extraFireDamage = 1;
        }
        
        let actualDmg = Math.max(0, dmg - armor);
        if (actualDmg > 0) {
          other.health -= actualDmg;
          if (p.gameStats) {
            p.gameStats.damageDealt += actualDmg;
          }
          game.highlightedStats.push({ playerId: other.id, stat: 'health' });
          hitSomeone = true;
          
          if (extraFireDamage > 0) {
            modifierLogs.push(`🔥 ${other.name} took +1 extra damage from Fire Breathing!`);
          }
          if (armor > 0 && dmg > 0) {
             modifierLogs.push(`🛡️ ${other.name}'s Armor blocked ${Math.min(dmg, armor)} damage!`);
          }
          
          if (hasPoisonSpit) {
            other.poisonTokens = (other.poisonTokens || 0) + 1;
            modifierLogs.push(`☠️ ${other.name} was poisoned!`);
          }
          
          if (other.health <= 0) {
            modifierLogs.push(`💀 ${other.name} was killed!`);
          }
        } else if (armor > 0 && dmg > 0) {
           modifierLogs.push(`🛡️ ${other.name}'s Armor completely blocked the attack!`);
        }
        
        if (other.inTokyo) {
          hitTokyoPlayer = true;
          playerInTokyo = other;
        }
      }
    });

    if (hitSomeone || modifierLogs.length > 0) {
      if (hasNovaBreath) {
        game.logs.push(`🌊 ${p.name} dealt 💥 damage to ALL other players! (Nova Breath)`);
      } else {
        game.logs.push(`${p.name} dealt 💥 damage!`);
      }
      game.logs.push(...modifierLogs);
    }

    broadcastState(gameId);
    await delay(1500);

    if (!p.inTokyo && hitTokyoPlayer && playerInTokyo && playerInTokyo.health > 0) {
      if (!playerInTokyo.isBot) {
        game.pendingYields = [playerInTokyo.id];
        broadcastState(gameId);
        const yielded = await new Promise<boolean>((resolve) => {
          (game as any)._yieldResolver = resolve;
        });
        game.pendingYields = [];
        if (yielded) {
          playerInTokyo.inTokyo = false;
          game.logs.push(`${playerInTokyo.name} yielded Tokyo!`);
          hitTokyoPlayer = false; // Tokyo is empty now
        } else {
          game.logs.push(`${playerInTokyo.name} stayed in Tokyo!`);
        }
      } else {
        const yielded = Math.random() > 0.5;
        if (yielded) {
          playerInTokyo.inTokyo = false;
          game.logs.push(`${playerInTokyo.name} yielded Tokyo!`);
          hitTokyoPlayer = false;
          if (!(game as any).botsMuted) {
            if (!(game as any).chatMessages) (game as any).chatMessages = [];
            (game as any).chatMessages.push({ sender: playerInTokyo.name, text: "Ouch! Tokyo is all yours..." });
          }
        } else {
          game.logs.push(`${playerInTokyo.name} stayed in Tokyo!`);
        }
      }
    }

    // Entering Tokyo
    if (!p.inTokyo) {
      const isTokyoEmpty = !Object.values(game.players).some(pl => pl.inTokyo && pl.health > 0);
      if (isTokyoEmpty) {
        p.inTokyo = true;
        p.victoryPoints = Math.min(20, p.victoryPoints + 1);
        game.logs.push(`👑 ${p.name} entered Tokyo City! (+1 VP)`);
        game.highlightedStats.push({ playerId: p.id, stat: 'vp' });
      }
    }
    
    broadcastState(gameId);
    await delay(1500);
  }

  clearHighlights();
  broadcastState(gameId);
  await delay(1000);

  game.isAnimating = false;

  const minCost = Math.min(2, ...game.marketCards.map(c => c.cost));
  if (p.isBot) {
    const { playBotBuyPhase } = require('./botLogic');
    playBotBuyPhase(gameId, games, broadcastState, endTurnAutomatically);
  } else if (game.marketCards.length === 0 || p.energy < minCost) {
    endTurnAutomatically(gameId, socketId);
  } else {
    broadcastState(gameId);
  }
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const gameId = socketToGame[socket.id];
    if (gameId && games[gameId]) {
      // In a real app we'd handle disconnects more gracefully
    }
  });

  socket.on(SOCKET_EVENTS.CREATE_GAME, (username: string) => {
    const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    games[gameId] = createInitialGameState(gameId);
    
    // Add creator
    games[gameId].players[socket.id] = {
      id: socket.id,
      name: username || 'Player 1',
      isBot: false,
      health: 10,
      victoryPoints: 0,
      energy: 0,
      inTokyo: false,
      cards: [],
      poisonTokens: 0
    };
    games[gameId].playerOrder.push(socket.id);
    
    socket.join(gameId);
    socketToGame[socket.id] = gameId;
    broadcastState(gameId);
  });

  socket.on(SOCKET_EVENTS.JOIN_GAME, (gameId: string, username: string, previousPlayerId?: string) => {
    const game = games[gameId];
    if (!game) {
      socket.emit(SOCKET_EVENTS.ERROR, 'Game not found');
      return;
    }
    
    // Handle reconnect
    if (game.status !== 'Lobby') {
      if (previousPlayerId && game.players[previousPlayerId]) {
        const player = game.players[previousPlayerId];
        player.id = socket.id;
        game.players[socket.id] = player;
        delete game.players[previousPlayerId];
        
        const orderIdx = game.playerOrder.indexOf(previousPlayerId);
        if (orderIdx !== -1) game.playerOrder[orderIdx] = socket.id;
        
        if (game.currentTurnPlayerId === previousPlayerId) game.currentTurnPlayerId = socket.id;
        
        const yieldIdx = game.pendingYields?.indexOf(previousPlayerId);
        if (yieldIdx !== undefined && yieldIdx !== -1) game.pendingYields[yieldIdx] = socket.id;
        
        if (game.history) {
          game.history.forEach(h => {
            if (h.playerId === previousPlayerId) h.playerId = socket.id;
          });
        }
        
        socket.join(gameId);
        socketToGame[socket.id] = gameId;
        broadcastState(gameId);
        return;
      }
      
      // Fallback: If no valid previous ID, check if there's an orphaned human player with the same name
      const orphanedHuman = Object.values(game.players).find(p => !p.isBot && p.name === username && !io.sockets.sockets.has(p.id));
      if (orphanedHuman) {
        const oldId = orphanedHuman.id;
        orphanedHuman.id = socket.id;
        game.players[socket.id] = orphanedHuman;
        delete game.players[oldId];
        
        const orderIdx = game.playerOrder.indexOf(oldId);
        if (orderIdx !== -1) game.playerOrder[orderIdx] = socket.id;
        
        if (game.currentTurnPlayerId === oldId) game.currentTurnPlayerId = socket.id;
        
        const yieldIdx = game.pendingYields?.indexOf(oldId);
        if (yieldIdx !== undefined && yieldIdx !== -1) game.pendingYields[yieldIdx] = socket.id;
        
        socket.join(gameId);
        socketToGame[socket.id] = gameId;
        broadcastState(gameId);
        return;
      }

      socket.emit(SOCKET_EVENTS.ERROR, 'Game already started');
      return;
    }

    game.players[socket.id] = {
      id: socket.id,
      name: username || `Player ${Object.keys(game.players).length + 1}`,
      isBot: false,
      health: 10,
      victoryPoints: 0,
      energy: 0,
      inTokyo: false,
      cards: [],
      poisonTokens: 0
    };
    game.playerOrder.push(socket.id);
    
    socket.join(gameId);
    socketToGame[socket.id] = gameId;
    broadcastState(gameId);
  });

  socket.on(SOCKET_EVENTS.QUIT_GAME, (gameId: string) => {
    const game = games[gameId];
    if (game) {
      delete game.players[socket.id];
      game.playerOrder = game.playerOrder.filter(id => id !== socket.id);
      socket.leave(gameId);
      delete socketToGame[socket.id];
      broadcastState(gameId);
    }
  });

  socket.on(SOCKET_EVENTS.ADD_BOT, (gameId: string) => {
    const game = games[gameId];
    if (game && game.status === 'Lobby') {
      const botId = `bot_${Math.random().toString(36).substring(2, 8)}`;
      const NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Hank', 'Ivy', 'Jack', 'Karen', 'Leo', 'Mia', 'Noah', 'Olivia', 'Paul', 'Quinn', 'Rachel', 'Sam', 'Tina'];
      const existingNames = Object.values(game.players).map(p => p.name);
      const availableNames = NAMES.filter(n => !existingNames.includes(n));
      const randomName = availableNames.length > 0 ? availableNames[Math.floor(Math.random() * availableNames.length)] : `Bot ${botId}`;
      game.players[botId] = {
        id: botId,
        name: randomName,
        isBot: true,
        health: 10,
        victoryPoints: 0,
        energy: 0,
        inTokyo: false,
        cards: [],
        poisonTokens: 0
      };
      game.playerOrder.push(botId);
      broadcastState(gameId);
    }
  });

  socket.on(SOCKET_EVENTS.RETURN_TO_LOBBY, (gameId: string) => {
    const game = games[gameId];
    if (game && game.status === 'GameOver') {
      game.status = 'Lobby';
      game.winner = null;
      game.history = [];
      game.logs = ['Game returned to lobby'];
      Object.values(game.players).forEach(p => {
        p.health = 10;
        p.victoryPoints = 0;
        p.energy = 0;
        p.inTokyo = false;
        p.cards = [];
        p.poisonTokens = 0;
      });
      game.currentTurnPlayerId = null;
      broadcastState(gameId);
    }
  });

  socket.on(SOCKET_EVENTS.START_GAME, (gameId: string) => {
    const game = games[gameId];
    if (game && game.status === 'Lobby') {
      game.status = 'Playing';
      const PLAYER_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
      Object.values(game.players).forEach((p, index) => {
        p.color = PLAYER_COLORS[index % PLAYER_COLORS.length];
        p.gameStats = {
          damageDealt: 0,
          cardsBought: 0,
          energySpent: 0
        };
      });

      // Randomize player order
      for (let i = game.playerOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [game.playerOrder[i], game.playerOrder[j]] = [game.playerOrder[j], game.playerOrder[i]];
      }

      game.logs.push('Game started!');
      startTurn(gameId, game.playerOrder[0]);
    }
  });
  
  socket.on(SOCKET_EVENTS.ROLL_DICE, (gameId: string) => {
    const game = games[gameId];
    if (game && game.currentTurnPlayerId === socket.id && game.rollsLeft > 0) {
      game.rollsLeft -= 1;
      
      // Get `rollDice` from gameLogic, we need to import it if not already
      const { rollDice } = require('./gameLogic');
      if (game.currentDice.length === 0) {
        const extraDice = game.players[socket.id].cards.reduce((sum, c) => sum + (c.effect?.extraDie || 0), 0);
        game.currentDice = rollDice(6 + extraDice);
      } else {
        game.currentDice = game.currentDice.map(d => d.kept ? d : rollDice(1)[0]);
      }
      
      if (game.rollsLeft === 0) {
        resolveDiceAutomatically(gameId, socket.id);
      } else {
        broadcastState(gameId);
      }
    }
  });

  socket.on(SOCKET_EVENTS.KEEP_DICE, (gameId: string, diceIds: string[]) => {
    const game = games[gameId];
    if (game && game.currentTurnPlayerId === socket.id) {
      game.currentDice.forEach(d => {
        d.kept = diceIds.includes(d.id);
      });
      broadcastState(gameId);
    }
  });

  socket.on(SOCKET_EVENTS.RESOLVE_DICE, (gameId: string) => {
    const game = games[gameId];
    if (game && game.currentTurnPlayerId === socket.id) {
      resolveDiceAutomatically(gameId, socket.id);
    }
  });

  socket.on(SOCKET_EVENTS.YIELD_TOKYO, (gameId: string, choice: boolean) => {
    const game = games[gameId];
    if (game && (game as any)._yieldResolver && game.pendingYields.includes(socket.id)) {
      (game as any)._yieldResolver(choice);
      (game as any)._yieldResolver = null;
    }
  });

  socket.on(SOCKET_EVENTS.BUY_CARD, async (gameId: string, cardId: string) => {
    const game = games[gameId];
    if (game && game.currentTurnPlayerId === socket.id && !game.isAnimating) {
      const player = game.players[socket.id];
      const cardIndex = game.marketCards.findIndex(c => c.id === cardId);
      if (cardIndex !== -1) {
        const card = game.marketCards[cardIndex];
        if (player.energy >= card.cost) {
          player.energy -= card.cost;
          if (player.gameStats) {
            player.gameStats.energySpent += card.cost;
            player.gameStats.cardsBought += 1;
          }
          if (card.type !== 'Discard') {
            player.cards.push(card);
          }
          // Don't splice yet, we'll replace or splice at the end
          
          game.logs.push(`BUY_CARD:${player.name}:${JSON.stringify(card)}`);
          game.isAnimating = true;
          game.highlightedStats = [];
          
          if (card.effect?.maxHealth) {
            player.maxHealth = (player.maxHealth || 10) + card.effect.maxHealth;
            game.logs.push(`${player.name} max health increased by ${card.effect.maxHealth}.`);
            game.highlightedStats.push({ playerId: player.id, stat: 'health' });
          }
          if (card.effect?.heal) {
            const actualHeal = Math.min(player.maxHealth || 10, player.health + card.effect.heal) - player.health;
            player.health += actualHeal;
            if (actualHeal > 0) {
              game.logs.push(`${player.name} healed ${actualHeal} ❤️.`);
              game.highlightedStats.push({ playerId: player.id, stat: 'health' });
            }
          }
          if (card.effect?.energy) {
            player.energy += card.effect.energy;
            game.logs.push(`${player.name} gained ${card.effect.energy} ⚡.`);
            game.highlightedStats.push({ playerId: player.id, stat: 'energy' });
          }
          if (card.effect?.vp) {
            const actualVp = Math.min(20, player.victoryPoints + card.effect.vp) - player.victoryPoints;
            player.victoryPoints += actualVp;
            if (actualVp > 0) {
              game.logs.push(`${player.name} gained ${actualVp} VP.`);
              game.highlightedStats.push({ playerId: player.id, stat: 'vp' });
            }
          }
          
          if (game.deck.length > 0) {
            game.marketCards[cardIndex] = game.deck.shift()!;
          } else {
            game.marketCards.splice(cardIndex, 1);
          }
          game.deckCount = game.deck.length;
          
          broadcastState(gameId);
          await delay(1500);
          
          game.highlightedStats = [];
          game.isAnimating = false;
          
          const minCost = Math.min(2, ...game.marketCards.map(c => c.cost));
          if (game.marketCards.length === 0 || player.energy < minCost) {
            endTurnAutomatically(gameId, socket.id);
          } else {
            broadcastState(gameId);
          }
        }
      }
    }
  });

  socket.on(SOCKET_EVENTS.SWEEP_CARDS, async (gameId: string) => {
    const game = games[gameId];
    if (game && game.currentTurnPlayerId === socket.id && !game.isAnimating) {
      const player = game.players[socket.id];
      if (player.energy >= 2) {
        player.energy -= 2;
        game.logs.push(`${player.name} paid 2 ⚡ to sweep the cards.`);
        game.isAnimating = true;

        let i = 0;
        while (i < game.marketCards.length) {
          if (game.deck.length > 0) {
            game.marketCards[i] = game.deck.shift()!;
            game.deckCount = game.deck.length;
            broadcastState(gameId);
            await delay(400);
            i++;
          } else {
            game.marketCards.splice(i, 1);
            broadcastState(gameId);
            await delay(400);
          }
        }
        
        game.isAnimating = false;
        await delay(800); // Extra pause before evaluating end turn

        const minCost = Math.min(2, ...game.marketCards.map(c => c.cost));
        if (game.marketCards.length === 0 || player.energy < minCost) {
          endTurnAutomatically(gameId, socket.id);
        } else {
          broadcastState(gameId);
        }
      }
    }
  });

  socket.on(SOCKET_EVENTS.END_TURN, (gameId: string) => {
    const game = games[gameId];
    if (game && game.currentTurnPlayerId === socket.id) {
      endTurnAutomatically(gameId, socket.id);
    }
  });

  socket.on(SOCKET_EVENTS.SEND_CHAT, (gameId: string, text: string) => {
    const game = games[gameId];
    if (game) {
      const senderName = game.players[socket.id]?.name || 'Unknown';
      if (!(game as any).chatMessages) (game as any).chatMessages = [];
      (game as any).chatMessages.push({ sender: senderName, text: text.trim() });
      
      // If a non-bot player sends a message, mute bots for this game
      if (game.players[socket.id] && !game.players[socket.id].isBot) {
        (game as any).botsMuted = true;
      }
      
      broadcastState(gameId);
    }
  });

});

httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
