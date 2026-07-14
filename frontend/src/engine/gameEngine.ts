import type { GameState, Card } from '@king-of-tokyo/shared';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { TurnHistory } from '@king-of-tokyo/shared';
import { rollDice, evaluateDice, createInitialGameState } from './gameLogic';
import { playBotTurn, playBotBuyPhase } from './botLogic';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
  game.rollsLeft = p.cards.some(c => c.effect?.giantBrain) ? 4 : 3;
  console.log(`[DEBUG] ${gameId}: startTurn for ${playerId}. rollsLeft is now 3.`);
  game.currentDice = [];
  game.pendingYields = [];
  game.logs.push(`TURN_START:${p.name}`);
  
  let animatedStart = false;
  game.highlightedStats = [];
  
  if (p.inTokyo) {
    p.victoryPoints = Math.min(20, p.victoryPoints + 2);
    if (p.gameStats) p.gameStats.vpFromStartingTokyo = (p.gameStats.vpFromStartingTokyo || 0) + 2;
    game.logs.push(`👑 ${p.name} started their turn in Tokyo City! (+2 VP)`);
    game.highlightedStats.push({ playerId: p.id, stat: 'vp' });
    animatedStart = true;
  }
  if (p.cards.some(c => c.effect?.rapidHealing)) {
    const healAmt = Math.min(p.maxHealth || game.settings?.maxHealth || 10, p.health + 1) - p.health;
    if (healAmt > 0) {
      p.health += healAmt;
      game.logs.push(`💖 ${p.name} healed 1 ❤️ from Rapid Healing!`);
      game.highlightedStats.push({ playerId: p.id, stat: 'health' });
      animatedStart = true;
    }
  }
  if (p.gameStats) (p as any).dealtDamageThisTurn = false;
  if (p.cards.some(c => c.effect?.solarPowered) && p.energy === 0) {
    p.energy += 1;
    game.logs.push(`☀️ ${p.name} gained 1 ⚡ from Solar Powered!`);
    game.highlightedStats.push({ playerId: p.id, stat: 'energy' });
    animatedStart = true;
  }
  if (animatedStart) {
    game.isAnimating = true;
    await saveGame(gameId, game);
    await new Promise(r => setTimeout(r, 1500));
    game.isAnimating = false;
    game.highlightedStats = [];
  }
  
  if (p.poisonTokens > 0) {
    const poisonDmg = Math.min(p.health, p.poisonTokens);
    p.health -= poisonDmg;
    game.logs.push(`☠️ ${p.name} took ${poisonDmg} poison damage!`);
    if (p.health <= 0) {
      game.logs.push(`💀 ${p.name} was killed!`);
      if (p.gameStats) p.gameStats.turnDied = game.history && game.history.length > 0 ? game.history[game.history.length - 1].turnNumber : 0;
    }
    game.isAnimating = true;
    game.highlightedStats = [{ playerId: p.id, stat: 'health' }];
    await saveGame(gameId, game);
    
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
  
  if (checkGameOver(game)) return;
  
  const idx = game.playerOrder.indexOf(playerId);
  
  let nextId = game.playerOrder[(idx + 1) % game.playerOrder.length];
  let tries = 0;
  while (game.players[nextId]?.health <= 0 && tries < game.playerOrder.length) {
    const nextIdx = game.playerOrder.indexOf(nextId);
    nextId = game.playerOrder[(nextIdx + 1) % game.playerOrder.length];
    tries++;
  }
  
  startTurn(gameId, nextId);
}

