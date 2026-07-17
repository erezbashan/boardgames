import type { GameState, TurnHistory, Player } from '@king-of-tokyo/shared';
import { CardRegistry } from '@king-of-tokyo/shared';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { rollDice, evaluateDice, createInitialGameState, shuffleDeck } from './gameLogic';
import { playBotTurn, playBotBuyPhase } from './botLogic';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const createEventContext = (gameState: GameState, playerId: string) => ({
  gameState,
  playerId,
  log: (msg: string) => {
    gameState.logs.push(msg);
  },
  highlight: (id: string, stat: string, dir?: 'up' | 'down') => {
    const statObj: any = { playerId: id, stat };
    if (dir) statObj.dir = dir;
    gameState.highlightedStats.push(statObj);
  }
});

export const getBehaviors = (player: Player) => {
  const behaviors = player.cards.map((c: any) => CardRegistry[c.id]).filter(Boolean);
  if (player.poisonTokens > 0) behaviors.push(CardRegistry['t1']);
  if (player.shrinkTokens > 0) behaviors.push(CardRegistry['t2']);
  return behaviors;
};

export async function getGame(gameId: string): Promise<GameState | null> {
  const docRef = doc(db, 'games', gameId);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    const data = snapshot.data();
    return data ? (data as GameState) : null;
  }
  return null;
}

