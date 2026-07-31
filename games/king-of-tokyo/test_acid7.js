"use strict";

// src/engine/reducer.ts
var import_boardgame_core2 = require("@erez/boardgame-core");

// src/engine/types.ts
var import_boardgame_core = require("@erez/boardgame-core");

// src/engine/cards/AmusementPark.ts
var AmusementPark = {
  id: "amusement_park",
  name: "Amusement Park",
  cost: 6,
  type: "Discard",
  description: "+4\u2B50",
  verified: true,
  onBuy: (st2, action, pId) => {
    st2.pendingActions.unshift({ type: "VP", payload: { amount: 4 }, playerId: pId });
    return st2;
  }
};

// src/engine/cards/Army.ts
var Army = {
  id: "army",
  name: "Army",
  cost: 2,
  type: "Discard",
  description: "+ 1\u2B50 and suffer 1 damage for each card you have.",
  verified: true,
  onBuy: (st2, action, pId) => {
    const cardCount = st2.players[pId].cards.length;
    if (cardCount > 0) {
      st2.pendingActions.unshift({ type: "TAKE_DAMAGE", payload: { amount: cardCount }, playerId: pId });
      st2.pendingActions.unshift({ type: "VP", payload: { amount: cardCount }, playerId: pId });
    }
    return st2;
  }
};

// src/engine/cards/Cannibalistic.ts
var Cannibalistic = {
  id: "cannibalistic",
  name: "Cannibalistic",
  cost: 5,
  type: "Keep",
  description: "When you do damage gain 1\u2764\uFE0F.",
  verified: true,
  onPostEvent: (st2, action, pId) => {
    if (action.type === "ATTACK" && action.playerId === pId && action.payload.damage > 0) {
      st2.pendingActions.unshift({ type: "HEALTH", payload: { amount: 1 }, playerId: pId });
    }
    return st2;
  }
};

// src/engine/utils.ts
var DICE_FACES = ["1", "2", "3", "Energy", "Heart", "Smash"];
function addLog(state, action, logStr) {
  let finalStr = logStr;
  if (action.affectedByCards && action.affectedByCards.length > 0) {
    const cardNames = action.affectedByCards.map((c) => {
      const card = CARD_REGISTRY[c.cardId];
      return `${card?.name || c.cardId}`;
    }).join(", ");
    finalStr += ` [${cardNames}]`;
  }
  state.logs.push(finalStr);
}
function getPlayerMaxHealth(state, playerId) {
  return state.players[playerId]?.maxHealth || state.settings.maxHealth;
}

// src/engine/cards/HighAltitudeBombing.ts
var HighAltitudeBombing = {
  id: "high_altitude_bombing",
  name: "High Altitude Bombing",
  cost: 4,
  type: "Discard",
  description: "All monsters (including you) take 3 damage.",
  verified: true,
  onBuy: (st2, action, pId) => {
    addLog(st2, action, `${st2.players[pId].name} used High Altitude Bombing! All monsters take 3 damage.`);
    const dmgActions = st2.playerOrder.map((id) => ({
      type: "TAKE_DAMAGE",
      playerId: id,
      payload: { amount: 3 }
    }));
    st2.pendingActions.unshift(...dmgActions);
    return st2;
  }
};

// src/engine/cards/ItHasAChild.ts
var ItHasAChild = {
  id: "it_has_a_child",
  name: "It Has a Child",
  cost: 7,
  type: "Keep",
  description: "If you are eliminated discard all your cards and markers, and lose all your \u2B50 and \u26A1. Heal to 10\u2764\uFE0F and start again.",
  verified: true,
  onPreEvent: (st2, action, pId) => {
    if (action.type === "DEAD" && action.playerId === pId) {
      addLog(st2, action, `\u{1F31F} ${st2.players[pId].name} used It Has a Child! They are reborn!`);
      st2.players[pId].health = st2.settings.maxHealth;
      st2.players[pId].vp = 0;
      st2.players[pId].energy = 0;
      st2.players[pId].cards = [];
      st2.players[pId].cardState = {};
      st2.players[pId].markers = {};
      st2.pendingActions.shift();
    }
    return st2;
  }
};

// src/engine/cards/JetFighters.ts
var JetFighters = {
  id: "jet_fighters",
  name: "Jet Fighters",
  cost: 5,
  type: "Discard",
  description: "+ 5\u2B50 and take 4 damage",
  verified: true,
  onBuy: (st2, action, pId) => {
    addLog(st2, action, `${st2.players[pId].name} used Jet Fighters!`);
    st2.pendingActions.unshift(
      { type: "VP", playerId: pId, payload: { amount: 5 } },
      { type: "TAKE_DAMAGE", playerId: pId, payload: { amount: 4 } }
    );
    return st2;
  }
};

// src/engine/cards/Jets.ts
var Jets = {
  id: "jets",
  name: "Jets",
  cost: 5,
  type: "Keep",
  description: "You suffer no damage when yielding Tokyo.",
  verified: true,
  onPreEvent: (st2, action, pId) => {
    if (action.type === "LOG_JETS" && action.playerId === pId) {
      addLog(st2, action, `\u{1F6E9}\uFE0F ${st2.players[pId].name} used Jets to avoid damage while yielding!`);
      action.type = "NOP";
      return st2;
    }
    if (action.type === "TAKE_DAMAGE" && action.playerId === pId && action.payload.yield_after) {
      st2.pendingActions.unshift({ type: "ASK", payload: {
        prompt: {
          playerId: pId,
          text: `Will you yield Tokyo to avoid damage?`,
          options: [
            { label: "Yield", action: { type: "RESPONSE_MULTIPLE_ACTIONS", payload: { actions: [
              { type: "LOG_JETS", playerId: pId },
              { type: "RESPONSE_YIELD", playerId: pId, payload: { yield: true, attackerId: action.payload.attackerId } }
            ] } } },
            { label: "Stay", action: { type: "RESPONSE_MULTIPLE_ACTIONS", payload: { actions: [
              { type: "RESPONSE_YIELD", playerId: pId, payload: { yield: false } },
              { type: "TAKE_DAMAGE", payload: { amount: action.payload.amount, yield_after: false }, playerId: pId }
            ] } } }
          ]
        }
      } });
      action.type = "NOP";
      return st2;
    }
    return st2;
  }
};

// src/engine/cards/MadeInALab.ts
var MadeInALab = {
  id: "made_in_a_lab",
  name: "Made in a Lab",
  cost: 2,
  type: "Keep",
  description: "When purchasing cards you can peek at and purchase the top card of the deck.",
  verified: true,
  onPreEvent: (st2, action, pId) => {
    if (action.type === "BUY_OR_SWEEP" && action.playerId === pId) {
      if (st2.deck.length > 0) {
        const otherExtras = (st2.turnContext.marketExtraCards || []).filter((e) => e.source !== "deck");
        st2.turnContext.marketExtraCards = [
          ...otherExtras,
          { cardId: st2.deck[0], source: "deck" }
        ];
      } else {
        st2.turnContext.marketExtraCards = (st2.turnContext.marketExtraCards || []).filter((e) => e.source !== "deck");
      }
    }
    return st2;
  }
};

// src/engine/cards/Metamorph.ts
var Metamorph = {
  id: "metamorph",
  name: "Metamorph",
  cost: 3,
  type: "Keep",
  description: "At the end of your turn you can discard any keep cards you have to receive the \u26A1 they were purchased for.",
  verified: true,
  onPreEvent: (st2, action, pId) => {
    if (action.type === "END_TURN" && pId === st2.playerOrder[st2.currentPlayerIndex]) {
      const keepCards = st2.players[pId].cards.filter((cId) => cId !== "metamorph");
      if (keepCards.length > 0) {
        st2.pendingActions.unshift({ type: "METAMORPH_PROMPT", playerId: pId });
      }
    }
    if (action.type === "METAMORPH_PROMPT" && action.playerId === pId) {
      const keepCards = st2.players[pId].cards;
      if (keepCards.length > 0) {
        const options = keepCards.map((cId) => {
          const c = CARD_REGISTRY[cId];
          return {
            label: `${c.name} (+${c.cost}\u26A1)`,
            action: {
              type: "RESPONSE_MULTIPLE_ACTIONS",
              payload: {
                actions: [
                  { type: "DISCARD", payload: { cardId: cId }, playerId: pId },
                  { type: "ENERGY", payload: { amount: c.cost }, playerId: pId },
                  { type: "METAMORPH_PROMPT", playerId: pId }
                ]
              }
            }
          };
        });
        options.push({ label: "Done", action: { type: "RESPONSE_NOP", playerId: pId } });
        st2.pendingActions.unshift({
          type: "ASK",
          playerId: pId,
          payload: {
            prompt: {
              playerId: pId,
              text: "Metamorph: Discard cards for Energy?",
              options
            }
          }
        });
      }
    }
    return st2;
  }
};

// src/engine/cards/Mimic.ts
var Mimic = {
  id: "mimic",
  name: "Mimic",
  cost: 8,
  type: "Keep",
  description: "Choose a card any monster has in play and put a mimic counter on it. This card counts as a duplicate of that card as if it just had been bought. Spend 1\u26A1 at the start of your turn to change the power you are mimicking.",
  verified: true,
  onBuy: (st2, action, pId) => {
    st2.pendingActions.unshift({ type: "MIMIC_PROMPT", playerId: pId });
    return st2;
  },
  onPreEvent: (st2, action, pId) => {
    if (action.type === "START_TURN" && action.playerId === pId && st2.players[pId].energy >= 1) {
      const allCards = [];
      st2.playerOrder.forEach((id) => {
        st2.players[id].cards.forEach((cId) => {
          if (cId !== "mimic") allCards.push({ cId, owner: id });
        });
      });
      if (allCards.length > 0) {
        st2.pendingActions.unshift({ type: "ASK", payload: {
          prompt: {
            playerId: pId,
            text: "Mimic: Spend 1\u26A1 to change the mimicked card?",
            options: [
              { label: "Yes (1\u26A1)", action: { type: "RESPONSE_MIMIC_PROMPT_CHANGE", playerId: pId } },
              { label: "No", action: { type: "RESPONSE_NOP", playerId: pId } }
            ]
          }
        } });
      }
    }
    if ((action.type === "MIMIC_PROMPT" || action.type === "MIMIC_PROMPT_CHANGE" || action.type === "RESPONSE_MIMIC_PROMPT_CHANGE") && action.playerId === pId) {
      if (action.type === "MIMIC_PROMPT_CHANGE" || action.type === "RESPONSE_MIMIC_PROMPT_CHANGE") {
        if (st2.players[pId].energy < 1) return st2;
        st2.players[pId].energy -= 1;
      }
      const allCards = [];
      const seenCards = /* @__PURE__ */ new Set();
      st2.playerOrder.forEach((id) => {
        if (id !== pId) {
          st2.players[id].cards.forEach((cId) => {
            if (cId !== "mimic" && !seenCards.has(cId)) {
              allCards.push({ cId, owner: id });
              seenCards.add(cId);
            }
          });
        }
      });
      if (allCards.length === 0) {
        addLog(st2, action, `\u{1F3AD} ${st2.players[pId].name} has no cards to mimic!`);
        if (st2.players[pId].cardState) {
          st2.players[pId].cardState["mimic"] = void 0;
        }
      } else {
        const options = allCards.map((c) => ({
          label: CARD_REGISTRY[c.cId].name,
          action: { type: "RESPONSE_MIMIC_SET", payload: { cardId: c.cId } }
        }));
        st2.pendingActions.unshift({ type: "ASK", payload: {
          prompt: {
            playerId: pId,
            text: "Choose a card to Mimic:",
            options
          }
        } });
      }
    }
    if ((action.type === "MIMIC_SET" || action.type === "RESPONSE_MIMIC_SET") && action.playerId === pId) {
      const targetId = action.payload.cardId;
      st2.players[pId].cardState = st2.players[pId].cardState || {};
      st2.players[pId].cardState["mimic"] = targetId;
      addLog(st2, action, `\u{1F3AD} ${st2.players[pId].name} is now mimicking ${CARD_REGISTRY[targetId].name}!`);
      const targetCard = CARD_REGISTRY[targetId];
      if (targetCard && targetCard.onBuy) {
        targetCard.onBuy(st2, action, pId);
      }
    }
    const mimickedId = st2.players[pId].cardState?.["mimic"];
    if (mimickedId && CARD_REGISTRY[mimickedId] && CARD_REGISTRY[mimickedId].onPreEvent) {
      CARD_REGISTRY[mimickedId].onPreEvent(st2, action, pId);
    }
    return st2;
  },
  onPostEvent: (st2, action, pId) => {
    const mimickedId = st2.players[pId].cardState?.["mimic"];
    if (mimickedId && CARD_REGISTRY[mimickedId] && CARD_REGISTRY[mimickedId].onPostEvent) {
      CARD_REGISTRY[mimickedId].onPostEvent(st2, action, pId);
    }
    return st2;
  },
  getLabel: (st2, pId) => {
    const mimickedId = st2.players[pId].cardState?.["mimic"];
    if (mimickedId && CARD_REGISTRY[mimickedId]) {
      const baseLabel = CARD_REGISTRY[mimickedId].name;
      const extraLabel = CARD_REGISTRY[mimickedId].getLabel ? CARD_REGISTRY[mimickedId].getLabel(st2, pId) : void 0;
      return extraLabel ? `${baseLabel} (${extraLabel})` : baseLabel;
    }
    return "Empty";
  }
};

