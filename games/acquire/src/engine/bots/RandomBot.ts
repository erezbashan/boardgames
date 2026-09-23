import { AcquireState, AcquireAction, Corporation } from '../types';
import { Bot } from './Bot';

const CORPORATIONS: Corporation[] = ['Tower', 'Luxor', 'American', 'Worldwide', 'Festival', 'Imperial', 'Continental'];

export class RandomBot implements Bot {
  name = 'RandomBot';

  takeTurn(state: AcquireState, playerId: string): AcquireAction | null {
    const player = state.players[playerId];
    if (!player) return null;

    if (state.phase === 'PlayTile') {
      if (player.tiles.length === 0) return { type: 'END_TURN', payload: { playerId } };
      const randomTile = player.tiles[Math.floor(Math.random() * player.tiles.length)];
      return { type: 'PLAY_TILE', payload: { playerId, tileId: randomTile.id } };
    }

    if (state.phase === 'FoundCorporation' && state.pendingFounding) {
      const availableCorps = CORPORATIONS.filter(c => !state.corporations[c].isActive);
      if (availableCorps.length > 0) {
        const randomCorp = availableCorps[Math.floor(Math.random() * availableCorps.length)];
        return { type: 'FOUND_CORPORATION', payload: { playerId, corpName: randomCorp } };
      }
    }

    if (state.phase === 'BuyStocks') {
      const activeCorps = CORPORATIONS.filter(c => state.corporations[c].isActive && state.corporations[c].availableStocks > 0);
      if (activeCorps.length > 0 && state.sharesBoughtThisTurn < 3 && Math.random() > 0.5) {
        const affordableCorps = activeCorps.filter(c => state.corporations[c].stockPrice <= player.money);
        if (affordableCorps.length > 0) {
           const randomCorp = affordableCorps[Math.floor(Math.random() * affordableCorps.length)];
           return { type: 'BUY_STOCK', payload: { playerId, corpName: randomCorp } };
        }
      }
      return { type: 'END_TURN', payload: { playerId } };
    }

    if (state.phase === 'ChooseMergeSurvivor' && state.pendingSurvivorChoice) {
      const tiedCorps = state.pendingSurvivorChoice.tiedCorps;
      const randomCorp = tiedCorps[Math.floor(Math.random() * tiedCorps.length)];
      return { type: 'CHOOSE_MERGE_SURVIVOR', payload: { playerId, survivorName: randomCorp } };
    }

    if (state.phase === 'MergeResolution' && state.pendingMerge) {
      const defunct = state.pendingMerge.defunct[state.pendingMerge.currentDefunctIndex];
      const myStocks = player.stocks[defunct] || 0;
      if (myStocks === 0) {
        return { type: 'RESOLVE_MERGE_STOCKS', payload: { playerId, sell: 0, trade: 0, keep: 0 } };
      }
      return { type: 'RESOLVE_MERGE_STOCKS', payload: { playerId, sell: myStocks, trade: 0, keep: 0 } };
    }

    return null;
  }
}