export async function saveGame(gameId: string, state: GameState) {
  if (state.status === 'Playing') {
    const alivePlayers = Object.values(state.players).filter(p => p.health > 0);
    let winner = Object.values(state.players).find(p => p.victoryPoints >= (state.settings?.winningVP || 20));
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

  const docRef = doc(db, 'games', gameId);
  await setDoc(docRef, state, { merge: true });
}

export function checkGameOver(state: GameState): boolean {
  return state.status === 'GameOver';
}

export async function startTurn(gameId: string, playerId: string) {
  const game = await getGame(gameId);
  if (!game) return;
  
  
  
  const p = game.players[playerId];
  if (!p) return;

  game.currentTurnPlayerId = playerId;
  let rolls = 3;
  const ctx = createEventContext(game, p.id);
  const behaviors = getBehaviors(p);
  for (const b of behaviors) {
    if (b?.onDetermineRolls) rolls = b.onDetermineRolls(ctx, rolls);
  }
  game.rollsLeft = rolls;
  console.log(`[DEBUG] ${gameId}: startTurn for ${playerId}. rollsLeft is now 3.`);
  game.currentDice = [];
  game.pendingYields = [];
  p.flags = {};
  game.logs.push(`TURN_START:${p.name}`);
  
  let animatedStart = false;
  game.highlightedStats = [];
  
  if (p.inTokyo) {
    p.victoryPoints = Math.min(20, p.victoryPoints + 2);
    if (p.gameStats) p.gameStats.vpFromStartingTokyo = (p.gameStats.vpFromStartingTokyo || 0) + 2;
    game.logs.push(`${p.name} started their turn in Tokyo City! (+2 ⭐)`);
    game.highlightedStats.push({ playerId: p.id, stat: 'vp' });
    animatedStart = true;
  }
  const oldLogLen = game.logs.length;
  for (const b of behaviors) {
    if (b?.onTurnStart) b.onTurnStart(ctx);
  }
  if (game.logs.length > oldLogLen) animatedStart = true;
  
  p.dealtDamageThisTurn = false;
  if (animatedStart) {
    game.isAnimating = true;
    await saveGame(gameId, game);
    await new Promise(r => setTimeout(r, 1500));
    game.isAnimating = false;
    game.highlightedStats = [];
  }
  
  if (p.health <= 0) {
    p.inTokyo = false;
    game.logs.push(`💀 ${p.name} was killed!`);
    if (p.gameStats) p.gameStats.turnDied = game.history && game.history.length > 0 ? game.history[game.history.length - 1].turnNumber : 0;
    endTurnAutomatically(gameId, p.id);
    return;
  }

  // Always broadcast state so clients know whose turn it is
  await saveGame(gameId, game);

  // If human, they click roll. If bot, trigger bot logic.
  if (p.isBot && p.health > 0) {
    
    playBotTurn(gameId, game, saveGame, resolveDiceAutomatically);
  }
}

export async function endTurnAutomatically(gameId: string, playerId: string) {
  const game = await getGame(gameId);
  if (!game) return;
  
  
  
  if (!game.history) game.history = [];
  const currentTurn = game.history.length > 0 ? game.history[game.history.length - 1].turnNumber + 1 : 0;
  Object.values(game.players).forEach(p => {
    game.history!.push({
      turnNumber: currentTurn,
      playerId: p.id,
      vp: p.victoryPoints,
      health: Math.max(0, p.health),
      energy: p.energy,
      tokyoPlayerId: Object.values(game.players).find(x => x.inTokyo)?.id || null
    });
  });
  
  const ctx = createEventContext(game, playerId);
  let oldVp = game.players[playerId].victoryPoints;
  for (const b of getBehaviors(game.players[playerId])) {
    if (b?.onTurnEnd) b.onTurnEnd(ctx);
  }
  if (game.players[playerId].victoryPoints !== oldVp || game.logs.length > 0) { // wait, game.logs always has length > 0... actually let's just saveGame unconditionally
    await saveGame(gameId, game);
  }
  
  if (checkGameOver(game)) return;
  
  const idx = game.playerOrder.indexOf(playerId);
  
  let nextId = game.playerOrder[(idx + 1) % game.playerOrder.length];
  if (game.players[playerId]?.hasFrenzy) {
    nextId = playerId;
    game.players[playerId].hasFrenzy = false;
  } else {
    let tries = 0;
    while (game.players[nextId]?.health <= 0 && tries < game.playerOrder.length) {
      const nextIdx = game.playerOrder.indexOf(nextId);
      nextId = game.playerOrder[(nextIdx + 1) % game.playerOrder.length];
      tries++;
    }
  }
  
  startTurn(gameId, nextId);
}

export async function answerPromptAction(gameId: string, playerId: string, promptId: string, answerValue: string) {
  const game = await getGame(gameId);
  if (!game) return;
  const p = game.players[playerId];
  if (!p) return;

  if (!game.pendingPrompts) return;
  const promptIdx = game.pendingPrompts.findIndex(p => p.promptId === promptId && p.playerId === playerId);
  if (promptIdx === -1) return;

  const prompt = game.pendingPrompts[promptIdx];
  const chosenOption = prompt.options.find(o => o.value === answerValue);
  game.logs.push(`🗣️ ${p.name} chose: ${chosenOption?.label || answerValue}`);

  game.pendingPrompts.splice(promptIdx, 1);
  if (game.pendingPrompts.length === 0) {
    delete game.pendingPrompts;
  }

  const ctx = createEventContext(game, playerId);
  const behaviors = getBehaviors(p);
  const b = behaviors.find(b => b.id === prompt.cardId);

  if (b && b.onPromptAnswer) {
    const nextPrompt = b.onPromptAnswer(ctx, promptId, answerValue);
    if (nextPrompt) {
      game.logs.push(`❓ ${p.name} is deciding: "${nextPrompt.question}"`);
      if (!game.pendingPrompts) game.pendingPrompts = [];
      game.pendingPrompts.push({ ...nextPrompt, playerId, cardId: b.id, promptId: nextPrompt.id });
      await saveGame(gameId, game);
      return;
    }
  }

  await saveGame(gameId, game);
  if (!game.pendingPrompts || game.pendingPrompts.length === 0) {
    resolveDiceAutomatically(gameId, playerId);
  }
}

export async function resolveDiceAutomatically(gameId: string, playerId: string) {
  const game = await getGame(gameId);
  if (!game) return;
  
  
  const p = game.players[playerId];

  // Evaluate pre-resolution prompts
  const resolveCtx = createEventContext(game, playerId);
  for (const b of getBehaviors(p)) {
    let currentPrompt = b?.onBeforeResolve ? b.onBeforeResolve(resolveCtx) : undefined;
    while (currentPrompt) {
      if (p.isBot) {
         const randomOption = currentPrompt.options[Math.floor(Math.random() * currentPrompt.options.length)];
         game.logs.push(`🤖 ${p.name} was asked: "${currentPrompt.question}" and chose: ${randomOption.label}`);
         currentPrompt = b.onPromptAnswer ? b.onPromptAnswer(resolveCtx, currentPrompt.id, randomOption.value) : undefined;
      } else {
         game.logs.push(`❓ ${p.name} is deciding: "${currentPrompt.question}"`);
         game.pendingPrompts = [{ ...currentPrompt, playerId, cardId: b.id, promptId: currentPrompt.id }];
         await saveGame(gameId, game);
         return; // Halt resolution until prompt is answered
      }
    }
  }

  game.rollsLeft = 0;
  game.isAnimating = true;
  game.currentDice.forEach(d => d.kept = false);
  await saveGame(gameId, game);
  await delay(400); // Give UI time to clear locks before animating

  const faceMap: Record<string, string> = { '1': '1️⃣', '2': '2️⃣', '3': '3️⃣', 'Heart': '❤️', 'Lightning': '⚡', 'Claw': '💥' };
  const diceFaces = game.currentDice.map(d => faceMap[d.face]).join(' ');
  game.logs.push(`${p.name} resolved: ${diceFaces}`);
  
  
  const results = evaluateDice(game.currentDice);

  // Helper to clear highlights
  const clearHighlights = () => {
    game.highlightedDice = [];
    game.highlightedStats = [];
  };

  // Phase 1: Points
  {
    let displayPts = results.points;
    const oldVp = displayPts;
    const ctx = createEventContext(game, p.id);
    for (const b of getBehaviors(p)) {
      if (b?.onBeforeScoreVP) displayPts = b.onBeforeScoreVP(ctx, displayPts);
    }
    if (displayPts > 0) {
      if (displayPts > oldVp && p.gameStats) {
        p.gameStats.vpFromOther = (p.gameStats.vpFromOther || 0) + (displayPts - oldVp);
      }
      p.victoryPoints = Math.min(game.settings?.winningVP || 20, p.victoryPoints + displayPts);
      if (p.gameStats) p.gameStats.vpFromDice = (p.gameStats.vpFromDice || 0) + results.points;
      if (displayPts > 0) {
        game.logs.push(`${p.name} gained ${displayPts} ⭐.`);
      }
    }
  }

  if (results.points > 0) {
    game.highlightedStats = [{ playerId: p.id, stat: 'vp' }];
    // Only highlight number dice if they actually scored points (count >= 3)
    game.highlightedDice = game.currentDice.filter(d => {
      if (!['1', '2', '3'].includes(d.face)) return false;
      const count = game.currentDice.filter(d2 => d2.face === d.face).length;
      return count >= 3;
    }).map(d => d.id);
    
    game.highlightedStats = [{ playerId: p.id, stat: 'vp' }];
    await saveGame(gameId, game);
    await delay(1500);
  }

  // Phase 2: Energy
  if (results.energy > 0) {
    const ctx = createEventContext(game, p.id);
    for (const b of getBehaviors(p)) {
      if (b?.onBeforeGainEnergy) results.energy = b.onBeforeGainEnergy(ctx, results.energy);
    }
    p.energy += results.energy;
    if (p.gameStats) p.gameStats.energyGained += results.energy;
    game.logs.push(`${p.name} gained ${results.energy} ⚡.`);
    game.highlightedDice = game.currentDice.filter(d => d.face === 'Lightning').map(d => d.id);
    game.highlightedStats = [{ playerId: p.id, stat: 'energy' }];
    await saveGame(gameId, game);
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
        game.logs.push(`${p.name} cured ${poisonHealed} poison token(s).`);
      }
    }
    
    let actualHeal = 0;
    if (healsRemaining > 0 && !p.inTokyo) {
      const ctx = createEventContext(game, p.id);
    for (const b of getBehaviors(p)) {
        if (b?.onBeforeHeal) healsRemaining = b.onBeforeHeal(ctx, healsRemaining);
      }
      actualHeal = Math.min((p.maxHealth || game.settings?.maxHealth || 10) - p.health, healsRemaining);
      if (actualHeal > 0) {
        p.health += actualHeal;
        if (p.gameStats) p.gameStats.healingGained += actualHeal;
        game.logs.push(`${p.name} healed ${actualHeal} ❤️.`);
      }
    }
    
    if (results.heal > healsRemaining || actualHeal > 0) {
      game.highlightedDice = game.currentDice.filter(d => d.face === 'Heart').map(d => d.id);
      game.highlightedStats = [{ playerId: p.id, stat: 'health' }];
      await saveGame(gameId, game);
      await delay(1500);
    }
  }
  
  // Phase 4: Attack
  const ctx = createEventContext(game, p.id);
  
  if (results.attack > 0) {
    game.highlightedDice = game.currentDice.filter(d => d.face === 'Claw').map(d => d.id);
    game.highlightedStats = [];
    
    let hitSomeone = false;
    let hitTokyoPlayer = false;
    let playerInTokyo: any = null;
    const modifierLogs: string[] = [];
    const targetNames: string[] = [];

    let currentTargets: string[] = [];
    Object.values(game.players).forEach(other => {
      if (other.id === p.id) return;
      if (other.health <= 0) return;
      if ((p.inTokyo && !other.inTokyo) || (!p.inTokyo && other.inTokyo)) {
        currentTargets.push(other.id);
      }
    });

    for (const b of getBehaviors(p)) {
      if (b?.onDetermineAttackTargets) currentTargets = b.onDetermineAttackTargets(ctx, currentTargets);
    }

    let baseDmg = results.attack;
    for (const b of getBehaviors(p)) {
      if (b?.onAttackOut) baseDmg = b.onAttackOut(ctx, baseDmg);
    }

    Object.values(game.players).forEach(other => {
      if (currentTargets.includes(other.id)) {
        targetNames.push(other.name);
        
        let dmg = baseDmg;
        for (const b of getBehaviors(p)) {
          if (b?.onAttackTargeted) dmg = b.onAttackTargeted(ctx, other.id, dmg);
        }
        
        const otherCtx = createEventContext(game, other.id);
        
        for (const b of getBehaviors(other)) {
          if (b?.onBeforeDamageTaken) dmg = b.onBeforeDamageTaken(otherCtx, dmg, p.id);
        }

        let actualDmg = Math.max(0, dmg);
        if (actualDmg > 0) {
          p.dealtDamageThisTurn = true;
          
          other.health -= actualDmg;
          if (p.gameStats) {
            p.gameStats.damageDealt += actualDmg;
          }
          game.highlightedStats.push({ playerId: other.id, stat: 'health' });
          hitSomeone = true;

          for (const b of getBehaviors(p)) {
            if (b?.onDamageDealt) b.onDamageDealt(ctx, actualDmg, other.id);
          }
          
          for (const b of getBehaviors(other)) {
            if (b?.onDamageTaken) b.onDamageTaken(otherCtx, actualDmg, p.id);
          }
          
          if (other.health <= 0) {
            modifierLogs.push(`💀 ${other.name} was killed!`);
            if (p.gameStats) {
              p.gameStats.playersKilled = (p.gameStats.playersKilled || 0) + 1;
            }
            if (other.gameStats) {
              other.gameStats.turnDied = game.history && game.history.length > 0 ? game.history[game.history.length - 1].turnNumber : 0;
            }
          }
        }
        
        if (other.inTokyo && actualDmg > 0) {
          hitTokyoPlayer = true;
          playerInTokyo = other;
        }
      }
    });

    if (hitSomeone || modifierLogs.length > 0 || targetNames.length > 0) {
      const targetsStr = targetNames.length > 0 ? targetNames.join(', ') : 'no one';
      
      for (const b of getBehaviors(p)) {
        if (b?.onAttackResolved) b.onAttackResolved(ctx, hitSomeone);
      }
      
      game.logs.push(`${p.name} dealt ${results.attack} 💥 damage to ${targetsStr}!`);
      game.logs.push(...modifierLogs);
    }

    await saveGame(gameId, game);
    await delay(1500);

    if (!p.inTokyo && hitTokyoPlayer && playerInTokyo && playerInTokyo.health > 0) {
      if (!playerInTokyo.isBot) {
        game.pendingYields = [playerInTokyo.id];
        await saveGame(gameId, game);
        const yielded = await new Promise<boolean>((resolve) => {
          (window as any)._yieldResolver = resolve;
        });
        game.pendingYields = [];
        if (yielded) {
          playerInTokyo.inTokyo = false;
          
          const yieldCtx = createEventContext(game, playerInTokyo.id);
          for (const b of getBehaviors(playerInTokyo)) {
            if (b?.onYieldTokyo) b.onYieldTokyo(yieldCtx);
          }
          
          game.logs.push(`${playerInTokyo.name} yielded Tokyo!`);
          hitTokyoPlayer = false; // Tokyo is empty now
        } else {
          game.logs.push(`${playerInTokyo.name} stayed in Tokyo!`);
        }
      } else {
        const yielded = Math.random() > 0.5;
        if (yielded) {
          playerInTokyo.inTokyo = false;
          
          const yieldCtx = createEventContext(game, playerInTokyo.id);
          for (const b of getBehaviors(playerInTokyo)) {
            if (b?.onYieldTokyo) b.onYieldTokyo(yieldCtx);
          }
          
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
        let enterVp = 1;
        p.victoryPoints = Math.min(20, p.victoryPoints + enterVp);
        if (p.gameStats) p.gameStats.vpFromEnteringTokyo = (p.gameStats.vpFromEnteringTokyo || 0) + enterVp;
        game.logs.push(`${p.name} entered Tokyo City! (+${enterVp} ⭐)`);
        game.highlightedStats.push({ playerId: p.id, stat: 'vp' });
        
        for (const b of getBehaviors(p)) {
          if (b?.onEnterTokyo) b.onEnterTokyo(ctx);
        }
      }
    }
    
    await saveGame(gameId, game);
    await delay(1500);
  }

  clearHighlights();
  await saveGame(gameId, game);
  await delay(1000);

  game.isAnimating = false;

  const minCost = Math.min(2, ...game.marketCards.map(c => c.cost));
  if (p.isBot) {
    
    playBotBuyPhase(gameId, game, saveGame, endTurnAutomatically);
  } else if (game.marketCards.length === 0 || p.energy < minCost) {
    endTurnAutomatically(gameId, playerId);
  } else {
    await saveGame(gameId, game);
  }
}