// src/engine/cards/MonsterBatteries.ts
var MonsterBatteries = {
  id: "monster_batteries",
  name: "Monster Batteries",
  cost: 2,
  type: "Keep",
  description: "When you purchase this put as many \u26A1 as you want on it from your reserve. Match this from the bank. At the start of each turn take 2\u26A1 off and add them to your reserve. When there are no \u26A1 left discard this card.",
  verified: true,
  onBuy: (st2, action, pId) => {
    st2.pendingActions.unshift({ type: "MONSTER_BATTERIES_PROMPT", playerId: pId });
    return st2;
  },
  onPreEvent: (st2, action, pId) => {
    if (action.type === "MONSTER_BATTERIES_PROMPT" && action.playerId === pId) {
      const energy = st2.players[pId].energy;
      const options = [];
      for (let i = 0; i <= energy; i++) {
        options.push({
          label: `${i}`,
          action: { type: "RESPONSE_MONSTER_BATTERIES_SET", payload: { amount: i } }
        });
      }
      st2.pendingActions.unshift({ type: "ASK", payload: {
        prompt: {
          playerId: pId,
          text: "How much Energy to put on Monster Batteries?",
          options
        }
      } });
    }
    if ((action.type === "MONSTER_BATTERIES_SET" || action.type === "RESPONSE_MONSTER_BATTERIES_SET") && action.playerId === pId) {
      const amount = action.payload.amount;
      let updatedCards = st2.players[pId].cards;
      if (amount === 0) {
        updatedCards = updatedCards.filter((c) => c !== "monster_batteries");
        addLog(st2, action, `Monster Batteries is empty and discarded!`);
      } else {
        addLog(st2, action, `\u{1F50B} ${st2.players[pId].name} put ${amount}\u26A1 on Monster Batteries, doubled to ${amount * 2}\u26A1!`);
      }
      st2.players[pId] = {
        ...st2.players[pId],
        energy: st2.players[pId].energy - amount,
        cards: updatedCards,
        cardState: {
          ...st2.players[pId].cardState,
          "monster_batteries": amount * 2
        }
      };
    }
    if (action.type === "START_TURN" && action.playerId === pId) {
      let bat = st2.players[pId].cardState?.["monster_batteries"] || 0;
      if (bat > 0) {
        const take = Math.min(2, bat);
        bat -= take;
        st2.players[pId] = {
          ...st2.players[pId],
          cardState: {
            ...st2.players[pId].cardState,
            "monster_batteries": bat
          }
        };
        st2.pendingActions.unshift({ type: "ENERGY", payload: { amount: take }, playerId: pId });
        addLog(st2, action, `\u{1F50B} ${st2.players[pId].name} took ${take}\u26A1 from Monster Batteries (${bat}\u26A1 remaining).`);
        if (bat === 0) {
          st2.players[pId] = {
            ...st2.players[pId],
            cards: st2.players[pId].cards.filter((c) => c !== "monster_batteries")
          };
          addLog(st2, action, `\u{1F50B} Monster Batteries is empty and discarded!`);
        }
      }
    }
    return st2;
  },
  getLabel: (st2, pId) => {
    const bat = st2.players[pId].cardState?.["monster_batteries"];
    if (bat !== void 0) {
      return `${bat}\u26A1`;
    }
    return void 0;
  }
};

// src/engine/cards/NationalGuard.ts
var NationalGuard = {
  id: "national_guard",
  name: "National Guard",
  cost: 3,
  type: "Discard",
  description: "+2\u2B50 and take 2 damage.",
  verified: true,
  onBuy: (st2, action, pId) => {
    st2.pendingActions.unshift(
      { type: "TAKE_DAMAGE", payload: { amount: 2 }, playerId: pId },
      { type: "VP", payload: { amount: 2 }, playerId: pId }
    );
    return st2;
  }
};

// src/engine/cards/NovaBreath.ts
var NovaBreath = {
  id: "nova_breath",
  name: "Nova Breath",
  cost: 7,
  type: "Keep",
  description: "Your attacks damage all other monsters.",
  verified: true,
  onPreEvent: (st2, action, pId) => {
    if (action.type === "ATTACK" && action.playerId === pId) {
      const damage = action.payload.damage;
      addLog(st2, action, `${st2.players[pId].name} attacks for ${damage} everywhere! (Nova Breath)`);
      const actionsToPush = [];
      const tokyoPlayers = st2.playerOrder.filter((id) => st2.players[id].location === "TokyoCity" && st2.players[id].health > 0);
      if (st2.players[pId].location === "Outside" && tokyoPlayers.length === 0) {
        actionsToPush.push({ type: "ENTER_TOKYO", playerId: pId });
      }
      st2.playerOrder.forEach((tId) => {
        if (tId !== pId && st2.players[tId].health > 0) {
          const isTokyo = st2.players[tId].location === "TokyoCity";
          actionsToPush.push({ type: "TAKE_DAMAGE", payload: { amount: damage, yield_after: isTokyo && st2.players[pId].location === "Outside", attackerId: pId }, playerId: tId });
        }
      });
      action.type = "NOP";
      st2.pendingActions = [...actionsToPush, ...st2.pendingActions];
    }
    return st2;
  }
};

// src/engine/cards/NuclearPowerPlant.ts
var NuclearPowerPlant = {
  id: "nuclear_power_plant",
  name: "Nuclear Power Plant",
  cost: 6,
  type: "Discard",
  description: "+2\u2B50 and heal 3 damage.",
  verified: true,
  onBuy: (st2, action, pId) => {
    st2.pendingActions.unshift(
      { type: "HEALTH", payload: { amount: 3 }, playerId: pId },
      { type: "VP", payload: { amount: 2 }, playerId: pId }
    );
    return st2;
  }
};

// src/engine/cards/Omnivore.ts
var Omnivore = {
  id: "omnivore",
  name: "Omnivore",
  cost: 4,
  type: "Keep",
  description: "Once each turn you can score 1\uFE0F\u20E32\uFE0F\u20E33\uFE0F\u20E3 for 2\u2B50. You can use these dice in other combinations.",
  verified: true,
  onPostEvent: (st2, action, pId) => {
    if (action.type === "RESOLVE_ROLLS" && action.playerId === pId) {
      const outcomeMap = {};
      st2.dice.forEach((d) => {
        outcomeMap[d.value] = (outcomeMap[d.value] || 0) + 1;
      });
      if (outcomeMap["1"] >= 1 && outcomeMap["2"] >= 1 && outcomeMap["3"] >= 1) {
        st2.pendingActions.unshift({ type: "VP", payload: { amount: 2 }, playerId: pId });
      }
    }
    return st2;
  }
};

// src/engine/cards/Opportunist.ts
var Opportunist = {
  id: "opportunist",
  name: "Opportunist",
  cost: 3,
  type: "Keep",
  description: "Whenever a new card is revealed, you have the option of buying it as soon as it is revealed.",
  verified: true,
  onPostEvent: (st2, action, pId) => {
    if (action.type === "CARD_REVEALED") {
      const cardId = action.payload.cardId;
      const marketIndex = action.payload.marketIndex;
      const owner = st2.players[pId];
      const cardDef = CARD_REGISTRY[cardId];
      if (!cardDef) return st2;
      const cost = cardDef.cost;
      if (owner.energy >= cost && (!owner.cards.includes(cardId) || cardId === "mimic")) {
        st2.pendingActions.unshift({ type: "CHECK_OPPORTUNIST", playerId: pId, payload: { cardId, marketIndex, cost } });
      }
    }
    return st2;
  },
  onPreEvent: (st2, action, pId) => {
    if (action.type === "CHECK_OPPORTUNIST" && action.playerId === pId) {
      const cardId = action.payload.cardId;
      const marketIndex = action.payload.marketIndex;
      const cost = action.payload.cost;
      const cardDef = CARD_REGISTRY[cardId];
      if (st2.market[marketIndex] === cardId && st2.players[pId].energy >= cost && (!st2.players[pId].cards.includes(cardId) || cardId === "mimic")) {
        if (st2.playerOrder[st2.currentPlayerIndex] === pId) {
          action.type = "NOP";
          return st2;
        }
        action.type = "ASK";
        action.payload = {
          prompt: {
            playerId: pId,
            text: `Opportunist: Buy ${cardDef.name}?`,
            options: [
              { label: `Buy for ${cost} \u26A1`, action: { type: "RESPONSE_MULTIPLE_ACTIONS", payload: { actions: [{ type: "BUY", payload: { cardId, marketIndex, source: "market" }, playerId: pId }] }, playerId: pId } },
              { label: "Decline", action: { type: "RESPONSE_NOP", payload: {} } }
            ]
          }
        };
      } else {
        action.type = "NOP";
      }
    }
    return st2;
  }
};

// src/engine/cards/PoisonQuills.ts
var PoisonQuills = {
  id: "poison_quills",
  name: "Poison Quills",
  cost: 3,
  type: "Keep",
  description: "When you score 2\uFE0F\u20E32\uFE0F\u20E32\uFE0F\u20E3 also deal 2 damage.",
  verified: true,
  onPostEvent: (st2, action, pId) => {
    if (action.type === "RESOLVE_ROLLS" && action.playerId === pId) {
      const outcomeMap = {};
      st2.dice.forEach((d) => {
        outcomeMap[d.value] = (outcomeMap[d.value] || 0) + 1;
      });
      if (outcomeMap["2"] >= 3) {
        st2.pendingActions.unshift({ type: "ATTACK", payload: { damage: 2 }, playerId: pId });
      }
    }
    return st2;
  }
};

// src/engine/cards/PoisonSpit.ts
var PoisonSpit = {
  id: "poison_spit",
  name: "Poison Spit",
  cost: 4,
  type: "Keep",
  description: "When you deal damage to monsters give them a poison counter. Monsters take 1 damage for each poison counter they have at the end of their turn. You can get rid of a poison counter with a \u2764\uFE0F (that \u2764\uFE0F doesn't heal a damage also).",
  verified: true,
  onPreEvent: (st2, action, pId) => {
    if (action.type === "HEALTH" && action.payload.amount > 0 && action.playerId) {
      const targetId = action.playerId;
      const counters = st2.players[targetId]?.markers?.["poison"] || 0;
      if (counters > 0) {
        const cured = Math.min(counters, action.payload.amount);
        st2.players[targetId].markers["poison"] -= cured;
        action.payload.amount -= cured;
        addLog(st2, action, `\u{1F9EA} ${st2.players[targetId].name} spent ${cured} \u2764\uFE0F to cure poison!`);
      }
    }
    return st2;
  },
  onPostEvent: (st2, action, pId) => {
    if (action.type === "TAKE_DAMAGE" && action.payload.attackerId === pId && action.payload.amount > 0) {
      const targetId = action.playerId;
      if (st2.players[targetId] && st2.players[targetId].health > 0) {
        st2.players[targetId].markers = st2.players[targetId].markers || {};
        st2.players[targetId].markers["poison"] = (st2.players[targetId].markers["poison"] || 0) + 1;
        addLog(st2, action, `\u2620\uFE0F ${st2.players[targetId].name} gets a Poison counter from Poison Spit!`);
      }
    }
    return st2;
  }
};

// src/engine/cards/Regeneration.ts
var Regeneration = {
  id: "regeneration",
  name: "Regeneration",
  cost: 4,
  type: "Keep",
  description: "When you heal, heal 1 extra damage.",
  verified: true,
  onPreEvent: (st2, action, pId) => {
    if (action.type === "HEALTH" && action.playerId === pId && action.payload.amount > 0) {
      action.payload.amount += 1;
      action.payload.reason = "Regeneration";
    }
    return st2;
  }
};

// src/engine/cards/Skyscraper.ts
var Skyscraper = {
  id: "skyscraper",
  name: "Skyscraper",
  cost: 6,
  type: "Discard",
  description: "+4\u2B50",
  verified: true,
  onBuy: (st2, action, pId) => {
    st2.pendingActions.unshift({ type: "VP", payload: { amount: 4 }, playerId: pId });
    return st2;
  }
};

