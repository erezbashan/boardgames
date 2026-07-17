import { CardBehavior } from './types';

export const BackgroundDweller: CardBehavior = {
  id: 'c33',
  onBeforeResolve: (ctx) => {
    const p = ctx.gameState.players[ctx.playerId];
    if (p.flags?.declinedBackgroundDweller) return;
    
    const hasThrees = ctx.gameState.currentDice.some(d => d.face === '3');
    if (hasThrees) {
      return {
        id: 'bg_dweller',
        question: 'Background Dweller: Reroll a 3?',
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no', buttonClass: 'secondary' }
        ]
      };
    }
  },
  onPromptAnswer: (ctx, promptId, answerValue) => {
    if (promptId !== 'bg_dweller') return;
    const p = ctx.gameState.players[ctx.playerId];
    
    if (answerValue === 'no') {
      if (!p.flags) p.flags = {};
      p.flags.declinedBackgroundDweller = true;
      return;
    }
    
    if (answerValue === 'yes') {
      const idx = ctx.gameState.currentDice.findIndex(d => d.face === '3');
      if (idx !== -1) {
        const faces = ['1', '2', '3', 'Heart', 'Lightning', 'Claw'];
        const newFace = faces[Math.floor(Math.random() * faces.length)];
        ctx.gameState.currentDice[idx].face = newFace as any;
        ctx.gameState.currentDice[idx].kept = false;
        ctx.log(`🎲 ${p.name} used Background Dweller to reroll a 3 into a ${newFace}!`);
        ctx.highlight(ctx.playerId, 'card:c33');
      }
      
      if (ctx.gameState.currentDice.some(d => d.face === '3')) {
        return {
          id: 'bg_dweller',
          question: 'Background Dweller: Reroll another 3?',
          options: [
            { label: 'Yes', value: 'yes' },
            { label: 'No', value: 'no', buttonClass: 'secondary' }
          ]
        };
      }
    }
  }
};