export async function createGame(gameId: string, playerId: string, username: string) {
    // removed re-declaration of gameId
    const game = createInitialGameState(gameId);
    
    // Add creator
    game.players[playerId] = {
      id: playerId,
      name: username || 'Player 1',
      isBot: false,
      health: game.settings ? game.settings.startingHealth : 10,
      maxHealth: game.settings ? game.settings.maxHealth : 10,
      victoryPoints: 0,
      energy: game.settings?.startingEnergy || 0,
      inTokyo: false,
      cards: [],
      poisonTokens: 0,
      shrinkTokens: 0
    };
    game.playerOrder.push(playerId);
    
    // socket.join(gameId);
    
    await saveGame(gameId, game);

}

export async function joinGame(gameId: string, username: string, playerId: string, previousPlayerId?: string) {
    const game = await getGame(gameId);
  if (!game) return;
  if (!game) return;
    if (!game) {
      console.error('Game not found');
      return;
    }
    
    // Handle reconnect
    if (game.status !== 'Lobby') {
      if (previousPlayerId && game.players[previousPlayerId]) {
        const player = game.players[previousPlayerId];
        player.id = playerId;
        game.players[playerId] = player;
        delete game.players[previousPlayerId];
        
        const orderIdx = game.playerOrder.indexOf(previousPlayerId);
        if (orderIdx !== -1) game.playerOrder[orderIdx] = playerId;
        
        if (game.currentTurnPlayerId === previousPlayerId) game.currentTurnPlayerId = playerId;
        
        const yieldIdx = game.pendingYields?.indexOf(previousPlayerId);
        if (yieldIdx !== undefined && yieldIdx !== -1) game.pendingYields[yieldIdx] = playerId;
        
        if (game.history) {
          game.history.forEach((h: TurnHistory) => {
            if (h.playerId === previousPlayerId) {
              h.playerId = playerId;
            }
          });
        }
        
        // socket.join(gameId);
        
        await saveGame(gameId, game);
        return;
      }
      
      // Fallback: If no valid previous ID, check if there's an orphaned human player with the same name
      const orphanedHuman = Object.values(game.players).find(p => !p.isBot && p.name === username && false /* replace logic later */);
      if (orphanedHuman) {
        const oldId = orphanedHuman.id;
        orphanedHuman.id = playerId;
        game.players[playerId] = orphanedHuman;
        delete game.players[oldId];
        
        const orderIdx = game.playerOrder.indexOf(oldId);
        if (orderIdx !== -1) game.playerOrder[orderIdx] = playerId;
        
        if (game.currentTurnPlayerId === oldId) game.currentTurnPlayerId = playerId;
        
        const yieldIdx = game.pendingYields?.indexOf(oldId);
        if (yieldIdx !== undefined && yieldIdx !== -1) game.pendingYields[yieldIdx] = playerId;
        
        // socket.join(gameId);
        
        await saveGame(gameId, game);
        return;
      }

      console.error('Game already started');
      return;
    }

    game.players[playerId] = {
      id: playerId,
      name: username || `Player ${Object.keys(game.players).length + 1}`,
      isBot: false,
      health: game.settings ? game.settings.startingHealth : 10,
      maxHealth: game.settings ? game.settings.maxHealth : 10,
      victoryPoints: 0,
      energy: game.settings?.startingEnergy || 0,
      inTokyo: false,
      cards: [],
      poisonTokens: 0,
      shrinkTokens: 0
    };
    game.playerOrder.push(playerId);
    
    // socket.join(gameId);
    
    await saveGame(gameId, game);

}

