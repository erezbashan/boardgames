import { KotCard } from './types';

export const BackgroundDweller: KotCard = {
  id: 'background_dweller',
  name: 'Background Dweller',
  cost: 4,
  type: 'Keep',
  description: 'You can always reroll any 3️⃣ you have.',
  onEvent: (event, payload, state) => {
    if (event === 'BEFORE_RESOLVE_DICE') {
      if (payload.playerId === payload.cardOwnerId) {
        if (state.turnContext?.backgroundDwellerDeclined) return; // already declined this turn
        const hasThree = state.dice.some(d => d.value === '3');
        if (hasThree) {
          return {
            ...state,
            prompt: {
              playerId: payload.playerId,
              text: 'Reroll a 3?',
              options: [
                { label: 'Yes', action: { type: 'CARD_ACTION', payload: { cardId: 'background_dweller', action: 'reroll', playerId: payload.playerId } } },
                { label: 'No', action: { type: 'CARD_ACTION', payload: { cardId: 'background_dweller', action: 'decline', playerId: payload.playerId } } }
              ] as any
            }
          };
        }
      }
    }
    if (event === 'CARD_ACTION' && payload.cardId === 'background_dweller') {
      if (payload.action === 'decline') {
        return {
          ...state,
          prompt: undefined,
          turnContext: { ...state.turnContext, backgroundDwellerDeclined: true },
          actionQueue: [...(state.actionQueue || []), { delayMs: 0, action: { type: 'RESOLVE_DICE', payload: { playerId: payload.playerId } } }]
        };
      }
      if (payload.action === 'reroll') {
        const newDice = [...state.dice];
        const threeIndex = newDice.findIndex(d => d.value === '3');
        if (threeIndex >= 0) {
          const DICE_FACES = ['1', '2', '3', 'Energy', 'Heart', 'Smash'];
          const randomFace = DICE_FACES[Math.floor(Math.random() * DICE_FACES.length)];
          newDice[threeIndex] = { ...newDice[threeIndex], id: Math.random().toString(36).substring(7), value: randomFace as any };
        }
        let newState = {
          ...state,
          dice: newDice,
          prompt: undefined,
          logs: [...state.logs, `🎲 Background Dweller rerolled a 3️⃣!`]
        };
        
        // Re-evaluate if there's still a 3
        const stillHasThree = newDice.some(d => d.value === '3');
        if (stillHasThree) {
          newState.prompt = {
            playerId: payload.playerId,
            text: 'Reroll a 3?',
            options: [
              { label: 'Yes', action: { type: 'CARD_ACTION', payload: { cardId: 'background_dweller', action: 'reroll', playerId: payload.playerId } } },
              { label: 'No', action: { type: 'CARD_ACTION', payload: { cardId: 'background_dweller', action: 'decline', playerId: payload.playerId } } }
            ] as any
          } as any;
        } else {
          // Auto-resume RESOLVE_DICE
          newState.actionQueue = [...(newState.actionQueue || []), { delayMs: 1000, action: { type: 'RESOLVE_DICE', payload: { playerId: payload.playerId } } }];
        }
        return newState;
      }
    }
  }
};
