import React from 'react';
import type { FlipsState, FlipsAction } from '../engine/reducer';
interface FlipsBoardProps {
    gameState: FlipsState;
    myPlayerId: string;
    dispatch: (action: FlipsAction) => void;
    onLeaveGame: () => void;
}
export declare const FlipsBoard: React.FC<FlipsBoardProps>;
export {};