// src/engine/cards/SolarPowered.ts
var SolarPowered = {
  id: "solar_powered",
  name: "Solar Powered",
  cost: 2,
  type: "Keep",
  description: "At the end of your turn gain 1\u26A1 if you have no \u26A1.",
  verified: true,
  onPreEvent: (st2, action, pId) => {
    if (action.type === "END_TURN" && action.playerId === pId) {
      if (st2.players[pId].energy === 0) {
        st2.pendingActions.unshift({ type: "ENERGY", payload: { amount: 1 }, playerId: pId });
      }
    }
    return st2;
  }
};

// src/engine/cards/SpikedTail.ts
var SpikedTail = {
  id: "spiked_tail",
  name: "Spiked Tail",
  cost: 5,
  type: "Keep",
  description: "When you attack deal 1 extra damage.",
  verified: true,
  onPreEvent: (st2, action, pId) => {
    if (action.type === "ATTACK" && action.playerId === pId && action.payload.damage > 0) {
      action.payload.damage += 1;
      action.payload.reason = action.payload.reason ? action.payload.reason + ", Spiked Tail" : "Spiked Tail";
    }
    return st2;
  }
};

// src/engine/cards/Tanks.ts
var Tanks = {
  id: "tanks",
  name: "Tanks",
  cost: 4,
  type: "Discard",
  description: "+4\u2B50 and take 3 damage.",
  verified: true,
  onBuy: (st2, action, pId) => {
    st2.pendingActions.unshift(
      { type: "TAKE_DAMAGE", payload: { amount: 3 }, playerId: pId },
      { type: "VP", payload: { amount: 4 }, playerId: pId }
    );
    return st2;
  }
};

// src/engine/cards/ThrowATanker.ts
var ThrowATanker = {
  id: "throw_a_tanker",
  name: "Throw a Tanker",
  cost: 4,
  type: "Keep",
  description: "On a turn you deal 3 or more damage gain 2\u2B50.",
  verified: true,
  onPostEvent: (st2, action, pId) => {
    if (action.type === "ATTACK" && action.playerId === pId && action.payload.damage >= 3) {
      st2.pendingActions.unshift({ type: "VP", payload: { amount: 2 }, playerId: pId });
    }
    return st2;
  }
};

// src/engine/cards/Urbavore.ts
var Urbavore = {
  id: "urbavore",
  name: "Urbavore",
  cost: 4,
  type: "Keep",
  description: "Gain 1 extra \u2B50 when beginning the turn in Tokyo. Deal 1 extra damage when dealing any damage from Tokyo.",
  verified: true,
  onPreEvent: (st2, action, pId) => {
    if (action.type === "ATTACK" && action.playerId === pId && action.payload.damage > 0) {
      if (st2.players[pId].location.startsWith("Tokyo")) {
        action.payload.damage += 1;
        action.payload.reason = action.payload.reason ? action.payload.reason + ", Urbavore" : "Urbavore";
      }
    }
    return st2;
  },
  onPostEvent: (st2, action, pId) => {
    if (action.type === "START_TURN" && action.playerId === pId) {
      if (st2.players[pId].location.startsWith("Tokyo")) {
        st2.pendingActions.unshift({ type: "VP", payload: { amount: 1 }, playerId: pId });
      }
    }
    return st2;
  }
};

// src/engine/cards/AlienMetabolism.ts
var AlienMetabolism = {
  id: "alien_metabolism",
  name: "Alien Metabolism",
  cost: 3,
  type: "Keep",
  description: "Buying cards costs you 1 less \u26A1.",
  verified: true,
  onPostEvent: (st2, action, pId) => {
    if (action.type === "GO_TO_MARKET" && action.playerId === pId) {
      st2.turnContext = st2.turnContext || {};
      st2.turnContext.buyDiscount = (st2.turnContext.buyDiscount || 0) + 1;
      addLog(st2, action, `${st2.players[pId].name} gets a 1\u26A1 discount on cards due to Alien Metabolism.`);
    }
    return st2;
  },
  onBuy: (st2, action, pId) => {
    st2.turnContext = st2.turnContext || {};
    st2.turnContext.buyDiscount = (st2.turnContext.buyDiscount || 0) + 1;
    addLog(st2, action, `${st2.players[pId].name} gets a 1\u26A1 discount on cards immediately from Alien Metabolism!`);
    return st2;
  }
};

// src/engine/cards/DropFromHighAltitude.ts
var DropFromHighAltitude = {
  id: "drop_from_high_altitude",
  name: "Drop from High Altitude",
  cost: 5,
  type: "Discard",
  description: "+ 2\u2B50 and take control of Tokyo. If someone is already there, they still take no damage.",
  verified: true,
  onBuy: (st2, action, pId) => {
    st2.pendingActions.unshift({ type: "VP", payload: { amount: 2 }, playerId: pId });
    const tokyoOccupant = st2.playerOrder.find((id) => st2.players[id].location === "TokyoCity");
    if (tokyoOccupant && tokyoOccupant !== pId) {
      st2.pendingActions.unshift({ type: "RESPONSE_YIELD", payload: { yield: true, attackerId: pId }, playerId: tokyoOccupant });
    } else if (!tokyoOccupant) {
      st2.pendingActions.unshift({ type: "ENTER_TOKYO", payload: {}, playerId: pId });
    }
    return st2;
  }
};

// src/engine/cards/Energize.ts
var Energize = {
  id: "energize",
  name: "Energize",
  cost: 8,
  type: "Discard",
  description: "+ 9\u26A1",
  verified: true,
  onBuy: (st2, action, pId) => {
    st2.pendingActions.unshift({ type: "ENERGY", payload: { amount: 9 }, playerId: pId });
    return st2;
  }
};

// src/engine/cards/Wings.ts
var Wings = {
  id: "wings",
  name: "Wings",
  cost: 6,
  type: "Keep",
  description: "When you take damage, you can spend 2\u26A1 to ignore it.",
  verified: true,
  onPreEvent: (st2, action, pId) => {
    if (action.type === "TAKE_DAMAGE" && action.playerId === pId && action.payload.amount > 0 && st2.players[pId].energy >= 2) {
      if (!action.payload._wingsPrompted) {
        action.payload._wingsPrompted = true;
        st2.pendingActions.unshift({
          type: "ASK",
          playerId: pId,
          payload: {
            prompt: {
              playerId: pId,
              text: `Wings: Spend 2\u26A1 to evade all damage? (Taking ${action.payload.amount})`,
              options: [
                { label: "Yes", action: { type: "RESPONSE_WINGS", playerId: pId, payload: { originalAction: action } } },
                { label: "No", action: { type: "RESPONSE_WINGS_NO", playerId: pId, payload: { originalAction: action } } }
              ]
            }
          }
        });
        const index = st2.pendingActions.findIndex((a) => a === action);
        if (index !== -1) st2.pendingActions.splice(index, 1);
      }
    }
    if (action.type === "RESPONSE_WINGS" && action.playerId === pId) {
      const orig = action.payload.originalAction;
      st2.pendingActions.unshift(
        { ...orig, payload: { ...orig.payload, amount: 0 }, affectedByCards: [{ cardId: "wings", playerId: pId }] }
      );
      st2.pendingActions.unshift(
        { type: "ENERGY", playerId: pId, payload: { amount: -2 }, affectedByCards: [{ cardId: "wings", playerId: pId }] }
      );
    }
    if (action.type === "RESPONSE_WINGS_NO" && action.playerId === pId) {
      st2.pendingActions.unshift({ ...action.payload.originalAction, affectedByCards: action.payload.originalAction.affectedByCards || [] });
    }
    return st2;
  }
};

// src/engine/cards/ExtraHead.ts
var ExtraHead = {
  id: "extra_head",
  name: "Extra Head",
  cost: 7,
  type: "Keep",
  description: "You get 1 extra die.",
  verified: true,
  onPostEvent: (st2, action, pId) => {
    if (action.type === "SETUP_DICE" && action.playerId === pId) {
      st2.dice.push({ id: `d${st2.dice.length}`, value: "1", kept: false });
      addLog(st2, action, `${st2.players[pId].name} rolls an extra die thanks to their Extra Head!`);
    }
    return st2;
  }
};

// src/engine/cards/Frenzy.ts
var Frenzy = {
  id: "frenzy",
  name: "Frenzy",
  cost: 7,
  type: "Discard",
  description: "When you purchase this card, take another turn immediately after this one.",
  verified: true,
  onBuy: (st2, action, pId) => {
    st2.players[pId].markers = st2.players[pId].markers || {};
    st2.players[pId].markers.extra_turn = (st2.players[pId].markers.extra_turn || 0) + 1;
    addLog(st2, action, `${st2.players[pId].name} gains an extra turn after this one!`);
    return st2;
  }
};

// src/engine/cards/GasRefinery.ts
var GasRefinery = {
  id: "gas_refinery",
  name: "Gas Refinery",
  cost: 6,
  type: "Discard",
  description: "+ 2\u2B50 and all other monsters take 3 damage.",
  verified: true,
  onBuy: (st2, action, pId) => {
    st2.pendingActions.unshift({ type: "VP", payload: { amount: 2 }, playerId: pId });
    st2.playerOrder.forEach((id) => {
      if (id !== pId && st2.players[id].health > 0) {
        st2.pendingActions.unshift({ type: "TAKE_DAMAGE", payload: { amount: 3 }, playerId: id });
      }
    });
    return st2;
  }
};

// src/engine/cards/GiantBrain.ts
var GiantBrain = {
  id: "giant_brain",
  name: "Giant Brain",
  cost: 5,
  type: "Keep",
  description: "You get 1 extra reroll.",
  verified: true,
  onPostEvent: (st2, action, pId) => {
    if (action.type === "SETUP_DICE" && action.playerId === pId) {
      st2.maxRolls = (st2.maxRolls || 3) + 1;
      st2.rollCount = st2.maxRolls;
      addLog(st2, action, `${st2.players[pId].name} gets an extra reroll thanks to their Giant Brain!`);
    }
    return st2;
  }
};

// src/engine/cards/HealCard.ts
var HealCard = {
  id: "heal",
  name: "Heal",
  cost: 3,
  type: "Discard",
  description: "Heal 2 damage.",
  verified: true,
  onBuy: (st2, action, pId) => {
    st2.pendingActions.unshift({ type: "HEALTH", payload: { amount: 2 }, playerId: pId });
    return st2;
  }
};

// src/engine/cards/WeAreOnlyMakingItStronger.ts
var WeAreOnlyMakingItStronger = {
  id: "were_only_making_it_stronger",
  name: "We're Only Making it Stronger",
  cost: 3,
  type: "Keep",
  description: "When you lose 2\u2764\uFE0F or more, gain 1\u26A1.",
  verified: true,
  onPostEvent: (st2, action, pId) => {
    if (action.type === "TAKE_DAMAGE" && action.playerId === pId) {
      if (action.payload._actualDamageTaken >= 2) {
        st2.pendingActions.unshift({ type: "ENERGY", payload: { amount: 1 }, playerId: pId });
      }
    }
    return st2;
  }
};

// src/engine/cards/AlphaMonster.ts
var AlphaMonster = {
  id: "alpha_monster",
  name: "Alpha Monster",
  cost: 5,
  type: "Keep",
  description: "Gain 1\u2B50 when you attack.",
  verified: true,
  onPreEvent: (st2, action, pId) => {
    if (action.type === "ATTACK" && action.playerId === pId && action.payload.damage > 0) {
      if (!action.payload._alphaMonsterTriggered) {
        action.payload._alphaMonsterTriggered = true;
        st2.pendingActions.unshift({ type: "VP", payload: { amount: 1 }, playerId: pId });
      }
    }
    return st2;
  }
};

// src/engine/cards/ArmorPlating.ts
var ArmorPlating = {
  id: "armor_plating",
  name: "Armor Plating",
  cost: 4,
  type: "Keep",
  description: "Ignore damage of 1.",
  verified: true,
  onPreEvent: (st2, action, pId) => {
    if (action.type === "TAKE_DAMAGE" && action.playerId === pId && action.payload.amount === 1) {
      action.payload.amount = 0;
      action.affectedByCards = [...action.affectedByCards || [], { cardId: "armor_plating", playerId: pId }];
    }
    return st2;
  }
};

