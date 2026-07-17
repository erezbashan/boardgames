"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlipsBoard = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const boardgame_core_1 = require("@erez/boardgame-core");
const FlipsBoard = ({ gameState, myPlayerId, dispatch, onLeaveGame }) => {
    const { status, targetScore, players, playerOrder, currentPlayerIndex, winnerId, lastFlipResult, chatMessages } = gameState;
    const [logs, setLogs] = (0, react_1.useState)([]);
    // Base players for framework
    const basePlayers = playerOrder.map((id) => players[id]);
    const currentPlayerId = playerOrder[currentPlayerIndex];
    const isMyTurn = currentPlayerId === myPlayerId;
    const iAmWinner = winnerId === myPlayerId;
    // Track logs
    (0, react_1.useEffect)(() => {
        if (lastFlipResult) {
            const p = players[lastFlipResult.playerId];
            const resultText = lastFlipResult.isHeads ? 'Heads (+1)' : 'Tails';
            setLogs(prev => [
                ...prev,
                (0, jsx_runtime_1.jsxs)("span", { children: [(0, jsx_runtime_1.jsx)("strong", { style: { color: p.color }, children: p.name }), " flipped ", resultText] }, prev.length),
                '---'
            ]);
        }
    }, [lastFlipResult, players]);
    const isHost = playerOrder.length > 0 && playerOrder[0] === myPlayerId;
    // Bot Auto-Play Logic & Chatter (Only Host runs this to prevent duplicate actions)
    (0, react_1.useEffect)(() => {
        if (!isHost)
            return;
        if (status === 'Playing' && currentPlayerId) {
            const currentPlayer = players[currentPlayerId];
            if (currentPlayer.isBot) {
                const timer = setTimeout(() => {
                    const isHeads = Math.random() > 0.5;
                    dispatch({ type: 'FLIP_COIN', payload: { playerId: currentPlayerId, isHeads } });
                }, 1500);
                // Random chatter
                const humanSpoke = chatMessages.some(m => m.sender === players[myPlayerId]?.name);
                if (!humanSpoke && Math.random() > 0.7) {
                    const chatTimer = setTimeout(() => {
                        const msgs = ["I'm feeling lucky!", "Tails never fails...", "Beep boop, calculating flip...", "You humans stand no chance!"];
                        const msg = msgs[Math.floor(Math.random() * msgs.length)];
                        dispatch({ type: 'SEND_CHAT_MESSAGE', payload: { sender: currentPlayer.name, text: msg, color: currentPlayer.color } });
                    }, 800);
                    return () => { clearTimeout(timer); clearTimeout(chatTimer); };
                }
                return () => clearTimeout(timer);
            }
        }
    }, [status, currentPlayerId, players, dispatch, chatMessages, isHost, myPlayerId]);
    const handleStart = () => dispatch({ type: 'START_GAME' });
    const handleAddBot = () => {
        const botId = 'bot-' + Math.random().toString(36).substring(2, 6);
        const botName = boardgame_core_1.BOT_NAMES[Math.floor(Math.random() * boardgame_core_1.BOT_NAMES.length)];
        dispatch({ type: 'JOIN_GAME', payload: { playerId: botId, name: botName, isBot: true } });
    };
    const handleFlip = () => {
        if (!isMyTurn || status !== 'Playing')
            return;
        const isHeads = Math.random() > 0.5;
        dispatch({ type: 'FLIP_COIN', payload: { playerId: myPlayerId, isHeads } });
    };
    const renderSettings = () => ((0, jsx_runtime_1.jsxs)("div", { style: { padding: '20px', textAlign: 'center' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { margin: '20px' }, children: [(0, jsx_runtime_1.jsx)("label", { style: { fontSize: '18px', marginRight: '10px' }, children: "Target Score to Win:" }), (0, jsx_runtime_1.jsx)("input", { type: "number", value: targetScore, onChange: e => dispatch({ type: 'SET_TARGET_SCORE', payload: { targetScore: parseInt(e.target.value) || 1 } }), disabled: status !== 'Lobby', className: "modern-input", style: { width: '100px', display: 'inline-block' } })] }), status === 'Lobby' && (0, jsx_runtime_1.jsx)("p", { style: { color: 'gray' }, children: "Waiting for the host to start the game..." })] }));
    const renderGraphics = () => ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '20px' }, children: [status === 'Finished' && ((0, jsx_runtime_1.jsx)("div", { style: { padding: '15px 40px', background: iAmWinner ? '#22c55e' : 'rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', marginBottom: '30px', textAlign: 'center', fontSize: '32px', fontWeight: 'bold' }, children: iAmWinner ? "🏆 You Won!" : `Winner: ${players[winnerId].name}` })), lastFlipResult && ((0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: '40px', fontSize: '24px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px' }, children: [(0, jsx_runtime_1.jsx)("strong", { style: { color: players[lastFlipResult.playerId]?.color }, children: players[lastFlipResult.playerId].name }), " flipped a coin and got:", (0, jsx_runtime_1.jsx)("div", { style: {
                            color: lastFlipResult.isHeads ? '#4ade80' : '#ef4444',
                            marginTop: '10px',
                            fontWeight: 'bold',
                            fontSize: '48px'
                        }, children: lastFlipResult.isHeads ? 'HEADS (+1)' : 'TAILS' })] })), status !== 'Finished' && ((0, jsx_runtime_1.jsx)("button", { className: "btn primary", onClick: handleFlip, disabled: !isMyTurn || status !== 'Playing', style: {
                    padding: '30px 60px',
                    fontSize: '32px',
                    cursor: isMyTurn && status === 'Playing' ? 'pointer' : 'not-allowed',
                    opacity: isMyTurn && status === 'Playing' ? 1 : 0.5,
                    borderRadius: '16px',
                    boxShadow: isMyTurn && status === 'Playing' ? '0 0 30px rgba(74, 222, 128, 0.4)' : 'none'
                }, children: isMyTurn && status === 'Playing' ? "🎲 FLIP COIN" : "Waiting for turn..." }))] }));
    const renderPlayerDetails = (playerId) => {
        const p = players[playerId];
        return ((0, jsx_runtime_1.jsx)("div", { style: { marginTop: '10px', textAlign: 'center' }, children: (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '36px', fontWeight: 'bold', color: p.score >= targetScore ? '#4ade80' : 'white' }, children: [p.score, " ", (0, jsx_runtime_1.jsx)("span", { style: { fontSize: '14px', color: 'gray', fontWeight: 'normal' }, children: "pts" })] }) }));
    };
    const renderStats = () => {
        const maxTurns = Math.max(1, ...Object.values(players).map(p => p.pointsHistory.length - 1));
        const sortedPlayers = [...playerOrder].sort((a, b) => players[b].score - players[a].score);
        // Compute exact SVG dimensions
        const svgWidth = Math.max(600, maxTurns * 60);
        const svgHeight = 200;
        return ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', gap: '30px' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px' }, children: [(0, jsx_runtime_1.jsx)("h3", { style: { margin: '0 0 15px 0' }, children: "Final Standings" }), (0, jsx_runtime_1.jsxs)("table", { style: { width: '100%', textAlign: 'left', borderCollapse: 'collapse' }, children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { style: { borderBottom: '1px solid rgba(255,255,255,0.2)' }, children: [(0, jsx_runtime_1.jsx)("th", { style: { padding: '10px' }, children: "Player" }), (0, jsx_runtime_1.jsx)("th", { style: { padding: '10px' }, children: "Points" }), (0, jsx_runtime_1.jsx)("th", { style: { padding: '10px' }, children: "Heads" }), (0, jsx_runtime_1.jsx)("th", { style: { padding: '10px' }, children: "Tails" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: sortedPlayers.map((id, index) => {
                                        const p = players[id];
                                        return ((0, jsx_runtime_1.jsxs)("tr", { style: { borderBottom: '1px solid rgba(255,255,255,0.05)' }, children: [(0, jsx_runtime_1.jsxs)("td", { style: { padding: '10px', color: p.color, fontWeight: 'bold' }, children: [index === 0 && '🏆 ', " ", p.name] }), (0, jsx_runtime_1.jsx)("td", { style: { padding: '10px', fontSize: '1.2em', fontWeight: 'bold' }, children: p.score }), (0, jsx_runtime_1.jsx)("td", { style: { padding: '10px', color: '#4ade80' }, children: p.headsCount }), (0, jsx_runtime_1.jsx)("td", { style: { padding: '10px', color: '#ef4444' }, children: p.tailsCount })] }, id));
                                    }) })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { style: { margin: '0 0 15px 0' }, children: "Points Progression" }), (0, jsx_runtime_1.jsx)("div", { style: { background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px', overflowX: 'auto' }, children: (0, jsx_runtime_1.jsxs)("svg", { width: svgWidth, height: svgHeight, style: { overflow: 'visible', margin: '10px' }, children: [(0, jsx_runtime_1.jsx)("line", { x1: "0", y1: svgHeight, x2: svgWidth, y2: svgHeight, stroke: "rgba(255,255,255,0.2)", strokeWidth: "2" }), (0, jsx_runtime_1.jsx)("line", { x1: "0", y1: "0", x2: "0", y2: svgHeight, stroke: "rgba(255,255,255,0.2)", strokeWidth: "2" }), playerOrder.map(id => {
                                        const p = players[id];
                                        const color = p.color || 'white';
                                        // Construct polyline points using absolute pixels
                                        const points = p.pointsHistory.map((pts, idx) => {
                                            const x = (idx / maxTurns) * svgWidth;
                                            const y = svgHeight - ((pts / targetScore) * svgHeight);
                                            return `${x},${y}`;
                                        }).join(' ');
                                        return ((0, jsx_runtime_1.jsxs)("g", { children: [(0, jsx_runtime_1.jsx)("polyline", { fill: "none", stroke: color, strokeWidth: "4", strokeLinejoin: "round", points: points }), p.pointsHistory.map((pts, idx) => {
                                                    const x = (idx / maxTurns) * svgWidth;
                                                    const y = svgHeight - ((pts / targetScore) * svgHeight);
                                                    return (0, jsx_runtime_1.jsx)("circle", { cx: x, cy: y, r: "5", fill: color }, idx);
                                                })] }, id));
                                    })] }) })] })] }));
    };
    const handleSendMessage = (msg) => {
        dispatch({ type: 'SEND_CHAT_MESSAGE', payload: { sender: players[myPlayerId]?.name || 'You', text: msg, color: players[myPlayerId]?.color } });
    };
    return ((0, jsx_runtime_1.jsx)(boardgame_core_1.GameLayout, { gameName: "Flips", status: status, players: basePlayers, currentPlayerId: currentPlayerId, chatMessages: chatMessages, onSendMessage: handleSendMessage, onStartGame: status === 'Lobby' ? handleStart : undefined, onAddBot: status === 'Lobby' ? handleAddBot : undefined, onNewGame: () => onLeaveGame(), onLeaveGame: onLeaveGame, helpText: "Flips: First to target points wins! Click FLIP COIN to test your luck.", renderSettings: renderSettings, renderGraphics: renderGraphics, renderPlayerDetails: renderPlayerDetails, renderLog: () => (0, jsx_runtime_1.jsx)(boardgame_core_1.GameLog, { logs: logs }), renderStats: renderStats }));
};
exports.FlipsBoard = FlipsBoard;
