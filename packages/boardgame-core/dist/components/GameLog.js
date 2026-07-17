"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameLog = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const Modal_1 = require("./Modal");
const GameLog = ({ logs }) => {
    const [showAll, setShowAll] = (0, react_1.useState)(false);
    const scrollRef = (0, react_1.useRef)(null);
    // Auto-scroll to bottom
    (0, react_1.useEffect)(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);
    return ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', height: '100%', padding: '10px' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px', marginBottom: '10px' }, children: [(0, jsx_runtime_1.jsx)("h4", { style: { margin: 0, fontSize: '18px' }, children: "Game Log" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setShowAll(true), style: { background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '12px' }, children: "See All" })] }), (0, jsx_runtime_1.jsxs)("div", { ref: scrollRef, style: { flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '10px' }, children: [logs.length === 0 && (0, jsx_runtime_1.jsx)("p", { style: { margin: '5px 0', fontSize: '14px', color: 'gray' }, children: "Game created." }), logs.map((l, i) => {
                        if (l === '---') {
                            return (0, jsx_runtime_1.jsx)("hr", { style: { borderColor: 'rgba(255,255,255,0.1)', margin: '10px 0' } }, i);
                        }
                        return (0, jsx_runtime_1.jsxs)("p", { style: { margin: '5px 0', fontSize: '14px' }, children: ["- ", l] }, i);
                    })] }), (0, jsx_runtime_1.jsx)(Modal_1.Modal, { isOpen: showAll, title: "Full Game Log", onClose: () => setShowAll(false), width: "600px", children: (0, jsx_runtime_1.jsx)("div", { style: { maxHeight: '60vh', overflowY: 'auto' }, children: logs.map((l, i) => {
                        if (l === '---') {
                            return (0, jsx_runtime_1.jsx)("hr", { style: { borderColor: 'rgba(255,255,255,0.1)', margin: '15px 0' } }, i);
                        }
                        return (0, jsx_runtime_1.jsxs)("p", { style: { margin: '8px 0', fontSize: '16px' }, children: ["- ", l] }, i);
                    }) }) })] }));
};
exports.GameLog = GameLog;