// src/engine/cards/Camouflage.ts
var Camouflage = {
  id: "camouflage",
  name: "Camouflage",
  cost: 3,
  type: "Keep",
  description: "If you take damage, roll a die for each damage point. On a \u2764\uFE0F result, you do not take that damage point.",
  verified: false,
  onPreEvent: (st2, action, pId) => {
    if (action.type === "TAKE_DAMAGE" && action.playerId === pId && action.payload.amount > 0) {
      if (action.payload._camouflagePrompted) {
        return st2;
      }
      action.payload._camouflagePrompted = true;
      const faces = ["1", "2", "3", "Heart", "Attack", "Energy"];
      let heartsRolled = 0;
      for (let i = 0; i < action.payload.amount; i++) {
        const faceIndex = Math.floor(Math.random() * 6);
        if (faces[faceIndex] === "Heart") heartsRolled++;
      }
      if (heartsRolled > 0) {
        action.payload.amount = Math.max(0, action.payload.amount - heartsRolled);
        action.affectedByCards = [...action.affectedByCards || [], { cardId: "camouflage", playerId: pId }];
        addLog(st2, action, `${st2.players[pId].name} rolled ${heartsRolled} \u2764\uFE0F with Camouflage and ignored ${heartsRolled} damage!`);
      } else {
        addLog(st2, action, `${st2.players[pId].name} used Camouflage but rolled no \u2764\uFE0F!`);
      }
    }
    return st2;
  }
};

// src/engine/cards/CommuterTrain.ts
var CommuterTrain = {
  id: "commuter_train",
  name: "Commuter Train",
  cost: 4,
  type: "Discard",
  description: "+ 2\u2B50",
  verified: true,
  onBuy: (st2, action, pId) => {
    st2.pendingActions.unshift({ type: "VP", payload: { amount: 2 }, playerId: pId });
    return st2;
  }
};

// src/engine/cards/CompleteDestruction.ts
var CompleteDestruction = {
  id: "complete_destruction",
  name: "Complete Destruction",
  cost: 3,
  type: "Keep",
  description: "If you roll 1, 2, 3, \u2764\uFE0F, \u{1F4A5}, and \u26A1 gain 9\u2B50.",
  verified: true,
  onPostEvent: (st2, action, pId) => {
    if (action.type === "RESOLVE_ROLLS" && action.playerId === pId) {
      const faces = new Set(st2.dice.map((d) => d.value));
      if (faces.size === 6) {
        st2.pendingActions.unshift({ type: "VP", payload: { amount: 9 }, playerId: pId });
      }
    }
    return st2;
  }
};

// src/engine/cards/CornerStore.ts
var CornerStore = {
  id: "corner_store",
  name: "Corner Store",
  cost: 3,
  type: "Discard",
  description: "+ 1\u2B50",
  verified: true,
  onBuy: (st2, action, pId) => {
    st2.pendingActions.unshift({ type: "VP", payload: { amount: 1 }, playerId: pId });
    return st2;
  }
};

// src/engine/cards/DedicatedNewsTeam.ts
var DedicatedNewsTeam = {
  id: "dedicated_news_team",
  name: "Dedicated News Team",
  cost: 3,
  type: "Keep",
  description: "Gain 1\u2B50 whenever you buy a card.",
  verified: true,
  onPostEvent: (st2, action, pId) => {
    if (action.type === "BUY" && action.playerId === pId) {
      st2.pendingActions.unshift({ type: "VP", payload: { amount: 1 }, playerId: pId });
    }
    return st2;
  }
};

// src/engine/cards/EaterOfTheDead.ts
var EaterOfTheDead = {
  id: "eater_of_the_dead",
  name: "Eater of the Dead",
  cost: 4,
  type: "Keep",
  description: "Gain 3\u2B50 every time a monster reaches 0\u2764\uFE0F.",
  verified: true,
  onPreEvent: (st2, action, pId) => {
    if (action.type === "DEAD") {
      st2.pendingActions.unshift({ type: "VP", payload: { amount: 3 }, playerId: pId });
    }
    return st2;
  }
};

// src/engine/cards/EvenBigger.ts
var EvenBigger = {
  id: "even_bigger",
  name: "Even Bigger",
  cost: 4,
  type: "Keep",
  description: "Your maximum Health is increased by 2. Gain 2\u2764\uFE0F when you buy this card.",
  verified: true,
  onBuy: (st2, action, pId) => {
    st2.players[pId].maxHealth = (st2.players[pId].maxHealth || 10) + 2;
    st2.pendingActions.unshift({ type: "HEALTH", payload: { amount: 2 }, playerId: pId });
    return st2;
  }
};

// src/engine/cards/RootingForTheUnderdog.ts
var RootingForTheUnderdog = {
  id: "rooting_for_the_underdog",
  name: "Rooting for the Underdog",
  cost: 3,
  type: "Keep",
  description: "At the end of your turn, if you have the fewest \u2B50, gain 1\u2B50.",
  verified: true,
  onPreEvent: (st2, action, pId) => {
    if (action.type === "END_TURN" && action.playerId === pId) {
      const myVp = st2.players[pId].vp;
      const otherVps = Object.values(st2.players).filter((p) => p.id !== pId && p.health > 0).map((p) => p.vp);
      const isFewest = otherVps.length > 0 && otherVps.every((vp) => myVp < vp);
      if (isFewest) {
        st2.pendingActions.unshift({ type: "VP", payload: { amount: 1 }, playerId: pId });
      }
    }
    return st2;
  }
};

// src/engine/cards/FriendOfChildren.ts
var FriendOfChildren = {
  id: "friend_of_children",
  name: "Friend of Children",
  cost: 3,
  type: "Keep",
  description: "When you gain \u26A1, gain 1 extra \u26A1.",
  verified: true,
  onPreEvent: (st2, action, pId) => {
    if (action.type === "ENERGY" && action.playerId === pId && action.payload.amount > 0 && !action.affectedByCards?.some((c) => c.cardId === "friend_of_children")) {
      action.payload.amount += 1;
      action.affectedByCards = [...action.affectedByCards || [], { cardId: "friend_of_children", playerId: pId }];
    }
    return st2;
  }
};

// src/engine/cards/Gourmet.ts
var Gourmet = {
  id: "gourmet",
  name: "Gourmet",
  cost: 4,
  type: "Keep",
  description: "When you heal 2 or more \u2764\uFE0F at once, gain 1\u2B50.",
  verified: true,
  onPostEvent: (st2, action, pId) => {
    if (action.type === "HEALTH" && action.playerId === pId && action.payload.amount >= 2) {
      st2.pendingActions.unshift({ type: "VP", payload: { amount: 1 }, playerId: pId });
    }
    return st2;
  }
};

// src/engine/cards/EnergyHoarder.ts
var EnergyHoarder = {
  id: "energy_hoarder",
  name: "Energy Hoarder",
  cost: 3,
  type: "Keep",
  description: "You gain 1\u2B50 for every 6\u26A1 you have at the end of your turn.",
  verified: true,
  onPreEvent: (st2, action, pId) => {
    if (action.type === "END_TURN" && action.playerId === pId) {
      const vps = Math.floor(st2.players[pId].energy / 6);
      if (vps > 0) {
        st2.pendingActions.unshift({ type: "VP", payload: { amount: vps }, playerId: pId });
      }
    }
    return st2;
  }
};

// src/engine/cards/EvacuationOrders.ts
var EvacuationOrders = {
  id: "evacuation_orders",
  name: "Evacuation Orders",
  cost: 7,
  type: "Discard",
  description: "All other monsters lose 5\u2B50.",
  verified: true,
  onBuy: (st2, action, pId) => {
    st2.playerOrder.forEach((id) => {
      if (id !== pId && st2.players[id].health > 0) {
        const amount = Math.min(st2.players[id].vp, 5);
        if (amount > 0) {
          st2.pendingActions.unshift({ type: "VP", payload: { amount: -amount }, playerId: id });
        }
      }
    });
    return st2;
  }
};

// src/engine/cards/UrbanLegend.ts
var UrbanLegend = {
  id: "urban_legend",
  name: "Urban Legend",
  cost: 4,
  type: "Keep",
  description: "When you gain \u2B50, gain 1 extra \u2B50.",
  verified: true,
  onPreEvent: (st2, action, pId) => {
    if (action.type === "VP" && action.playerId === pId && action.payload.amount > 0 && !action.affectedByCards?.some((c) => c.cardId === "urban_legend")) {
      action.payload.amount += 1;
      action.affectedByCards = [...action.affectedByCards || [], { cardId: "urban_legend", playerId: pId }];
    }
    return st2;
  }
};

// src/engine/cards/ElectricArmor.ts
var ElectricArmor = {
  id: "electric_armor",
  name: "Electric Armor",
  cost: 4,
  type: "Keep",
  description: "When you take damage, you can spend 1\u26A1 to reduce it by 1.",
  verified: true,
  onPreEvent: (st2, action, pId) => {
    if (action.type === "TAKE_DAMAGE" && action.playerId === pId && action.payload.amount > 0 && st2.players[pId].energy >= 1) {
      if (!action.payload._electricArmorPrompted) {
        action.payload._electricArmorPrompted = true;
        st2.pendingActions.unshift({
          type: "ASK",
          playerId: pId,
          payload: {
            prompt: {
              playerId: pId,
              text: `Electric Armor: Spend 1\u26A1 to reduce damage by 1? (Taking ${action.payload.amount})`,
              options: [
                { label: "Yes", action: { type: "RESPONSE_ELECTRIC_ARMOR", playerId: pId, payload: { originalAction: action } } },
                { label: "No", action: { type: "RESPONSE_ELECTRIC_ARMOR_NO", playerId: pId, payload: { originalAction: action } } }
              ]
            }
          }
        });
        const index = st2.pendingActions.findIndex((a) => a === action);
        if (index !== -1) st2.pendingActions.splice(index, 1);
      }
    }
    if (action.type === "RESPONSE_ELECTRIC_ARMOR" && action.playerId === pId) {
      const orig = action.payload.originalAction;
      st2.pendingActions.unshift(
        { ...orig, payload: { ...orig.payload, amount: orig.payload.amount - 1 }, affectedByCards: [{ cardId: "electric_armor", playerId: pId }] }
      );
      st2.pendingActions.unshift(
        { type: "ENERGY", playerId: pId, payload: { amount: -1 }, affectedByCards: [{ cardId: "electric_armor", playerId: pId }] }
      );
    }
    if (action.type === "RESPONSE_ELECTRIC_ARMOR_NO" && action.playerId === pId) {
      st2.pendingActions.unshift({ ...action.payload.originalAction, affectedByCards: action.payload.originalAction.affectedByCards || [] });
    }
    return st2;
  }
};

// src/engine/cards/SuperJump.ts
var SuperJump = {
  id: "super_jump",
  name: "Super Jump",
  cost: 4,
  type: "Keep",
  description: "Take 1 less damage from all attacks.",
  verified: true,
  onPreEvent: (st2, action, pId) => {
    if (action.type === "TAKE_DAMAGE" && action.playerId === pId && action.payload.amount > 0) {
      action.payload.amount -= 1;
      action.affectedByCards = [...action.affectedByCards || [], { cardId: "super_jump", playerId: pId }];
    }
    return st2;
  }
};

// src/engine/cards/Telepath.ts
var Telepath = {
  id: "telepath",
  name: "Telepath",
  cost: 4,
  type: "Keep",
  description: "Spend 1\u26A1 to get 1 extra reroll.",
  verified: false,
  onPreEvent: (st2, action, pId) => {
    if (action.type === "RESOLVE_ROLLS" && action.playerId === pId && st2.players[pId].energy >= 1) {
      if (!action.payload?._telepathPrompted) {
        action.payload = action.payload || {};
        action.payload._telepathPrompted = true;
        const index = st2.pendingActions.findIndex((a) => a === action);
        if (index !== -1) {
          st2.pendingActions.splice(index, 1);
          st2.pendingActions.unshift({
            type: "ASK",
            playerId: pId,
            payload: {
              prompt: {
                playerId: pId,
                text: "Telepath: Spend 1\u26A1 for an extra reroll?",
                options: [
                  { label: "Yes", action: { type: "RESPONSE_TELEPATH", playerId: pId, payload: { originalAction: action } } },
                  { label: "No", action: { type: "RESPONSE_TELEPATH_NO", playerId: pId, payload: { originalAction: action } } }
                ]
              }
            }
          });
        }
      }
    }
    if ((action.type === "RESPONSE_TELEPATH" || action.type === "USE_TELEPATH") && action.playerId === pId) {
      st2.players[pId].energy -= 1;
      st2.maxRolls = (st2.maxRolls || 3) + 1;
      if (action.type === "RESPONSE_TELEPATH") {
        st2.rollCount = 1;
        st2.pendingActions.unshift({ type: "RESOLVE_ROLLS", playerId: pId });
        st2.pendingActions.unshift({ type: "ASK_ROLL", playerId: pId, payload: { prompt: { playerId: pId, text: "Roll Dice?", options: [] } } });
      } else {
        st2.players[pId].cardState = st2.players[pId].cardState || {};
        st2.players[pId].cardState.telepathUsed = true;
      }
      addLog(st2, action, `${st2.players[pId].name} spent 1\u26A1 for an extra reroll using Telepath`);
    }
    if (action.type === "RESPONSE_TELEPATH_NO" && action.playerId === pId) {
      st2.pendingActions.unshift({ ...action.payload.originalAction, affectedByCards: action.payload.originalAction.affectedByCards || [] });
    }
    return st2;
  }
};

