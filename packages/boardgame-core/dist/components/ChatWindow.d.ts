import React from 'react';
import type { ChatMessage } from '../engine/types';
export interface ChatWindowProps {
    messages: ChatMessage[];
    onSendMessage: (msg: string) => void;
}
export declare const ChatWindow: React.FC<ChatWindowProps>;
