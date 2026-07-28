import { CardImplementation } from './types';
import { KotState, PendingAction } from '../types';

export const BackgroundSecurity: CardImplementation = {
  id: 'background_security',
  name: 'Background Security',
  cost: 4,
  type: 'Keep',
  description: 'You get 1 extra reroll.',
  onPreEvent: (st: KotState, action: PendingAction, pId: string) => {
    if (action.type === 'START_TURN' && action.playerId === pId) {
      st.turnContext = st.turnContext || {};
      st.turnContext.maxRolls = (st.turnContext.maxRolls || 3) + 1;
    }
    return st;
  }
};