// src/engine/cards/Vampiric.ts
var Vampiric = {
  id: "vampiric",
  name: "Vampiric",
  cost: 4,
  type: "Keep",
  description: "When you damage another monster, heal 1\u2764\uFE0F.",
  verified: true,
  onPostEvent: (st2, action, pId) => {
    if (action.type === "ATTACK" && action.playerId === pId && action.payload.damage > 0) {
      st2.pendingActions.unshift({ type: "HEALTH", payload: { amount: 1 }, playerId: pId });
    }
    return st2;
  }
};

// src/engine/cards/Unstoppable.ts
var Unstoppable = {
  id: "unstoppable",
  name: "Unstoppable",
  cost: 4,
  type: "Keep",
  description: "You can heal while in Tokyo.",
  verified: true,
  onPreEvent: (st2, action, pId) => {
    if (action.type === "HEALTH" && action.playerId === pId) {
      action.affectedByCards = [...action.affectedByCards || [], { cardId: "unstoppable", playerId: pId }];
    }
    return st2;
  }
};

// src/engine/cards/AcidAttack.ts
var AcidAttack = {
  id: "acid_attack",
  name: "Acid Attack",
  cost: 6,
  type: "Keep",
  description: "Deal 1 extra damage each turn (even when you don't otherwise attack).",
  verified: false,
  onPreEvent: (st2, action, pId) => {
    if (action.type === "START_TURN" && action.playerId === pId) {
      st2.players[pId].cardState = st2.players[pId].cardState || {};
      st2.players[pId].cardState.acidAttackUsed = false;
    }
    if (action.type === "ATTACK" && action.playerId === pId && !action.affectedByCards?.some((c) => c.cardId === "acid_attack")) {
      st2.pendingActions.unshift({ ...action, payload: { ...action.payload, damage: action.payload.damage + 1 }, affectedByCards: [...action.affectedByCards || [], { cardId: "acid_attack", playerId: pId }] });
      st2.players[pId].cardState = st2.players[pId].cardState || {};
      st2.players[pId].cardState.acidAttackUsed = true;
      const index = st2.pendingActions.findIndex((a) => a === action);
      if (index !== -1) st2.pendingActions.splice(index, 1);
    }
    if (action.type === "END_TURN" && action.playerId === pId) {
      const state = st2.players[pId].cardState || {};
      if (!state.acidAttackUsed) {
        st2.pendingActions.unshift({
          type: "ATTACK",
          playerId: pId,
          payload: { damage: 1 },
          affectedByCards: [{ cardId: "acid_attack", playerId: pId }]
        });
      }
    }
    return st2;
  }
};

// src/engine/cards/BackgroundDweller.ts
var BackgroundDweller = {
  id: "background_dweller",
  name: "Background Dweller",
  cost: 4,
  type: "Keep",
  description: "You can always reroll any 3\uFE0F\u20E3 you have.",
  verified: false,
  onPreEvent: (st2, action, pId) => {
    if (action.type === "RESOLVE_ROLLS" && action.playerId === pId) {
      if (action.payload?._bgDwellerDone) return st2;
      const index = st2.pendingActions.findIndex((a) => a === action);
      if (index !== -1) {
        const threeCount = st2.dice.filter((d) => d.value === "3").length;
        if (threeCount > 0) {
          st2.pendingActions.splice(index, 1);
          st2.pendingActions.unshift({
            type: "ASK",
            playerId: pId,
            payload: {
              prompt: {
                playerId: pId,
                text: `Background Dweller: You have ${threeCount} x 3\uFE0F\u20E3. Reroll one?`,
                options: [
                  { label: "Yes", action: { type: "RESPONSE_BG_DWELLER_YES", playerId: pId, payload: { originalAction: action } } },
                  { label: "No", action: { type: "RESPONSE_BG_DWELLER_NO", playerId: pId, payload: { originalAction: action } } }
                ]
              }
            }
          });
        }
      }
    }
    if (action.type === "RESPONSE_BG_DWELLER_YES" && action.playerId === pId) {
      const threeIndex = st2.dice.findIndex((d) => d.value === "3");
      if (threeIndex !== -1) {
        const DICE_FACES2 = ["1", "2", "3", "Energy", "Heart", "Smash"];
        st2.dice[threeIndex].value = DICE_FACES2[Math.floor(Math.random() * DICE_FACES2.length)];
        addLog(st2, action, `${st2.players[pId].name} rerolled a 3\uFE0F\u20E3 using Background Dweller`);
      }
      st2.pendingActions.unshift(action.payload.originalAction);
    }
    if (action.type === "RESPONSE_BG_DWELLER_NO" && action.playerId === pId) {
      const nextAction = { ...action.payload.originalAction, payload: { ...action.payload.originalAction.payload, _bgDwellerDone: true } };
      st2.pendingActions.unshift(nextAction);
    }
    return st2;
  }
};

// src/engine/cards/Burrowing.ts
var Burrowing = {
  id: "burrowing",
  name: "Burrowing",
  cost: 5,
  type: "Keep",
  description: "Deal 1 extra damage when attacking from Tokyo. Deal 1 damage when yielding Tokyo to the monster taking it.",
  verified: true,
  onPreEvent: (st2, action, pId) => {
    if (action.type === "ATTACK" && action.playerId === pId && st2.players[pId].location !== "Outside" && !action.affectedByCards?.some((c) => c.cardId === "burrowing")) {
      st2.pendingActions.unshift({ ...action, payload: { ...action.payload, damage: action.payload.damage + 1 }, affectedByCards: [...action.affectedByCards || [], { cardId: "burrowing", playerId: pId }] });
      const index = st2.pendingActions.findIndex((a) => a === action);
      if (index !== -1) st2.pendingActions.splice(index, 1);
    }
    if (action.type === "RESPONSE_YIELD" && action.playerId === pId && action.payload.yield) {
      const attackerId = action.payload?.attackerId;
      if (attackerId) {
        st2.pendingActions.unshift({
          type: "TAKE_DAMAGE",
          playerId: attackerId,
          payload: { amount: 1 },
          affectedByCards: [{ cardId: "burrowing", playerId: pId }]
        });
      }
    }
    return st2;
  }
};

// src/engine/cards/FireBlast.ts
var FireBlast = {
  id: "fire_blast",
  name: "Fire Blast",
  cost: 3,
  type: "Discard",
  description: "Deal 2 damage to all other monsters.",
  verified: true,
  onBuy: (st2, action, pId) => {
    st2.playerOrder.forEach((id) => {
      if (id !== pId && st2.players[id].health > 0) {
        st2.pendingActions.unshift({ type: "TAKE_DAMAGE", playerId: id, payload: { amount: 2 }, affectedByCards: [{ cardId: "fire_blast", playerId: pId }] });
      }
    });
    return st2;
  }
};

// src/engine/cards/FireBreathing.ts
var FireBreathing = {
  id: "fire_breathing",
  name: "Fire Breathing",
  cost: 4,
  type: "Keep",
  description: "Your neighbors take 1 extra damage when you deal damage.",
  verified: false,
  onPreEvent: (st2, action, pId) => {
    if (action.type === "ATTACK" && action.playerId === pId && action.payload.damage > 0) {
      const order = st2.playerOrder.filter((id) => st2.players[id].health > 0);
      const idx = order.indexOf(pId);
      if (idx !== -1 && order.length > 1) {
        const left = order[(idx - 1 + order.length) % order.length];
        const right = order[(idx + 1) % order.length];
        const neighbors = /* @__PURE__ */ new Set([left, right]);
        neighbors.forEach((nId) => {
          st2.pendingActions.unshift({ type: "TAKE_DAMAGE", playerId: nId, payload: { amount: 1 }, affectedByCards: [{ cardId: "fire_breathing", playerId: pId }] });
        });
      }
    }
    return st2;
  }
};

// src/engine/cards/FreezeTime.ts
var FreezeTime = {
  id: "freeze_time",
  name: "Freeze Time",
  cost: 5,
  type: "Keep",
  description: "On a turn where you score 1\uFE0F\u20E31\uFE0F\u20E31\uFE0F\u20E3, you can take another turn with one less die.",
  verified: true,
  onPreEvent: (st2, action, pId) => {
    if (action.type === "START_TURN" && action.playerId === pId) {
      st2.players[pId].cardState = st2.players[pId].cardState || {};
      st2.players[pId].cardState.freezeTimeEarnedThisTurn = false;
    }
    if (action.type === "RESOLVE_ROLLS" && action.playerId === pId) {
      const counts = {};
      st2.dice.forEach((d) => {
        counts[d.value] = (counts[d.value] || 0) + 1;
      });
      if (counts["1"] >= 3) {
        st2.players[pId].cardState = st2.players[pId].cardState || {};
        if (!st2.players[pId].cardState.freezeTimeEarnedThisTurn) {
          st2.players[pId].cardState.freezeTimeEarnedThisTurn = true;
          st2.players[pId].cardState.freezeTimeExtraTurn = true;
          st2.players[pId].markers = st2.players[pId].markers || {};
          st2.players[pId].markers.extra_turn = (st2.players[pId].markers.extra_turn || 0) + 1;
          addLog(st2, action, `${st2.players[pId].name} scored 1\uFE0F\u20E31\uFE0F\u20E31\uFE0F\u20E3 and gets an extra turn from Freeze Time!`);
        }
      }
    }
    return st2;
  },
  onPostEvent: (st2, action, pId) => {
    if (action.type === "SETUP_DICE" && action.playerId === pId) {
      const state = st2.players[pId].cardState || {};
      if (state.freezeTimeExtraTurn) {
        state.freezeTimeExtraTurn = false;
        if (st2.dice.length > 0) {
          st2.dice.pop();
        }
      }
    }
    return st2;
  }
};

// src/engine/cards/Herbivore.ts
var Herbivore = {
  id: "herbivore",
  name: "Herbivore",
  cost: 5,
  type: "Keep",
  description: "Gain 1\u2B50 on your turn if you don't damage anyone.",
  verified: true,
  onPreEvent: (st2, action, pId) => {
    if (action.type === "START_TURN" && action.playerId === pId) {
      st2.players[pId].cardState = st2.players[pId].cardState || {};
      st2.players[pId].cardState.herbivoreDamagedSomeone = false;
    }
    if (action.type === "TAKE_DAMAGE" && action.payload.amount > 0) {
      if (st2.playerOrder[st2.currentPlayerIndex] === pId) {
        st2.players[pId].cardState = st2.players[pId].cardState || {};
        st2.players[pId].cardState.herbivoreDamagedSomeone = true;
      }
    }
    if (action.type === "END_TURN" && action.playerId === pId) {
      const state = st2.players[pId].cardState || {};
      if (state.herbivoreDamagedSomeone === false) {
        st2.pendingActions.unshift({ type: "VP", playerId: pId, payload: { amount: 1 }, affectedByCards: [{ cardId: "herbivore", playerId: pId }] });
      }
    }
    return st2;
  }
};

// src/engine/cards/HerdCuller.ts
var HerdCuller = {
  id: "herd_culler",
  name: "Herd Culler",
  cost: 3,
  type: "Keep",
  description: "You can change one of your dice to a 1\uFE0F\u20E3 each turn.",
  verified: false,
  onPreEvent: (st2, action, pId) => {
    if (action.type === "START_TURN" && action.playerId === pId) {
      st2.players[pId].cardState = st2.players[pId].cardState || {};
      st2.players[pId].cardState.herdCullerUsed = false;
    }
    if (action.type === "RESOLVE_ROLLS" && action.playerId === pId) {
      if (action.payload?._herdCullerDone) return st2;
      const index = st2.pendingActions.findIndex((a) => a === action);
      if (index !== -1) {
        const state = st2.players[pId].cardState || {};
        if (!state.herdCullerUsed) {
          const uniqueFaces = Array.from(new Set(st2.dice.filter((d) => d.value !== "1").map((d) => d.value)));
          if (uniqueFaces.length > 0) {
            st2.pendingActions.splice(index, 1);
            const emojiMap = { Heart: "\u2764\uFE0F", Energy: "\u26A1", Smash: "\u{1F4A5}", "1": "1\uFE0F\u20E3", "2": "2\uFE0F\u20E3", "3": "3\uFE0F\u20E3" };
            const options = uniqueFaces.map((face) => ({
              label: `Change a ${emojiMap[face] || face}`,
              action: { type: "RESPONSE_HERD_CULLER", playerId: pId, payload: { originalAction: action, faceToChange: face } }
            }));
            options.push({ label: "No", action: { type: "RESPONSE_HERD_CULLER_NO", playerId: pId, payload: { originalAction: action } } });
            st2.pendingActions.unshift({
              type: "ASK",
              playerId: pId,
              payload: {
                prompt: {
                  playerId: pId,
                  text: `Herd Culler: Change a die to a 1\uFE0F\u20E3?`,
                  options
                }
              }
            });
          }
        }
      }
    }
    if (action.type === "RESPONSE_HERD_CULLER" && action.playerId === pId) {
      const { faceToChange } = action.payload;
      const dieIndex = st2.dice.findIndex((d) => d.value === faceToChange);
      if (dieIndex !== -1) {
        st2.dice[dieIndex].value = "1";
        st2.players[pId].cardState = st2.players[pId].cardState || {};
        st2.players[pId].cardState.herdCullerUsed = true;
        addLog(st2, action, `${st2.players[pId].name} used Herd Culler to change a die to a 1\uFE0F\u20E3!`);
      }
      st2.pendingActions.unshift(action.payload.originalAction);
    }
    if (action.type === "RESPONSE_HERD_CULLER_NO" && action.playerId === pId) {
      const nextAction = { ...action.payload.originalAction, payload: { ...action.payload.originalAction.payload, _herdCullerDone: true } };
      st2.pendingActions.unshift(nextAction);
    }
    return st2;
  }
};

