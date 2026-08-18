export interface GameDefinition {
  reducer: (state: any, action: any) => any;
  initialState: any;
}

class Registry {
  private games: Record<string, GameDefinition> = {};

  registerGame(gameType: string, definition: GameDefinition) {
    this.games[gameType] = definition;
  }

  getGame(gameType: string): GameDefinition {
    const game = this.games[gameType];
    if (!game) {
      throw new Error(`Game ${gameType} is not registered.`);
    }
    return game;
  }
}

export const GameRegistry = new Registry();
export const registerGame = GameRegistry.registerGame.bind(GameRegistry);
export const getGame = GameRegistry.getGame.bind(GameRegistry);
