import { SplendorGameState, GemType, BaseGemTypes, Card } from './types';

export function generateAnimationSteps(oldState: SplendorGameState, newState: SplendorGameState): SplendorGameState[] {
   const steps: SplendorGameState[] = [];
   let current = JSON.parse(JSON.stringify(oldState)) as SplendorGameState;
   
   const prevPIdx = oldState.currentPlayerIndex;
   const pId = oldState.playerOrder[prevPIdx]; // The player who took the action
   const oldP = oldState.players[pId];
   const newP = newState.players[pId];

   if (!oldP || !newP) return [newState];

   // 1. Paid Gems (Remove from player one by one)
   const paidGems: GemType[] = [];
   for (const g of [...BaseGemTypes, 'gold'] as GemType[]) {
      const diff = oldP.gems[g] - newP.gems[g];
      for (let i = 0; i < diff; i++) paidGems.push(g);
   }
   paidGems.forEach(g => {
      current = JSON.parse(JSON.stringify(current));
      current.players[pId].gems[g]--;
      current.bank[g]++;
      steps.push(current);
   });

   // 2. Card Removed from Grid
   let cardRemoved = false;
   [1, 2, 3].forEach(tier => {
      const t = `tier${tier}` as 'tier1'|'tier2'|'tier3';
      for (let i = 0; i < 4; i++) {
         const oldC = oldState.board[t][i];
         const newC = newState.board[t][i];
         if (oldC && (!newC || oldC.id !== newC.id)) {
            current = JSON.parse(JSON.stringify(current));
            current.board[t][i] = null;
            cardRemoved = true;
         }
      }
   });
   if (cardRemoved) steps.push(current);

   // 3. Card Appeared in Hand (Purchased)
   let cardAdded = false;
   if (newP.cards.length > oldP.cards.length) {
      const newIds = newP.cards.map((c: Card) => c.id);
      const oldIds = oldP.cards.map((c: Card) => c.id);
      const addedIds = newIds.filter(id => !oldIds.includes(id));
      addedIds.forEach(id => {
         const card = newP.cards.find((c: Card) => c.id === id)!;
         current = JSON.parse(JSON.stringify(current));
         current.players[pId].cards.push(card);
         current.players[pId].score = newP.score;
         // Clean up reserved if it came from there
         current.players[pId].reservedCards = current.players[pId].reservedCards.filter((c: Card) => c.id !== id);
         cardAdded = true;
      });
   }
   
   // Or Card Appeared in Reserved
   if (newP.reservedCards.length > oldP.reservedCards.length) {
      const newIds = newP.reservedCards.map((c: Card) => c.id);
      const oldIds = oldP.reservedCards.map((c: Card) => c.id);
      const addedIds = newIds.filter(id => !oldIds.includes(id));
      addedIds.forEach(id => {
         const card = newP.reservedCards.find((c: Card) => c.id === id)!;
         current = JSON.parse(JSON.stringify(current));
         current.players[pId].reservedCards.push(card);
         cardAdded = true;
      });
   }
   if (cardAdded) steps.push(current);

   // 4. New Card Appeared in Grid
   let gridFilled = false;
   [1, 2, 3].forEach(tier => {
      const t = `tier${tier}` as 'tier1'|'tier2'|'tier3';
      for (let i = 0; i < 4; i++) {
         const oldC = oldState.board[t][i];
         const newC = newState.board[t][i];
         if (newC && (!oldC || oldC.id !== newC.id)) {
            current = JSON.parse(JSON.stringify(current));
            current.board[t][i] = newC;
            gridFilled = true;
         }
      }
   });
   if (gridFilled) steps.push(current);

   // 5. Gems Acquired (Appear in hand one by one)
   const gainedGems: GemType[] = [];
   for (const g of [...BaseGemTypes, 'gold'] as GemType[]) {
      const diff = newP.gems[g] - oldP.gems[g];
      for (let i = 0; i < diff; i++) gainedGems.push(g);
   }
   gainedGems.forEach(g => {
      current = JSON.parse(JSON.stringify(current));
      current.players[pId].gems[g]++;
      current.bank[g]--;
      steps.push(current);
   });

   // 6. Nobles Visited
   if (newP.nobles.length > oldP.nobles.length) {
      const newIds = newP.nobles.map((n: any) => n.id);
      const oldIds = oldP.nobles.map((n: any) => n.id);
      const addedIds = newIds.filter(id => !oldIds.includes(id));
      addedIds.forEach(id => {
         const noble = newP.nobles.find((n: any) => n.id === id)!;
         current = JSON.parse(JSON.stringify(current));
         current.players[pId].nobles.push(noble);
         current.nobles = current.nobles.filter((n: any) => n.id !== id);
         steps.push(current);
      });
   }

   steps.push(newState);
   return steps;
}