export async function quitGame(gameId: string, playerId: string) {
    const game = await getGame(gameId);
  if (!game) return;
  if (!game) return;
    if (game) {
      delete game.players[playerId];
      game.playerOrder = game.playerOrder.filter(id => id !== playerId);
      // socket.leave(gameId);
      
      await saveGame(gameId, game);
    }

}

export async function addBot(gameId: string, _playerId: string) {
    const game = await getGame(gameId);
  if (!game) return;
  if (!game) return;
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
        health: game.settings ? game.settings.startingHealth : 10,
        maxHealth: game.settings ? game.settings.maxHealth : 10,
        victoryPoints: 0,
        energy: game.settings?.startingEnergy || 0,
        inTokyo: false,
        cards: [],
        poisonTokens: 0,
      shrinkTokens: 0
      };
      game.playerOrder.push(botId);
      await saveGame(gameId, game);
    }

}

export async function returnToLobby(gameId: string, _playerId: string) {
    const game = await getGame(gameId);
  if (!game) return;
  if (!game) return;
    if (game && game.status === 'GameOver') {
      game.status = 'Lobby';
      game.winner = null;
      game.history = [];
      game.logs = ['Game returned to lobby'];
      Object.values(game.players).forEach(p => {
        p.health = game.settings?.startingHealth || 10;
        p.victoryPoints = 0;
        p.energy = 0;
        p.inTokyo = false;
        p.cards = [];
        p.poisonTokens = 0;
        p.shrinkTokens = 0;
      });
      game.currentTurnPlayerId = null;
      await saveGame(gameId, game);
    }

}