export async function resolveDiceAutomatically(gameId: string, playerId: string) {
  const game = await getGame(gameId);
  if (!game) return;
  
  
  game.rollsLeft = 0;
  game.isAnimating = true;
  game.currentDice.forEach(d => d.kept = false);
  await saveGame(gameId, game);
  await delay(400); // Give UI time to clear locks before animating

  const p = game.players[playerId];
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
  if (results.points > 0) {
    let displayPts = results.points;
    if (p.cards.some(c => c.effect?.omnivore)) {
      displayPts += 2;
      if (p.gameStats) p.gameStats.vpFromOther = (p.gameStats.vpFromOther || 0) + 2;
      game.logs.push(`🍖 ${p.name} gained 2 extra VP from Omnivore!`);
    }
    if (p.cards.some(c => c.effect?.gourmet)) {
      const counts: Record<string, number> = { '1': 0, '2': 0, '3': 0, 'Heart': 0, 'Lightning': 0, 'Claw': 0 };
      game.currentDice.forEach(r => counts[r.face]++);
      if (counts['1'] >= 3) {
        displayPts += 1;
        if (p.gameStats) p.gameStats.vpFromOther = (p.gameStats.vpFromOther || 0) + 1;
        game.logs.push(`🍽️ ${p.name} gained 1 extra VP from Gourmet!`);
      }
    }
    p.victoryPoints = Math.min(game.settings?.winningVP || 20, p.victoryPoints + displayPts);
    if (p.gameStats) p.gameStats.vpFromDice = (p.gameStats.vpFromDice || 0) + results.points;
    game.logs.push(`${p.name} gained ${results.points} VP.`);
    
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
    if (p.cards.some(c => c.effect?.energyHoarder)) {
      results.energy += 1;
      game.logs.push(`${p.name} gained +1 extra ⚡ from Energy Hoarder!`);
    }
    if (p.cards.some(c => c.effect?.friendOfChildren)) {
      results.energy += 1;
      game.logs.push(`${p.name} gained +1 extra ⚡ from Friend of Children!`);
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
        game.logs.push(`☠️ ${p.name} cured ${poisonHealed} poison token(s).`);
      }
    }
    
    let actualHeal = 0;
    if (healsRemaining > 0 && !p.inTokyo) {
      if (p.cards.some(c => c.effect?.regeneration)) {
        healsRemaining += 1;
        game.logs.push(`${p.name} heals +1 extra ❤️ from Regeneration!`);
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
  const hasNovaBreath = p.cards.some(c => c.effect?.aoeAttack);
  const hasPoisonSpit = p.cards.some(c => c.effect?.poison);
  const hasFireBreathing = p.cards.some(c => c.effect?.fireBreathing);
  
  const aliveOrder = game.playerOrder.filter(id => game.players[id] && game.players[id].health > 0);
  const aliveIndex = aliveOrder.indexOf(p.id);
  let neighbors: string[] = [];
  if (aliveOrder.length > 2) {
    const prevId = aliveOrder[(aliveIndex - 1 + aliveOrder.length) % aliveOrder.length];
    const nextId = aliveOrder[(aliveIndex + 1) % aliveOrder.length];
    neighbors = [prevId, nextId];
  } else if (aliveOrder.length === 2) {
    neighbors = [aliveOrder.find(id => id !== p.id)!];
  }

  if (results.attack > 0) {
    game.highlightedDice = game.currentDice.filter(d => d.face === 'Claw').map(d => d.id);
    game.highlightedStats = [];
    
    let hitSomeone = false;
    let hitTokyoPlayer = false;
    let playerInTokyo: any = null;
    const modifierLogs: string[] = [];
    const targetNames: string[] = [];

    Object.values(game.players).forEach(other => {
      if (other.id === p.id) return;
      if (other.health <= 0) return; // Ignore dead players
      
      const isTarget = (p.inTokyo && !other.inTokyo) || 
                       (!p.inTokyo && other.inTokyo) || 
                       hasNovaBreath;

      if (isTarget) {
        targetNames.push(other.name);
        const armor = other.cards.reduce((sum: number, c: any) => sum + (c.effect?.armor || 0), 0);
        let dmg = results.attack;
        
        let extraFireDamage = 0;
        if (hasFireBreathing && neighbors.includes(other.id)) {
          dmg += 1;
          extraFireDamage = 1;
        }
        if (p.cards.some(c => c.effect?.urbavore) && p.inTokyo) {
          dmg += 1;
        }
        
        const evadeIdx = other.cards.findIndex((c: Card) => c.effect?.evade);
        if (evadeIdx !== -1 && dmg > 0) {
          other.cards.splice(evadeIdx, 1);
          dmg = 0;
          modifierLogs.push(`💨 ${other.name} Evaded the attack!`);
        }
        let actualDmg = Math.max(0, dmg - armor);
        if (actualDmg > 0) {
          (p as any).dealtDamageThisTurn = true;
          if (p.cards.some(c => c.effect?.poisonQuills)) {
            other.energy = Math.max(0, other.energy - 1);
            modifierLogs.push(`🪶 ${other.name} lost 1 ⚡ from Poison Quills!`);
          }
          if (other.cards.some(c => c.effect?.spikedArmor)) {
            p.health = Math.max(0, p.health - 1);
            modifierLogs.push(`🛡️ ${p.name} took 1 damage from ${other.name}'s Spiked Armor!`);
            game.highlightedStats.push({ playerId: p.id, stat: 'health' });
            if (p.health <= 0) {
              game.logs.push(`💀 ${p.name} was killed by Spiked Armor!`);
              if (p.gameStats) p.gameStats.turnDied = game.history && game.history.length > 0 ? game.history[game.history.length - 1].turnNumber : 0;
            }
          }
          other.health -= actualDmg;
          if (p.gameStats) {
            p.gameStats.damageDealt += actualDmg;
          }
          game.highlightedStats.push({ playerId: other.id, stat: 'health' });
          hitSomeone = true;
          
          if (p.cards.some(c => c.effect?.shrinkRay)) {
            other.shrinkTokens = Math.min(1, (other.shrinkTokens || 0) + 1);
            modifierLogs.push(`🎲🚫 ${other.name} was shrunk!`);
          }
          if (p.cards.some(c => c.effect?.parasitic)) {
            const actualHeal = Math.min(p.maxHealth || game.settings?.maxHealth || 10, p.health + 1) - p.health;
            if (actualHeal > 0) {
              p.health += actualHeal;
              modifierLogs.push(`🦑 ${p.name} healed 1 ❤️ from Parasitic Tentacles!`);
              game.highlightedStats.push({ playerId: p.id, stat: 'health' });
            }
          }

          
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
            if (p.gameStats) {
              p.gameStats.playersKilled = (p.gameStats.playersKilled || 0) + 1;
            }
            if (other.gameStats) {
              other.gameStats.turnDied = game.history && game.history.length > 0 ? game.history[game.history.length - 1].turnNumber : 0;
            }
          }
        } else if (armor > 0 && dmg > 0) {
           modifierLogs.push(`🛡️ ${other.name}'s Armor completely blocked the attack!`);
        }
        
        if (other.inTokyo && actualDmg > 0) {
          hitTokyoPlayer = true;
          playerInTokyo = other;
        }
      }
    });

    if (hitSomeone || modifierLogs.length > 0 || targetNames.length > 0) {
      const targetsStr = targetNames.length > 0 ? targetNames.join(', ') : 'no one';
      if (p.cards.some(c => c.effect?.alphaMonster)) {
        p.victoryPoints = Math.min(game.settings?.winningVP || 20, p.victoryPoints + 1);
        if (p.gameStats) p.gameStats.vpFromOther = (p.gameStats.vpFromOther || 0) + 1;
        modifierLogs.push(`🐺 ${p.name} gained 1 ⭐ from Alpha Monster!`);
        game.highlightedStats.push({ playerId: p.id, stat: 'vp' });
      }
      if (hasNovaBreath) {
        game.logs.push(`🌊 ${p.name} dealt ${results.attack} 💥 damage to ALL other players (${targetsStr})! (Nova Breath)`);
      } else {
        game.logs.push(`${p.name} dealt ${results.attack} 💥 damage to ${targetsStr}!`);
      }
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
          if (playerInTokyo.cards.some((c: any) => c.effect?.jetpack)) {
            playerInTokyo.energy += 2;
            if (playerInTokyo.gameStats) playerInTokyo.gameStats.energyGained += 2;
            game.logs.push(`🚀 ${playerInTokyo.name} gained 2 ⚡ from Jetpack for yielding Tokyo!`);
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
          if (playerInTokyo.cards.some((c: any) => c.effect?.jetpack)) {
            playerInTokyo.energy += 2;
            if (playerInTokyo.gameStats) playerInTokyo.gameStats.energyGained += 2;
            game.logs.push(`🚀 ${playerInTokyo.name} gained 2 ⚡ from Jetpack for yielding Tokyo!`);
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
        if (p.cards.some(c => c.effect?.urbavore)) {
          enterVp += 1;
        }
        p.victoryPoints = Math.min(20, p.victoryPoints + enterVp);
        if (p.gameStats) p.gameStats.vpFromEnteringTokyo = (p.gameStats.vpFromEnteringTokyo || 0) + enterVp;
        game.logs.push(`👑 ${p.name} entered Tokyo City! (+${enterVp} VP)`);
        game.highlightedStats.push({ playerId: p.id, stat: 'vp' });
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
      energy: 0,
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
      energy: 0,
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
        energy: 0,
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
    if (game && game.currentTurnPlayerId === playerId && game.rollsLeft > 0) {
      game.rollsLeft -= 1;
      
      // Get `rollDice` from gameLogic, we need to import it if not already
      
      if (game.currentDice.length === 0) {
        const extraDice = game.players[playerId].cards.reduce((sum: number, c: Card) => sum + (c.effect?.extraDie || 0), 0);
        const shrink = game.players[playerId].shrinkTokens || 0;
        const base = game.settings?.startingDice || 6;
        const numDice = Math.max(1, base + extraDice - shrink);
        game.currentDice = rollDice(numDice);
      } else {
        game.currentDice = game.currentDice.map(d => d.kept ? d : rollDice(1)[0]);
      }
      
      if (game.rollsLeft === 0) {
        resolveDiceAutomatically(gameId, playerId);
      } else {
        await saveGame(gameId, game);
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

export async function buyCard(gameId: string, cardId: string, playerId: string) {
    const game = await getGame(gameId);
  if (!game) return;
  if (!game) return;
    if (game && game.currentTurnPlayerId === playerId && !game.isAnimating) {
      const player = game.players[playerId];
      const cardIndex = game.marketCards.findIndex(c => c.id === cardId);
      if (cardIndex !== -1) {
        const card = game.marketCards[cardIndex];
        const cost = player.cards.some(c => c.effect?.alienMetabolism) ? Math.max(0, card.cost - 1) : card.cost;
        if (player.energy >= cost) {
          player.energy -= cost;
          if (player.gameStats) {
            player.gameStats.energySpent += cost;
            player.gameStats.cardsBought += 1;
          }
          if (card.type !== 'Discard') {
            player.cards.push(card);
          }
          // Don't splice yet, we'll replace or splice at the end
          
          game.logs.push(`BUY_CARD:${player.name}:${JSON.stringify(card)}`);
          game.isAnimating = true;
          game.highlightedStats = [];
          if (player.cards.some(c => c.effect?.newsTeam)) {
            player.victoryPoints = Math.min(game.settings?.winningVP || 20, player.victoryPoints + 1);
            if (player.gameStats) player.gameStats.vpFromOther = (player.gameStats.vpFromOther || 0) + 1;
            game.logs.push(`📰 ${player.name} gained 1 VP from Dedicated News Team!`);
            game.highlightedStats.push({ playerId: player.id, stat: 'vp' });
          }
          if (card.effect?.evacuation) {
            Object.values(game.players).forEach(other => {
              if (other.id !== player.id) {
                other.victoryPoints = Math.max(0, other.victoryPoints - 5);
                game.highlightedStats.push({ playerId: other.id, stat: 'vp' });
              }
            });
            game.logs.push(`🚨 All other players lost 5 VP from Evacuation Orders!`);
          }
          if (card.effect?.spikeDamage) {
            const dmg = card.effect.spikeDamage;
            if (dmg > 0) {
              Object.values(game.players).forEach(other => {
                if (other.id !== player.id && other.health > 0) {
                  const armor = other.cards.reduce((sum, c) => sum + (c.effect?.armor || 0), 0);
                  const evadeIdx = other.cards.findIndex((c: Card) => c.effect?.evade);
                  if (evadeIdx !== -1) {
                    other.cards.splice(evadeIdx, 1);
                    game.logs.push(`💨 ${other.name} Evaded the spike damage!`);
                    return;
                  }
                  const actualDmg = Math.max(0, dmg - armor);
                  if (actualDmg > 0) {
                    other.health -= actualDmg;
                    game.highlightedStats.push({ playerId: other.id, stat: 'health' });
                    if (other.health <= 0) {
                      game.logs.push(`💀 ${other.name} was killed by ${card.name}!`);
                      if (other.gameStats) other.gameStats.turnDied = game.history && game.history.length > 0 ? game.history[game.history.length - 1].turnNumber : 0;
                    }
                  }
                }
              });
            }
          }
          if (card.effect?.highAltitude) {
            const dmg = 3;
            Object.values(game.players).forEach(other => {
              if (other.health > 0) {
                const armor = other.cards.reduce((sum, c) => sum + (c.effect?.armor || 0), 0);
                const evadeIdx = other.cards.findIndex((c: Card) => c.effect?.evade);
                if (evadeIdx !== -1) {
                  other.cards.splice(evadeIdx, 1);
                  game.logs.push(`💨 ${other.name} Evaded High Altitude Bombing!`);
                  return;
                }
                const actualDmg = Math.max(0, dmg - armor);
                if (actualDmg > 0) {
                  other.health -= actualDmg;
                  game.highlightedStats.push({ playerId: other.id, stat: 'health' });
                  if (other.health <= 0) {
                    game.logs.push(`💀 ${other.name} was killed by High Altitude Bombing!`);
                    if (other.gameStats) other.gameStats.turnDied = game.history && game.history.length > 0 ? game.history[game.history.length - 1].turnNumber : 0;
                  }
                }
              }
            });
          }
          
          if (card.effect?.maxHealth) {
            player.maxHealth = (player.maxHealth || 10) + card.effect.maxHealth;
            game.logs.push(`${player.name} max health increased by ${card.effect.maxHealth}.`);
            game.highlightedStats.push({ playerId: player.id, stat: 'health' });
          }
          if (card.effect?.heal) {
            const actualHeal = Math.min(player.maxHealth || game.settings?.maxHealth || 10, player.health + card.effect.heal) - player.health;
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

