import type { BaseGameState, BaseAction } from './types';
export declare function createBaseGameState(): BaseGameState;
export declare function baseReducer<T extends BaseGameState>(state: T, action: BaseAction | any): T;