export async function startGame(payload: any) {
    const gameId = typeof payload === 'string' ? payload : payload.gameId;
    const settings = typeof payload === 'string' ? undefined : payload.settings;
    const game = await getGame(gameId);
  if (!game) return;
  if (!game) return;
    if (game && settings) {
      game.settings = { ...game.settings, ...settings };
      const deck = shuffleDeck(game.settings);
      game.marketCards = deck.splice(0, 3);
      game.deckCount = deck.length;
      game.deck = deck;
    }
    if (game && game.status === 'Lobby') {
      game.status = 'Playing';
      const PLAYER_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
      Object.values(game.players).forEach((p, index) => {
        p.color = PLAYER_COLORS[index % PLAYER_COLORS.length];
        p.health = game.settings?.startingHealth || 10;
        p.maxHealth = game.settings?.maxHealth || 10;
        p.gameStats = {
          damageDealt: 0,
          playersKilled: 0,
          cardsBought: 0,
          energySpent: 0,
          energyGained: 0,
          healingGained: 0,
          vpFromDice: 0,
          vpFromEnteringTokyo: 0,
          vpFromStartingTokyo: 0,
          vpFromOther: 0,
        };
      });

      // Randomize player order
      for (let i = game.playerOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [game.playerOrder[i], game.playerOrder[j]] = [game.playerOrder[j], game.playerOrder[i]];
      }

      game.logs.push('Game started!');
      await saveGame(gameId, game);
      startTurn(gameId, game.playerOrder[0]);
    }

}