// src/engine/cards/registry.ts
var CARD_REGISTRY = {
  [AcidAttack.id]: AcidAttack,
  [AlienMetabolism.id]: AlienMetabolism,
  [AlphaMonster.id]: AlphaMonster,
  [AmusementPark.id]: AmusementPark,
  [ArmorPlating.id]: ArmorPlating,
  [Army.id]: Army,
  [BackgroundDweller.id]: BackgroundDweller,
  [Burrowing.id]: Burrowing,
  [Camouflage.id]: Camouflage,
  [Cannibalistic.id]: Cannibalistic,
  [CommuterTrain.id]: CommuterTrain,
  [CompleteDestruction.id]: CompleteDestruction,
  [CornerStore.id]: CornerStore,
  [DedicatedNewsTeam.id]: DedicatedNewsTeam,
  [DropFromHighAltitude.id]: DropFromHighAltitude,
  [EaterOfTheDead.id]: EaterOfTheDead,
  [ElectricArmor.id]: ElectricArmor,
  [Energize.id]: Energize,
  [EnergyHoarder.id]: EnergyHoarder,
  [EvacuationOrders.id]: EvacuationOrders,
  [EvenBigger.id]: EvenBigger,
  [ExtraHead.id]: ExtraHead,
  [FireBlast.id]: FireBlast,
  [FireBreathing.id]: FireBreathing,
  [FreezeTime.id]: FreezeTime,
  [Frenzy.id]: Frenzy,
  [FriendOfChildren.id]: FriendOfChildren,
  [GasRefinery.id]: GasRefinery,
  [GiantBrain.id]: GiantBrain,
  [Gourmet.id]: Gourmet,
  [HealCard.id]: HealCard,
  [Herbivore.id]: Herbivore,
  [HerdCuller.id]: HerdCuller,
  [HighAltitudeBombing.id]: HighAltitudeBombing,
  [ItHasAChild.id]: ItHasAChild,
  [JetFighters.id]: JetFighters,
  [Jets.id]: Jets,
  [MadeInALab.id]: MadeInALab,
  [Metamorph.id]: Metamorph,
  [Mimic.id]: Mimic,
  [MonsterBatteries.id]: MonsterBatteries,
  [NationalGuard.id]: NationalGuard,
  [NovaBreath.id]: NovaBreath,
  [NuclearPowerPlant.id]: NuclearPowerPlant,
  [Omnivore.id]: Omnivore,
  [Opportunist.id]: Opportunist,
  [PoisonQuills.id]: PoisonQuills,
  [PoisonSpit.id]: PoisonSpit,
  [Regeneration.id]: Regeneration,
  [RootingForTheUnderdog.id]: RootingForTheUnderdog,
  [Skyscraper.id]: Skyscraper,
  [SolarPowered.id]: SolarPowered,
  [SpikedTail.id]: SpikedTail,
  [SuperJump.id]: SuperJump,
  [Tanks.id]: Tanks,
  [Telepath.id]: Telepath,
  [ThrowATanker.id]: ThrowATanker,
  [Unstoppable.id]: Unstoppable,
  [Urbavore.id]: Urbavore,
  [UrbanLegend.id]: UrbanLegend,
  [Vampiric.id]: Vampiric,
  [WeAreOnlyMakingItStronger.id]: WeAreOnlyMakingItStronger,
  [Wings.id]: Wings
};

// src/engine/types.ts
var initialKotState = {
  ...import_boardgame_core.baseInitialState,
  settings: {
    maxHealth: 10,
    maxVp: 20,
    cardsPerType: 1,
    startingEnergy: 0,
    activeCards: Object.keys(CARD_REGISTRY)
  },
  deck: [],
  market: [],
  dice: [
    { id: "d1", value: "1", kept: false },
    { id: "d2", value: "2", kept: false },
    { id: "d3", value: "3", kept: false },
    { id: "d4", value: "Heart", kept: false },
    { id: "d5", value: "Energy", kept: false },
    { id: "d6", value: "Smash", kept: false }
  ],
  rollCount: 0,
  turnContext: {},
  pendingActions: [],
  logs: [],
  history: []
};

// src/engine/actions/START_GAME.ts
function handleStartGame(st2, action, pId) {
  const newDeck = [];
  const copies = st2.settings.cardsPerType || 1;
  st2.settings.activeCards.forEach((cardId) => {
    for (let i = 0; i < copies; i++) {
      newDeck.push(cardId);
    }
  });
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  st2.deck = newDeck;
  st2.market = ["", "", ""];
  st2.status = "Playing";
  st2.playerOrder.forEach((id) => {
    const originalPlayer = st2.players[id];
    st2.players[id] = {
      id: originalPlayer.id,
      name: originalPlayer.name,
      isBot: originalPlayer.isBot,
      botStrategy: originalPlayer.botStrategy,
      color: originalPlayer.color,
      maxHealth: st2.settings.maxHealth,
      health: st2.settings.maxHealth,
      energy: st2.settings.startingEnergy,
      vp: 0,
      location: "Outside",
      cards: [],
      stats: {
        healthHealed: 0,
        energyGained: 0,
        damageDealt: 0,
        playersKilled: 0,
        cardsBought: 0
      },
      markers: {},
      cardState: {}
    };
  });
  st2.history = [{
    turnNum: 0,
    healths: Object.fromEntries(Object.keys(st2.players).map((id) => [id, st2.players[id].health])),
    vps: Object.fromEntries(Object.keys(st2.players).map((id) => [id, st2.players[id].vp])),
    tokyoOccupant: null
  }];
  st2.pendingActions = [
    { type: "FILL_MARKET", playerId: pId, payload: { index: 2 } },
    { type: "FILL_MARKET", playerId: pId, payload: { index: 1 } },
    { type: "FILL_MARKET", playerId: pId, payload: { index: 0 } },
    { type: "START_TURN", playerId: st2.playerOrder[st2.currentPlayerIndex] }
  ];
}

// src/engine/actions/START_TURN.ts
function handleStartTurn(st2, action, pId) {
  const p = st2.players[pId];
  addLog(st2, action, `--- \u{1F47E} ${p.name}'s Turn ---`);
  const peopleInTokyo = st2.playerOrder.filter((id) => st2.players[id].location === "TokyoCity" && st2.players[id].health > 0);
  if (peopleInTokyo.length > 1) {
    addLog(st2, action, `\u26A0\uFE0F WARNING: Multiple monsters detected in Tokyo! Evicting everyone except the current player or the first one found.`);
    peopleInTokyo.forEach((id) => {
      if (id !== pId && (peopleInTokyo[0] !== id || peopleInTokyo.includes(pId))) {
        st2.players[id] = { ...st2.players[id], location: "Outside" };
      }
    });
  }
  st2.pendingActions = [
    { type: "SETUP_DICE", playerId: pId },
    { type: "ASK_ROLL", playerId: pId, payload: {
      prompt: {
        playerId: pId,
        text: "Roll Dice?",
        options: []
      }
    } },
    { type: "RESOLVE_ROLLS", playerId: pId },
    { type: "GO_TO_MARKET", playerId: pId },
    { type: "END_TURN", playerId: pId },
    ...st2.pendingActions
  ];
  if (p && p.location === "TokyoCity") {
    addLog(st2, action, `${p.name} starts turn in Tokyo`);
    st2.pendingActions.unshift({ type: "VP", payload: { amount: 2 }, playerId: pId });
  }
}

// src/engine/actions/END_TURN.ts
function handleEndTurn(st2, action, pId) {
  let nextIdx = st2.currentPlayerIndex;
  if (st2.players[pId].markers && st2.players[pId].markers.extra_turn && st2.players[pId].markers.extra_turn > 0 && st2.players[pId].health > 0) {
    st2.players[pId].markers.extra_turn -= 1;
    addLog(st2, action, `${st2.players[pId].name} takes an extra turn due to Frenzy!`);
  } else {
    nextIdx = (st2.currentPlayerIndex + 1) % st2.playerOrder.length;
    while (st2.players[st2.playerOrder[nextIdx]].health <= 0) {
      nextIdx = (nextIdx + 1) % st2.playerOrder.length;
    }
  }
  const tokyoOccupant = st2.playerOrder.find((id) => st2.players[id].location === "TokyoCity") || null;
  st2.history.push({
    turnNum: st2.history.length + 1,
    healths: st2.playerOrder.reduce((acc, id) => ({ ...acc, [id]: st2.players[id].health }), {}),
    vps: st2.playerOrder.reduce((acc, id) => ({ ...acc, [id]: st2.players[id].vp }), {}),
    tokyoOccupant
  });
  st2.currentPlayerIndex = nextIdx;
  st2.turnContext = {};
  st2.pendingActions.unshift({ type: "START_TURN", playerId: st2.playerOrder[nextIdx] });
}

// src/engine/actions/VP.ts
function handleVP(st2, action, pId) {
  if (st2.players[pId]) {
    st2.players[pId] = { ...st2.players[pId], vp: st2.players[pId].vp + action.payload.amount };
    const reasonStr = action.payload.reason ? ` (${action.payload.reason})` : "";
    addLog(st2, action, `${st2.players[pId].name} gained ${action.payload.amount} \u2B50${reasonStr}`);
    if (st2.players[pId].vp >= st2.settings.maxVp) {
      addLog(st2, action, `${st2.players[pId].name} wins on VP \u{1F3C6}`);
      st2.status = "Finished";
      st2.winnerId = pId;
      st2.pendingActions = [];
    }
  }
}

// src/engine/actions/ENERGY.ts
function handleEnergy(st2, action, pId) {
  if (st2.players[pId]) {
    st2.players[pId] = {
      ...st2.players[pId],
      energy: st2.players[pId].energy + action.payload.amount,
      stats: {
        ...st2.players[pId].stats,
        energyGained: (st2.players[pId].stats.energyGained || 0) + (action.payload.amount > 0 ? action.payload.amount : 0)
      }
    };
    let sourceText = "";
    if (action.payload.sourceCard && CARD_REGISTRY[action.payload.sourceCard]) {
      sourceText = ` via ${CARD_REGISTRY[action.payload.sourceCard].name}`;
    }
    const reasonStr = action.payload.reason ? ` (${action.payload.reason})` : "";
    const amt = action.payload.amount;
    if (amt >= 0) {
      addLog(st2, action, `${st2.players[pId].name} gained ${amt} \u26A1${reasonStr}${sourceText}`);
    } else {
      addLog(st2, action, `${st2.players[pId].name} lost ${Math.abs(amt)} \u26A1${reasonStr}${sourceText}`);
    }
  }
}

// src/engine/actions/HEALTH.ts
function handleHealth(st2, action, pId) {
  if (st2.players[pId]) {
    const max = getPlayerMaxHealth(st2, pId);
    const actual = Math.min(max - st2.players[pId].health, action.payload.amount);
    const isFromCard = !!action.payload.sourceCard || action.affectedByCards && action.affectedByCards.length > 0;
    const canHeal = st2.players[pId].location !== "TokyoCity" || isFromCard;
    if (actual > 0 && canHeal) {
      st2.players[pId] = {
        ...st2.players[pId],
        health: st2.players[pId].health + actual,
        stats: {
          ...st2.players[pId].stats,
          healthHealed: (st2.players[pId].stats.healthHealed || 0) + actual
        }
      };
      const reasonStr = action.payload.reason ? ` (${action.payload.reason})` : "";
      addLog(st2, action, `${st2.players[pId].name} healed ${actual} \u2764\uFE0F${reasonStr}`);
    }
  }
}

