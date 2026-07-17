import React from 'react';
import './Lobby.css';
export interface PendingGame {
    id: string;
    gameType: string;
    playersCount: number;
    status: string;
}
export interface LobbyProps {
    title?: string;
    initialUsername?: string;
    pendingGames?: PendingGame[];
    onCreateGame: (username: string) => void;
    onJoinGame: (gameId: string, username: string) => void;
}
export declare const Lobby: React.FC<LobbyProps>;
