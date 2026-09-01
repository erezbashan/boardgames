import { runSimulationBatch } from "@erez/boardgame-core/dist/engine/simulateGame";
import { kingOfTokyoReducer, initialKotState } from "@erez/king-of-tokyo";

const pConfigs = [
  { id: 'bot_en_focused', botStrategy: 'rule:{"vp":0,"en":20,"hl":8,"at":2,"yd":6}' },
  { id: 'bot_vp_focused', botStrategy: 'rule:{"vp":15,"en":0,"hl":8,"at":2,"yd":6}' }
];

runSimulationBatch(kingOfTokyoReducer, initialKotState, pConfigs, 100, (results) => {
  let totalCardsBought = 0;
  
  results.forEach((res: any) => {
     Object.values(res.players).forEach((p: any) => {
       totalCardsBought += (p.stats?.cardsBought || 0);
     });
  });
  
  console.log(`Total games: 100`);
  console.log(`Total cards bought across all bots: ${totalCardsBought}`);

  const enBotStats = { wins: 0, cardsBought: 0 };
  const vpBotStats = { wins: 0, cardsBought: 0 };
  
  results.forEach((res: any) => {
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