// src/engine/actions/SETUP_DICE.ts
function handleSetupDice(st2, action, pId) {
  const diceCount = 6;
  const DICE_FACES2 = ["1", "2", "3", "Energy", "Heart", "Smash"];
  st2.dice = Array.from({ length: diceCount }).map((_, i) => ({ id: `d${i}`, value: DICE_FACES2[Math.floor(Math.random() * DICE_FACES2.length)], kept: false }));
  const extraRerolls = st2.players[pId].stats?.extraRerolls || 0;
  st2.maxRolls = 3 + extraRerolls;
  st2.rollCount = st2.maxRolls;
  addLog(st2, action, `${st2.dice.length} dice are ready for up to ${st2.rollCount} rolls.`);
}

// src/engine/actions/RESPONSE_ROLL.ts
function handleResponseRoll(st2, action, pId) {
  if (action.payload.roll) {
    st2.dice = st2.dice.map((d) => action.payload.keptDiceIds?.includes(d.id) ? { ...d, kept: true } : { ...d, value: DICE_FACES[Math.floor(Math.random() * DICE_FACES.length)], kept: false });
    st2.rollCount -= 1;
    if (st2.rollCount > 0) {
      st2.pendingActions.unshift({ type: "ASK_ROLL", playerId: pId, payload: {
        prompt: {
          playerId: pId,
          text: "Roll Dice?",
          options: []
        }
      } });
    }
  }
  if (!action.payload.roll || st2.rollCount === 0) {
    const emojiMap = { Heart: "\u2764\uFE0F", Energy: "\u26A1", Smash: "\u{1F4A5}", "1": "1\uFE0F\u20E3", "2": "2\uFE0F\u20E3", "3": "3\uFE0F\u20E3" };
    const outcomeStr = st2.dice.map((d) => emojiMap[d.value] || d.value).join(" ");
    st2.turnContext = st2.turnContext || {};
    st2.turnContext.originalRollStr = outcomeStr;
    addLog(st2, action, `${st2.players[pId].name} finished rolling: ${outcomeStr}`);
  }
}

// src/engine/actions/RESOLVE_ROLLS.ts
function handleResolveRolls(st2, action, pId) {
  const outcomeMap = {};
  st2.dice.forEach((d) => {
    outcomeMap[d.value] = (outcomeMap[d.value] || 0) + 1;
  });
  const diceActions = [];
  const emojiMap = { Heart: "\u2764\uFE0F", Energy: "\u26A1", Smash: "\u{1F4A5}", "1": "1\uFE0F\u20E3", "2": "2\uFE0F\u20E3", "3": "3\uFE0F\u20E3" };
  const outcomeStr = st2.dice.map((d) => emojiMap[d.value] || d.value).join(" ");
  st2.turnContext = st2.turnContext || {};
  if (st2.turnContext.originalRollStr !== outcomeStr) {
    addLog(st2, action, `${st2.players[pId].name} resolved: ${outcomeStr}`);
  }
  if (outcomeMap["1"] >= 3) diceActions.push({ type: "VP", payload: { amount: 1 + (outcomeMap["1"] - 3) }, playerId: pId });
  if (outcomeMap["2"] >= 3) diceActions.push({ type: "VP", payload: { amount: 2 + (outcomeMap["2"] - 3) }, playerId: pId });
  if (outcomeMap["3"] >= 3) diceActions.push({ type: "VP", payload: { amount: 3 + (outcomeMap["3"] - 3) }, playerId: pId });
  if (outcomeMap["Energy"]) diceActions.push({ type: "ENERGY", payload: { amount: outcomeMap["Energy"] }, playerId: pId });
  if (outcomeMap["Heart"]) diceActions.push({ type: "HEALTH", payload: { amount: outcomeMap["Heart"] }, playerId: pId });
  if (outcomeMap["Smash"]) diceActions.push({ type: "ATTACK", payload: { damage: outcomeMap["Smash"] }, playerId: pId });
  st2.pendingActions = [...diceActions, ...st2.pendingActions];
}

// src/engine/actions/TAKE_DAMAGE.ts
function handleTakeDamage(st2, action, pId) {
  const targetId = pId;
  const dmg = action.payload.amount;
  if (st2.players[targetId] && st2.players[targetId].health > 0) {
    const actualDamageTaken = Math.min(st2.players[targetId].health, dmg);
    const newHealth = st2.players[targetId].health - actualDamageTaken;
    st2.players[targetId] = { ...st2.players[targetId], health: newHealth };
    action.payload._actualDamageTaken = actualDamageTaken;
    addLog(st2, action, `${st2.players[targetId].name} took ${dmg} \u{1F4A5}`);
    if (action.payload.attackerId && st2.players[action.payload.attackerId]) {
      const attacker = st2.players[action.payload.attackerId];
      st2.players[action.payload.attackerId] = {
        ...attacker,
        stats: {
          ...attacker.stats,
          damageDealt: (attacker.stats.damageDealt || 0) + actualDamageTaken,
          playersKilled: (attacker.stats.playersKilled || 0) + (newHealth === 0 ? 1 : 0)
        }
      };
    }
    if (newHealth === 0) {
      if (action.payload.yield_after && action.payload.attackerId) {
        st2.pendingActions.unshift({ type: "ENTER_TOKYO", playerId: action.payload.attackerId });
      }
      st2.pendingActions.unshift({ type: "DEAD", playerId: targetId });
    } else if (action.payload.yield_after && actualDamageTaken > 0) {
      st2.pendingActions.unshift({ type: "ASK", payload: {
        prompt: {
          playerId: targetId,
          text: `Will you yield Tokyo?`,
          options: [
            { label: "Yield", action: { type: "RESPONSE_YIELD", payload: { yield: true, attackerId: action.payload.attackerId }, playerId: targetId } },
            { label: "Stay", action: { type: "RESPONSE_YIELD", payload: { yield: false }, playerId: targetId } }
          ]
        }
      } });
    }
  }
}

// src/engine/actions/DEAD.ts
function handleDead(st2, action, pId) {
  addLog(st2, action, `\u{1F480} ${st2.players[pId].name} died`);
  if (st2.players[pId]) {
    st2.players[pId].stats.turnDied = st2.history.length + 1;
  }
  if (st2.players[pId].location === "TokyoCity") {
    st2.players[pId] = { ...st2.players[pId], location: "Outside" };
  }
  const alive = st2.playerOrder.filter((id) => st2.players[id].health > 0);
  if (alive.length <= 1 && alive.length > 0) {
    addLog(st2, action, `${st2.players[alive[0]].name} is the last monster standing \u{1F3C6}`);
    st2.status = "Finished";
    st2.winnerId = alive[0];
    st2.pendingActions = [];
  }
}

// src/engine/actions/ATTACK.ts
function handleAttack(st2, action, pId) {
  const attacker = st2.players[pId];
  const damage = action.payload.damage;
  const reasonStr = action.payload.reason ? ` (${action.payload.reason})` : "";
  addLog(st2, action, `${attacker.name} attacks for ${damage}${reasonStr}`);
  const actionsToPush = [];
  if (attacker.location === "Outside") {
    const tokyoPlayers = st2.playerOrder.filter((id) => st2.players[id].location === "TokyoCity" && st2.players[id].health > 0);
    if (tokyoPlayers.length === 0) {
      actionsToPush.push({ type: "ENTER_TOKYO", playerId: pId });
    } else {
      tokyoPlayers.forEach((tId) => {
        actionsToPush.push({ type: "TAKE_DAMAGE", payload: { amount: damage, yield_after: true, attackerId: pId }, playerId: tId });
      });
    }
  } else {
    st2.playerOrder.forEach((tId) => {
      if (tId !== pId && st2.players[tId].location === "Outside" && st2.players[tId].health > 0) {
        actionsToPush.push({ type: "TAKE_DAMAGE", payload: { amount: damage, attackerId: pId }, playerId: tId });
      }
    });
  }
  st2.pendingActions = [...actionsToPush, ...st2.pendingActions];
}

// src/engine/actions/RESPONSE_YIELD.ts
function handleResponseYield(st2, action, pId) {
  const subAction = action.payload;
  if (subAction.yield) {
    const { attackerId } = subAction;
    st2.players[pId] = { ...st2.players[pId], location: "Outside" };
    addLog(st2, action, `${st2.players[pId].name} yielded Tokyo!`);
    st2.pendingActions.unshift({ type: "ENTER_TOKYO", playerId: attackerId });
  } else {
    addLog(st2, action, `${st2.players[pId].name} stays in Tokyo!`);
  }
}

// src/engine/actions/ENTER_TOKYO.ts
function handleEnterTokyo(st2, action, pId) {
  st2.players[pId] = { ...st2.players[pId], location: "TokyoCity" };
  addLog(st2, action, `${st2.players[pId].name} enters Tokyo`);
  st2.pendingActions.unshift({ type: "VP", payload: { amount: 1 }, playerId: pId });
}

// src/engine/actions/GO_TO_MARKET.ts
function handleGoToMarket(st2, action, pId) {
  st2.turnContext = st2.turnContext || {};
  st2.turnContext.buyDiscount = 0;
  st2.pendingActions = [
    { type: "BUY_OR_SWEEP", playerId: pId },
    ...st2.pendingActions
  ];
}

// src/engine/actions/BUY_OR_SWEEP.ts
function handleBuyOrSweep(st2, action, pId) {
  const canSweep = st2.players[pId].energy >= 2 && st2.deck.length > 0;
  const canPurchase = false;
  if (canSweep || canPurchase) {
    st2.pendingActions.unshift({ type: "ASK_MARKET", playerId: pId, payload: {
      prompt: {
        playerId: pId,
        text: "Buy Phase",
        options: [
          { label: "Done", action: { type: "RESPONSE_MARKET", payload: { action: "DONE" } } },
          { label: "Sweep (2\u26A1)", action: { type: "RESPONSE_MARKET", payload: { action: "SWEEP" } } }
        ]
      }
    } });
  }
}

// src/engine/actions/RESPONSE_MARKET.ts
function handleResponseMarket(st2, action, pId) {
  if (action.payload.action === "SWEEP") {
    st2.pendingActions.unshift({ type: "BUY_OR_SWEEP", playerId: pId });
    st2.pendingActions.unshift({ type: "SWEEP", playerId: pId });
  } else if (action.payload.action === "BUY") {
    st2.pendingActions.unshift({ type: "BUY_OR_SWEEP", playerId: pId });
    st2.pendingActions.unshift({ type: "BUY", playerId: pId, payload: { cardId: action.payload.cardId, marketIndex: action.payload.marketIndex } });
  }
}

// src/engine/actions/SWEEP.ts
function handleSweep(st2, action, pId) {
  st2.players[pId].energy -= 2;
  addLog(st2, action, `${st2.players[pId].name} paid 2 \u26A1 to sweep the market!`);
  const newDeck = [...st2.deck];
  st2.market = ["", "", ""];
  st2.deck = newDeck;
  st2.pendingActions.unshift({ type: "FILL_MARKET", playerId: pId, payload: { index: 2 } });
  st2.pendingActions.unshift({ type: "FILL_MARKET", playerId: pId, payload: { index: 1 } });
  st2.pendingActions.unshift({ type: "FILL_MARKET", playerId: pId, payload: { index: 0 } });
}

// src/engine/actions/BUY.ts
function handleBuy(st2, action, pId) {
  const cardId = action.payload.cardId;
  const marketIndex = action.payload.marketIndex;
  const card = CARD_REGISTRY[cardId];
  if (!card) return;
  if (marketIndex >= 0 && st2.market[marketIndex] !== cardId) {
    addLog(st2, action, `${st2.players[pId].name} tried to buy ${card.name}, but it was already taken!`);
    return;
  }
  let actualCost = action.payload.cost !== void 0 ? action.payload.cost : card.cost;
  if (st2.turnContext?.buyDiscount) {
    actualCost = Math.max(0, actualCost - st2.turnContext.buyDiscount);
  }
  if (st2.players[pId].energy < actualCost) return;
  st2.players[pId] = {
    ...st2.players[pId],
    energy: st2.players[pId].energy - actualCost,
    stats: {
      ...st2.players[pId].stats,
      cardsBought: (st2.players[pId].stats.cardsBought || 0) + 1
    }
  };
  addLog(st2, action, `${st2.players[pId].name} bought ${card.name} for ${actualCost} \u26A1`);
  if (marketIndex >= 0) {
    st2.market[marketIndex] = "";
    st2.pendingActions.unshift({ type: "FILL_MARKET", playerId: pId, payload: { index: marketIndex } });
  } else if (action.payload.source === "deck") {
    st2.deck.shift();
  }
  if (card.type === "Keep") {
    st2.players[pId].cards.push(cardId);
  }
  if (card.onBuy) {
    const preLength = st2.pendingActions.length;
    card.onBuy(st2, action, pId);
    const addedCount = st2.pendingActions.length - preLength;
    if (addedCount > 0) {
      for (let i = 0; i < addedCount; i++) {
        if (!st2.pendingActions[i].affectedByCards) {
          st2.pendingActions[i] = {
            ...st2.pendingActions[i],
            affectedByCards: [{ cardId: card.id, playerId: pId }]
          };
        }
      }
    }
  }
}

