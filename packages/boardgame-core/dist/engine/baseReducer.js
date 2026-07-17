"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBaseGameState = createBaseGameState;
exports.baseReducer = baseReducer;
const types_1 = require("./types");
function createBaseGameState() {
    return {
        status: 'Lobby',
        players: {},
        playerOrder: [],
        winnerId: null,
        chatMessages: []
    };
}
function baseReducer(state, action) {
    switch (action.type) {
        case 'JOIN_GAME': {
            if (state.status !== 'Lobby')
                return state;
            const { playerId, name, isBot } = action.payload;
            if (state.players[playerId])
                return state; // Already joined
            const newPlayerOrder = [...state.playerOrder, playerId];
            const color = types_1.PLAYER_COLORS[newPlayerOrder.length % types_1.PLAYER_COLORS.length];
            return {
                ...state,
                players: {
                    ...state.players,
                    [playerId]: { id: playerId, name, isBot, color }
                },
                playerOrder: newPlayerOrder
            };
        }
        case 'START_GAME': {
            if (state.status !== 'Lobby' || state.playerOrder.length === 0)
                return state;
            return { ...state, status: 'Playing' };
        }
        case 'NEW_GAME': {
            // Keep players but reset status and chat
            return {
                ...state,
                status: 'Lobby',
                winnerId: null,
                chatMessages: []
            };
        }
        case 'SEND_CHAT_MESSAGE': {
            return {
                ...state,
                chatMessages: [...state.chatMessages, action.payload]
            };
        }
        default:
            return state;
    }
}
