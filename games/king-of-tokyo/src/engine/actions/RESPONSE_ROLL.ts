import { KotState, PendingAction } from '../types';
import { DICE_FACES, addLog } from '../utils';

export function handleResponseRoll(st: KotState, action: PendingAction, pId: string) {
  if (action.payload.roll) {
    // Log intermediate bot decisions so humans can see them "think"
    if (st.players[pId]?.isBot) {
       const emojiMap: Record<string, string> = { Heart: '❤️', Energy: '⚡', Smash: '💥', '1': '1️⃣', '2': '2️⃣', '3': '3️⃣' };
       const keptIds = st.rollCount === st.maxRolls ? [] : (action.payload.keptDiceIds || []);
       const keptStr = st.dice.filter(d => keptIds.includes(d.id)).map(d => emojiMap[d.value] || d.value).join(' ');
       const rerollCount = st.dice.length - keptIds.length;
       if (st.rollCount === st.maxRolls) {
          addLog(st, action, `${st.players[pId].name} rolled ${st.dice.length} dice...`);
       } else {
          addLog(st, action, `${st.players[pId].name} kept [ ${keptStr} ] and rerolled ${rerollCount} dice...`);
       }
    }

    const finalKeptIds = st.rollCount === st.maxRolls ? [] : (action.payload.keptDiceIds || []);
    st.dice = st.dice.map(d => finalKeptIds.includes(d.id) ? { ...d, kept: true } : { ...d, value: DICE_FACES[Math.floor(Math.random() * DICE_FACES.length)], kept: false });
    st.rollCount -= 1;
    if (st.rollCount > 0) {
      st.pendingActions.unshift({ type: 'ASK_ROLL', playerId: pId, payload: {
         prompt: {
           playerId: pId,
           text: 'Roll Dice?',
           options: []
         }
      } });
    }
  }
  if (!action.payload.roll || st.rollCount === 0) {
      const emojiMap: Record<string, string> = { Heart: '❤️', Energy: '⚡', Smash: '💥', '1': '1️⃣', '2': '2️⃣', '3': '3️⃣' };
      const outcomeStr = st.dice.map(d => emojiMap[d.value] || d.value).join(' ');
      st.turnContext = st.turnContext || {};
      st.turnContext.originalRollStr = outcomeStr;
      addLog(st, action, `${st.players[pId].name} finished rolling: ${outcomeStr}`);
  }
}
