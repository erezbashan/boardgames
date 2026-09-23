import { getGame } from './packages/boardgame-core/dist/registry/GameRegistry.js';
import { runSimulationBatch } from './packages/boardgame-core/dist/engine/simulateGame.js';
import './games/king-of-tokyo/dist/index.js'; // Register KoT

const game = getGame('king-of-tokyo');

const pConfigs = [
  { id: 'bot_en_focused', botStrategy: 'rule:{"vp":0,"en":20,"hl":8,"at":2,"yd":6}' }, // Focus on EN
  { id: 'bot_vp_focused', botStrategy: 'rule:{"vp":15,"en":0,"hl":8,"at":2,"yd":6}' } // Focus on VP
];

runSimulationBatch(game.reducer, game.initialState, pConfigs, 100, (results) => {
  let totalCardsBought = 0;
  
  results.forEach(res => {
     Object.values(res.players).forEach(p => {
       totalCardsBought += (p.stats?.cardsBought || 0);
     });
  });
  
  console.log(`Total games: 100`);
  console.log(`Total cards bought across all bots: ${totalCardsBought}`);

  const enBotStats = { wins: 0, cardsBought: 0 };
  const vpBotStats = { wins: 0, cardsBought: 0 };
  
  results.forEach(res => {
     if (res.winnerId === 'bot_en_focused') enBotStats.wins++;
     if (res.winnerId === 'bot_vp_focused') vpBotStats.wins++;
     
     const enP = res.players['bot_en_focused'];
     const vpP = res.players['bot_vp_focused'];
     
     enBotStats.cardsBought += (enP.stats?.cardsBought || 0);
     
     vpBotStats.cardsBought += (vpP.stats?.cardsBought || 0);
  });
  
  console.log('--- EN BOT STATS ---');
  console.log(enBotStats);
  
  console.log('--- VP BOT STATS ---');
  console.log(vpBotStats);
});
