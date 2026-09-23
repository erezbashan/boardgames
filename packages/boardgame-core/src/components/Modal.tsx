import React, { useEffect } from 'react';
import './Modal.css';

export interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose?: () => void;
  hideClose?: boolean;
  children: React.ReactNode;
  width?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, title, onClose, children, width, hideClose }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => onClose && onClose()}>
      <div className="modal-content" style={{ maxWidth: width || '600px' }} onClick={e => e.stopPropagation()}>
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
