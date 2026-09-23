const fs = require('fs');
const file = 'packages/boardgame-core/src/components/Modal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /width\?: string;/,
  'width?: string;\n  inline?: boolean;'
);

content = content.replace(
  /export const Modal: React\.FC<ModalProps> = \(\{ isOpen, title, onClose, children, width, hideClose \}\) => \{/,
  'export const Modal: React.FC<ModalProps> = ({ isOpen, title, onClose, children, width, hideClose, inline }) => {'
);

content = content.replace(
  /<div className="modal-overlay" onClick=\{\(\) => onClose && onClose\(\)\}>/,
  '<div className="modal-overlay" onClick={() => onClose && onClose()} style={inline ? { position: \'absolute\', zIndex: 50, borderRadius: \'12px\' } : {}}>'
);

fs.writeFileSync(file, content);