export async function rollDiceAction(gameId: string, playerId: string) {
    const game = await getGame(gameId);
  if (!game) return;
  if (!game) return;
  
  const p = game.players[playerId];
  const hasBackgroundDweller = p?.cards?.some(c => c.effect?.backgroundDweller);
  const unkeptDice = game.currentDice.filter(d => !d.kept);
  const canUseBackgroundDweller = hasBackgroundDweller && game.rollsLeft <= 0 && unkeptDice.length > 0 && unkeptDice.every(d => d.face === '3');
  
  if (game && game.currentTurnPlayerId === playerId && (game.rollsLeft > 0 || canUseBackgroundDweller)) {
    if (game.rollsLeft > 0) {
      game.rollsLeft -= 1;
    } else {
      game.logs.push(`${p.name} rerolled 3s using Background Dweller!`);
      game.highlightedStats = [{ playerId: p.id, stat: 'card:c33' }];
    }
      
      // Get `rollDice` from gameLogic, we need to import it if not already
      
      if (game.currentDice.length === 0) {
        const base = game.settings?.startingDice || 6;
        let numDice = base;
        const ctx = createEventContext(game, playerId);
        for (const b of getBehaviors(game.players[playerId])) {
          if (b?.onDetermineDiceCount) numDice = b.onDetermineDiceCount(ctx, numDice);
        }
        numDice = Math.max(1, numDice);
        game.currentDice = rollDice(numDice);
      } else {
        game.currentDice = game.currentDice.map(d => d.kept ? d : rollDice(1)[0]);
      }
      
      if (game.rollsLeft === 0) {
        game.isAnimating = true;
      }
      
      await saveGame(gameId, game);
      if (game.rollsLeft === 0) {
        resolveDiceAutomatically(gameId, playerId);
      }
    }

}

