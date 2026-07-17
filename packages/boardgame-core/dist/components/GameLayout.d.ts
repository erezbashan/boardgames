import React from 'react';
import './GameLayout.css';
import type { BasePlayer, ChatMessage, GameStatus } from '../engine/types';
export interface GameLayoutProps {
    gameName: string;
    status: GameStatus;
    players: BasePlayer[];
    currentPlayerId?: string;
    chatMessages?: ChatMessage[];
    onStartGame?: () => void;
    onAddBot?: () => void;
    onLeaveGame?: () => void;
    onNewGame?: () => void;
    onSendMessage?: (msg: string) => void;
    helpText?: string;
    renderSettings?: () => React.ReactNode;
    renderGraphics?: () => React.ReactNode;
    renderPlayerDetails?: (playerId: string) => React.ReactNode;
    renderChat?: () => React.ReactNode;
    renderLog?: () => React.ReactNode;
    renderStats?: () => React.ReactNode;
}
export declare const GameLayout: React.FC<GameLayoutProps>;