// src/engine/actions/DISCARD.ts
function handleDiscard(st2, action, pId) {
  const cardId = action.payload.cardId;
  const card = CARD_REGISTRY[cardId];
  if (st2.players[pId].cards.includes(cardId)) {
    st2.players[pId].cards = st2.players[pId].cards.filter((id) => id !== cardId);
    let sourceText = "";
    if (action.payload.sourceCard && CARD_REGISTRY[action.payload.sourceCard]) {
      sourceText = ` via ${CARD_REGISTRY[action.payload.sourceCard].name}`;
    }
    addLog(st2, action, `\u{1F6AE} ${st2.players[pId].name} discarded ${card ? card.name : cardId}${sourceText}`);
  }
}

// src/engine/actions/FILL_MARKET.ts
function handleFillMarket(st2, action, pId) {
  const index = action.payload.index;
  if (st2.deck.length > 0 && index >= 0 && index < 3) {
    const newCardId = st2.deck.shift();
    st2.market[index] = newCardId;
    const cardDef = CARD_REGISTRY[newCardId];
    if (cardDef) {
      addLog(st2, action, `\u{1F3B4} Card revealed: ${cardDef.name}`);
    }
    st2.pendingActions.unshift({ type: "CARD_REVEALED", playerId: pId, payload: { cardId: newCardId, marketIndex: index } });
  }
}

// src/engine/actions/index.ts
var ACTION_HANDLERS = {
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
  BUY_OR_SWEEP: handleBuyOrSweep,
  RESPONSE_MARKET: handleResponseMarket,
  SWEEP: handleSweep,
  BUY: handleBuy,
  DISCARD: handleDiscard,
  FILL_MARKET: handleFillMarket
};

// src/engine/markers/PoisonMarker.ts
var PoisonMarker = {
  id: "poison",
  name: "Poison",
  icon: "\u2620\uFE0F",
  description: "Take 1 damage per poison marker at the end of your turn. You can remove a poison marker by spending a \u2764\uFE0F (that \u2764\uFE0F does not heal a damage).",
  onPreEvent: (st2, action, ownerId) => {
    if (action.type === "END_TURN" && action.playerId === ownerId) {
      const poisonCount = st2.players[ownerId].markers?.["poison"] || 0;
      if (poisonCount > 0) {
        addLog(st2, action, `${st2.players[ownerId].name} takes ${poisonCount} damage from Poison!`);
        st2.pendingActions.unshift({ type: "TAKE_DAMAGE", payload: { amount: poisonCount, yield_after: false }, playerId: ownerId });
      }
    }
    return st2;
  },
  onPostEvent: (st2, action, ownerId) => {
    return st2;
  }
};

// src/engine/markers/ExtraTurnMarker.ts
var ExtraTurnMarker = {
  id: "extra_turn",
  name: "Extra Turn",
  icon: "\u23F1\uFE0F",
  description: "Grants an extra turn."
};

// src/engine/markers/registry.ts
var MARKER_REGISTRY = {
  [PoisonMarker.id]: PoisonMarker,
  [ExtraTurnMarker.id]: ExtraTurnMarker
};

// src/bots/botLogic.ts
function getBotAction(state, playerId) {
  const player = state.players[playerId];
  if (!player) return null;
  const topAction = state.pendingActions[0];
  if (topAction?.type === "ASK_QUESTION" && topAction.playerId === playerId) {
    const options = topAction.payload.options;
    if (options && options.length > 0) {
      if (options.includes("No")) {
        return { type: "RESPONSE_QUESTION", payload: { response: "No" } };
      }
      return { type: "RESPONSE_QUESTION", payload: { response: options[0] } };
    }
  }
  if (topAction?.type.startsWith("ASK") && topAction.payload?.prompt?.playerId === playerId) {
    const prompt = topAction.payload.prompt;
    if (topAction.type === "ASK_MARKET") {
      const energy = player.energy;
      const availableMarketCards = state.market.map((cardId, index) => ({ cardId, index })).filter((c) => c.cardId !== null && c.cardId !== void 0 && c.cardId !== "");
      const affordableCards = availableMarketCards.filter((c) => {
        const cardDef = CARD_REGISTRY[c.cardId];
        if (!cardDef) return false;
        if (cardDef.type === "Keep" && player.cards.includes(c.cardId)) return false;
        let cost = cardDef.cost;
        if (player.cards.includes("alien_metabolism") || player.cards.includes("alienMetabolism")) {
          cost = Math.max(0, cost - 1);
        }
        return energy >= cost;
      });
      if (affordableCards.length > 0 && Math.random() < 0.4) {
        const toBuy = affordableCards[Math.floor(Math.random() * affordableCards.length)];
        return { type: "RESPONSE_MARKET", payload: { action: "BUY", cardId: toBuy.cardId, marketIndex: toBuy.index } };
      }
      if (energy >= 2 && Math.random() < 0.2) {
        return { type: "RESPONSE_MARKET", payload: { action: "SWEEP" } };
      }
      return { type: "RESPONSE_MARKET", payload: { action: "DONE" } };
    }
    if (topAction.type === "ASK_ROLL") {
      if (state.rollCount === state.maxRolls || state.rollCount > 0 && Math.random() < 0.7) {
        const toKeep = state.rollCount === state.maxRolls ? [] : state.dice.filter((d) => ["Heart", "Energy", "Smash"].includes(d.value) && Math.random() > 0.5).map((d) => d.id);
        return { type: "RESPONSE_ROLL", payload: { roll: true, keptDiceIds: toKeep } };
      }
      return { type: "RESPONSE_ROLL", payload: { roll: false } };
    }
    if (topAction.type === "ASK_OPPORTUNIST") {
      if (Math.random() < 0.3 && prompt.options) {
        const buyOption = prompt.options.find((o) => o.label.includes("Buy"));
        if (buyOption) return buyOption.action;
      }
      return { type: "RESPONSE_NOP", payload: {} };
    }
    if (prompt.options && prompt.options.length > 0) {
      const randomIdx = Math.floor(Math.random() * prompt.options.length);
      const opt = prompt.options[randomIdx];
      return opt.action;
    }
  }
  return null;
}

// src/engine/reducer.ts
function doAction(state, action) {
  let st2 = { ...state };
  if (!st2.players) return st2;
  const pId = action.playerId || st2.playerOrder[st2.currentPlayerIndex];
  if (ACTION_HANDLERS[action.type]) {
    ACTION_HANDLERS[action.type](st2, action, pId);
  }
  return st2;
}
function handleNextAction(state) {
  let st2 = state;
  while (st2.pendingActions.length > 0 && st2.pendingActions[0].type === "NOP") {
    st2.pendingActions.shift();
  }
  if (st2.pendingActions.length === 0) return st2;
  let topAction = st2.pendingActions[0];
  if (topAction.type === "MULTIPLE_ACTIONS" || topAction.type === "RESPONSE_MULTIPLE_ACTIONS") {
    st2.pendingActions.shift();
    st2.pendingActions = [...topAction.payload.actions, ...st2.pendingActions];
    return handleNextAction(st2);
  }
  if (topAction.type.startsWith("ASK")) {
    const promptPlayerId = topAction.payload?.prompt?.playerId || topAction.playerId || st2.playerOrder[st2.currentPlayerIndex];
    const isBot = st2.players[promptPlayerId]?.isBot;
    if (isBot) {
      st2.actionQueue = [...st2.actionQueue || [], { delayMs: 1500, action: { type: "PLAY_BOT" } }];
    }
    return st2;
  }
  if (topAction.skipPreEvent) {
    st2.pendingActions.shift();
    const initialLogCount = st2.logs.length;
    st2 = doAction(st2, topAction);
    st2 = triggerCards(st2, topAction, "onPostEvent");
    if (st2.logs.length > initialLogCount) {
      st2.actionQueue = [...st2.actionQueue || [], { delayMs: 1500, action: { type: "NOP" } }];
      return st2;
    } else {
      return handleNextAction(st2);
    }
  } else {
    st2.pendingActions[0] = { ...topAction, skipPreEvent: true };
    st2 = triggerCards(st2, st2.pendingActions[0], "onPreEvent");
    return handleNextAction(st2);
  }
}
function triggerCards(state, action, hook) {
  let st2 = state;
  const startIndex = st2.currentPlayerIndex || 0;
  const orderedPlayers = [
    ...st2.playerOrder.slice(startIndex),
    ...st2.playerOrder.slice(0, startIndex)
  ];
  orderedPlayers.forEach((pId) => {
    if (st2.players[pId] && st2.players[pId].cards) {
      const cardsToCheck = [...st2.players[pId].cards];
      cardsToCheck.forEach((cardId) => {
        if (!st2.players[pId].cards.includes(cardId)) return;
        const card = CARD_REGISTRY[cardId];
        if (card && card[hook]) {
          const preLength = st2.pendingActions.length;
          st2 = card[hook](st2, action, pId);
          const addedCount = st2.pendingActions.length - preLength;
          if (addedCount > 0) {
            for (let i = 0; i < addedCount; i++) {
              if (!st2.pendingActions[i].affectedByCards) {
                st2.pendingActions[i] = {
                  ...st2.pendingActions[i],
                  affectedByCards: [{ cardId, playerId: pId }]
                };
              }
            }
          }
        }
      });
    }
    if (st2.players[pId] && st2.players[pId].markers) {
      Object.keys(st2.players[pId].markers || {}).forEach((markerId) => {
        const count = st2.players[pId].markers[markerId];
        if (count > 0) {
          const marker = MARKER_REGISTRY[markerId];
          if (marker && marker[hook]) {
            st2 = marker[hook](st2, action, pId);
          }
        }
      });
    }
  });
  return st2;
}
function kingOfTokyoReducer(state = initialKotState, action) {
  const gamePrefix = action.gameId ? `[${action.gameId}]` : "";
  if (action.type !== "NOP") {
    state = JSON.parse(JSON.stringify(state));
    console.log(`kingOfTokyoReducer ${gamePrefix} INCOMING:`, action.type);
    console.log(`kingOfTokyoReducer ${gamePrefix} PENDING:`, state.pendingActions?.map((a) => a.type).join(", "));
  }
  let st2 = (0, import_boardgame_core2.baseReducer)(state, action);
  if (action.type === "NOP") {
  } else if (action.type === "START_GAME") {
    st2.pendingActions.push({ type: "START_GAME" });
  } else if (action.type === "UPDATE_SETTINGS") {
    st2.settings = action.payload;
    st2.playerOrder.forEach((pId) => {
      if (st2.players[pId]) {
        st2.players[pId].energy = st2.settings.startingEnergy || 0;
      }
    });
    return st2;
  } else if (action.type === "PLAY_BOT") {
    if (st2.pendingActions.length > 0) {
      const topAction = st2.pendingActions[0];
      const targetPlayerId = topAction.payload?.prompt?.playerId || topAction.playerId || st2.playerOrder[st2.currentPlayerIndex];
      const botResponse = getBotAction(st2, targetPlayerId);
      if (botResponse) {
        if (st2.pendingActions[0].type.startsWith("ASK")) {
          st2.pendingActions.shift();
        }
        st2.pendingActions.unshift({ ...botResponse, playerId: targetPlayerId });
      }
    }
  } else if (action.type.startsWith("RESPONSE_")) {
    if (st2.pendingActions.length > 0 && st2.pendingActions[0].type.startsWith("ASK")) {
      const askAction = st2.pendingActions[0];
      if (askAction.payload?.prompt?.playerId === action.playerId) {
        st2.pendingActions.shift();
        st2.pendingActions.unshift({ type: action.type, payload: action.payload, playerId: action.playerId });
      }
    }
  }
  return handleNextAction(st2);
}

// test_acid7.ts
var st = JSON.parse(JSON.stringify(initialKotState));
st.players = {
  p1: { id: "p1", name: "qqq", health: 10, vp: 0, energy: 10, cards: ["acid_attack"], location: "TokyoCity", cardState: { acidAttackUsed: false }, stats: {} },
  p2: { id: "p2", name: "Alice", health: 10, vp: 0, energy: 0, cards: [], location: "Outside", cardState: {}, stats: {} }
};
st.playerOrder = ["p1", "p2"];
st.currentPlayerIndex = 0;
st.settings = { maxHealth: 10, maxVp: 20 };
st.logs = [];
st.pendingActions = [
  { type: "END_TURN", playerId: "p1", payload: {} }
];
while (st.pendingActions.length > 0) {
  st = kingOfTokyoReducer(st, { type: "NOP" });
}
console.log(st.logs.map((l) => l.message));
