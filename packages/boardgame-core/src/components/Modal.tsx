import React, { useEffect } from 'react';
import './Modal.css';

export interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose?: () => void;
  hideClose?: boolean;
  children: React.ReactNode;
  width?: string;
  inline?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, title, onClose, children, width, hideClose, inline }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => onClose && onClose()} style={inline ? { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 50, borderRadius: '12px' } : {}}>
      <div className="modal-content" style={{ maxWidth: width || '600px', background: inline ? 'rgba(20, 20, 25, 0.8)' : undefined }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          {!hideClose && onClose && <button className="modal-close-btn" onClick={onClose}>&times;</button>}
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};