export async function keepDice(gameId: string, diceIds: string[], playerId: string) {
    const game = await getGame(gameId);
  if (!game) return;
  if (!game) return;
    if (game && game.currentTurnPlayerId === playerId) {
      game.currentDice.forEach(d => {
        d.kept = diceIds.includes(d.id);
      });
      await saveGame(gameId, game);
    }

}

export async function resolveDice(gameId: string, playerId: string) {
    const game = await getGame(gameId);
  if (!game) return;
  if (!game) return;
    if (game && game.currentTurnPlayerId === playerId) {
      resolveDiceAutomatically(gameId, playerId);
    }

}

export async function yieldTokyo(gameId: string, choice: boolean, playerId: string) {
    const game = await getGame(gameId);
  if (!game) return;
  if (!game) return;
    if (game && (window as any)._yieldResolver && game.pendingYields.includes(playerId)) {
      (window as any)._yieldResolver(choice);
      (window as any)._yieldResolver = null;
    }

}

export function getCardCost(game: GameState, playerId: string, cardCost: number): number {
  const player = game.players[playerId];
  if (!player) return cardCost;
  let cost = cardCost;
  const ctx = createEventContext(game, playerId);
  for (const b of getBehaviors(player)) {
    if (b?.onBeforeBuyCard) cost = b.onBeforeBuyCard(ctx, cost);
  }
  return Math.max(0, cost);
}

