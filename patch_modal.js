const fs = require('fs');
const file = 'packages/boardgame-core/src/components/Modal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /onClose: \(\) => void;/,
  'onClose?: () => void;\n  hideClose?: boolean;'
);

content = content.replace(
  /export const Modal: React\.FC<ModalProps> = \(\{ isOpen, title, onClose, children, width \}\) => \{/,
  'export const Modal: React.FC<ModalProps> = ({ isOpen, title, onClose, children, width, hideClose }) => {'
);

content = content.replace(
  /if \(e\.key === 'Escape'\) onClose\(\);/,
  'if (e.key === \'Escape\' && onClose) onClose();'
);

content = content.replace(
  /<div className="modal-overlay" onClick=\{onClose\}>/,
  '<div className="modal-overlay" onClick={() => onClose && onClose()}>'
);

content = content.replace(
  /<button className="modal-close-btn" onClick=\{onClose\}>&times;<\/button>/,
  '{!hideClose && onClose && <button className="modal-close-btn" onClick={onClose}>&times;</button>}'
);

fs.writeFileSync(file, content);
