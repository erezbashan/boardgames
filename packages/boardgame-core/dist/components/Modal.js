"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Modal = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
require("./Modal.css");
const Modal = ({ isOpen, title, onClose, children, width }) => {
    (0, react_1.useEffect)(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        if (isOpen)
            window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);
    if (!isOpen)
        return null;
    return ((0, jsx_runtime_1.jsx)("div", { className: "modal-overlay", onClick: onClose, children: (0, jsx_runtime_1.jsxs)("div", { className: "modal-content", style: { maxWidth: width || '600px' }, onClick: e => e.stopPropagation(), children: [(0, jsx_runtime_1.jsxs)("div", { className: "modal-header", children: [(0, jsx_runtime_1.jsx)("h2", { className: "modal-title", children: title }), (0, jsx_runtime_1.jsx)("button", { className: "modal-close-btn", onClick: onClose, children: "\u00D7" })] }), (0, jsx_runtime_1.jsx)("div", { className: "modal-body", children: children })] }) }));
};
exports.Modal = Modal;
