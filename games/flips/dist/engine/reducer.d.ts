import type { BaseGameState, BaseAction } from '@erez/boardgame-core';
export interface FlipsPlayer {
    id: string;
    name: string;
    isBot: boolean;
    color?: string;
    score: number;
    headsCount: number;
    tailsCount: number;
    pointsHistory: number[];
}
export interface FlipsState extends BaseGameState {
    targetScore: number;
    currentPlayerIndex: number;
    players: Record<string, FlipsPlayer>;
    lastFlipResult: {
        playerId: string;
        isHeads: boolean;
    } | null;
}
export type FlipsAction = BaseAction | {
    type: 'FLIP_COIN';
    payload: {
        playerId: string;
        isHeads: boolean;
    };
} | {
    type: 'SET_TARGET_SCORE';
    payload: {
        targetScore: number;
    };
};
export declare const initialFlipsState: FlipsState;
export declare function flipsReducer(state: FlipsState, action: FlipsAction): FlipsState;
