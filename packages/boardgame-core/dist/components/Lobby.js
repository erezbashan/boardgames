"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lobby = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
require("./Lobby.css");
const Lobby = ({ title = "Game Lobby", initialUsername = "", pendingGames = [], onCreateGame, onJoinGame }) => {
    const [username, setUsername] = (0, react_1.useState)(initialUsername);
    const handleCreate = () => {
        if (username.trim())
            onCreateGame(username.trim());
    };
    const handleJoin = (targetGameId) => {
        if (username.trim()) {
            onJoinGame(targetGameId, username.trim());
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "lobby-container", children: [(0, jsx_runtime_1.jsx)("h1", { className: "lobby-title", children: title }), (0, jsx_runtime_1.jsxs)("div", { className: "lobby-card glass-panel", children: [(0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Your Name", value: username, onChange: e => setUsername(e.target.value), className: "modern-input", autoComplete: "off" }), (0, jsx_runtime_1.jsx)("button", { onClick: handleCreate, disabled: !username.trim(), className: "btn primary", children: "Create New Game" })] }), pendingGames.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "lobby-card glass-panel", style: { marginTop: '24px' }, children: [(0, jsx_runtime_1.jsx)("h3", { style: { margin: '0 0 16px 0', textAlign: 'center' }, children: "Open Games" }), (0, jsx_runtime_1.jsx)("div", { className: "pending-games-list", children: pendingGames.map(game => ((0, jsx_runtime_1.jsxs)("div", { className: "pending-game-item", children: [(0, jsx_runtime_1.jsxs)("div", { className: "game-info", children: [(0, jsx_runtime_1.jsx)("span", { className: "game-id", children: game.id }), (0, jsx_runtime_1.jsxs)("span", { className: "game-meta", children: [game.playersCount, " players waiting"] })] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => handleJoin(game.id), disabled: !username.trim(), className: "btn secondary", style: { padding: '8px 16px', fontSize: '14px' }, children: "Join" })] }, game.id))) })] }))] }));
};
exports.Lobby = Lobby;
