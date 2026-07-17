"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatWindow = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const Modal_1 = require("./Modal");
const ChatWindow = ({ messages, onSendMessage }) => {
    const [msg, setMsg] = (0, react_1.useState)('');
    const [showAll, setShowAll] = (0, react_1.useState)(false);
    const handleSend = () => {
        if (msg.trim()) {
            onSendMessage(msg.trim());
            setMsg('');
        }
    };
    const recentMessages = [...messages].reverse().slice(0, 5);
    return ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', height: '100%', padding: '10px' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px', marginBottom: '10px' }, children: [(0, jsx_runtime_1.jsx)("h4", { style: { margin: 0, fontSize: '18px' }, children: "Chat" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setShowAll(true), style: { background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '12px' }, children: "See All" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { flex: 1, overflow: 'hidden', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '10px', marginBottom: '10px', display: 'flex', flexDirection: 'column-reverse' }, children: [messages.length === 0 && (0, jsx_runtime_1.jsx)("p", { style: { margin: '5px 0', fontSize: '14px', color: 'gray' }, children: "Say hello!" }), recentMessages.map((m, i) => ((0, jsx_runtime_1.jsxs)("p", { style: { margin: '5px 0', fontSize: '14px' }, children: [(0, jsx_runtime_1.jsxs)("strong", { style: { color: m.color || '#3b82f6' }, children: [m.sender, ":"] }), " ", m.text] }, i)))] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '8px' }, children: [(0, jsx_runtime_1.jsx)("input", { className: "modern-input", style: { margin: 0, padding: '8px', flex: 1 }, value: msg, onChange: e => setMsg(e.target.value), onKeyDown: e => e.key === 'Enter' && handleSend(), placeholder: "Say something..." }), (0, jsx_runtime_1.jsx)("button", { className: "btn primary", onClick: handleSend, disabled: !msg.trim(), style: { padding: '8px 16px' }, children: "Send" })] }), (0, jsx_runtime_1.jsx)(Modal_1.Modal, { isOpen: showAll, title: "Chat History", onClose: () => setShowAll(false), width: "600px", children: (0, jsx_runtime_1.jsx)("div", { style: { maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }, children: messages.map((m, i) => ((0, jsx_runtime_1.jsxs)("p", { style: { margin: '10px 0', fontSize: '16px' }, children: [(0, jsx_runtime_1.jsxs)("strong", { style: { color: m.color || '#3b82f6' }, children: [m.sender, ":"] }), " ", m.text] }, i))) }) })] }));
};
exports.ChatWindow = ChatWindow;