export async function buyCard(gameId: string, cardId: string, playerId: string) {
    const game = await getGame(gameId);
  if (!game) return;
  if (!game) return;
    if (game && game.currentTurnPlayerId === playerId && !game.isAnimating) {
      const player = game.players[playerId];
      const cardIndex = game.marketCards.findIndex(c => c.id === cardId);
      if (cardIndex !== -1) {
        const card = game.marketCards[cardIndex];
        const cost = getCardCost(game, playerId, card.cost);
        if (player.energy >= cost) {
          player.energy -= cost;
          if (player.gameStats) {
            player.gameStats.energySpent += cost;
            player.gameStats.cardsBought += 1;
          }
          const ctx = createEventContext(game, playerId);
          if (card.type !== 'Discard') {
            player.cards.push(card);
          }
          // Don't splice yet, we'll replace or splice at the end
          
          game.logs.push(`BUY_CARD:${player.name}:${JSON.stringify(card)}`);
          game.isAnimating = true;
          game.highlightedStats = [{ playerId: player.id, stat: 'energy' }];
          
          for (const b of getBehaviors(player)) {
            if (b?.onBuyCard) b.onBuyCard(ctx, cost);
          }
          
          const cardBehavior = CardRegistry[card.id];
          if (cardBehavior?.onBuy) {
            cardBehavior.onBuy(ctx);
          } else if (card.type === 'Discard' && card.effect) {
            if (card.effect.vp) {
              player.victoryPoints += card.effect.vp;
              if (player.gameStats) player.gameStats.vpFromCards = (player.gameStats.vpFromCards || 0) + card.effect.vp;
              ctx.highlight(player.id, 'vp');
            }
            if (card.effect.energy) {
              player.energy += card.effect.energy;
              ctx.highlight(player.id, 'energy');
            }
            if (card.effect.spikeDamage) {
              for (const pId in game.players) {
                if (pId !== playerId && game.players[pId].health > 0) {
                  game.players[pId].health = Math.max(0, game.players[pId].health - card.effect.spikeDamage);
                  ctx.highlight(pId, 'health');
                }
              }
            }
          }
          
          if (game.deck.length > 0) {
            game.marketCards[cardIndex] = game.deck.shift()!;
          } else {
            game.marketCards.splice(cardIndex, 1);
          }
          game.deckCount = game.deck.length;
          
          await saveGame(gameId, game);
          await delay(1500);
          
          game.highlightedStats = [];
          game.isAnimating = false;
          
          const minCost = Math.min(2, ...game.marketCards.map(c => c.cost));
          if (game.marketCards.length === 0 || player.energy < minCost) {
            endTurnAutomatically(gameId, playerId);
          } else {
            await saveGame(gameId, game);
          }
        }
      }
    }

}

export async function sweepCards(gameId: string, playerId: string) {
    const game = await getGame(gameId);
  if (!game) return;
  if (!game) return;
    if (game && game.currentTurnPlayerId === playerId && !game.isAnimating) {
      const player = game.players[playerId];
      if (player.energy >= 2) {
        player.energy -= 2;
        game.logs.push(`${player.name} paid 2 ⚡ to sweep the cards.`);
        game.isAnimating = true;
        game.highlightedStats = [{ playerId: player.id, stat: 'energy' }];

        let i = 0;
        while (i < game.marketCards.length) {
          if (game.deck.length > 0) {
            game.marketCards[i] = game.deck.shift()!;
            game.deckCount = game.deck.length;
            await saveGame(gameId, game);
            await delay(400);
            i++;
          } else {
            game.marketCards.splice(i, 1);
            await saveGame(gameId, game);
            await delay(400);
          }
        }
        
        game.isAnimating = false;
        await delay(800); // Extra pause before evaluating end turn

        const minCost = Math.min(2, ...game.marketCards.map(c => c.cost));
        if (game.marketCards.length === 0 || player.energy < minCost) {
          endTurnAutomatically(gameId, playerId);
        } else {
          await saveGame(gameId, game);
        }
      }
    }

}

export async function endTurn(gameId: string, playerId: string) {
    const game = await getGame(gameId);
  if (!game) return;
  if (!game) return;
    if (game && game.currentTurnPlayerId === playerId) {
      endTurnAutomatically(gameId, playerId);
    }

}

export async function sendChat(gameId: string, text: string, playerId: string) {
    const game = await getGame(gameId);
  if (!game) return;
  if (!game) return;
    if (game) {
      const senderName = game.players[playerId]?.name || 'Unknown';
      if (!(game as any).chatMessages) (game as any).chatMessages = [];
      (game as any).chatMessages.push({ sender: senderName, text: text.trim() });
      
      // If a non-bot player sends a message, mute bots for this game
      if (game.players[playerId] && !game.players[playerId].isBot) {
        (game as any).botsMuted = true;
      }
      
      await saveGame(gameId, game);
    }

}

