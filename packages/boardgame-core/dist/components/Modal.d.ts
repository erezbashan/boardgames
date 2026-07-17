import React from 'react';
import './Modal.css';
export interface ModalProps {
    isOpen: boolean;
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    width?: string;
}
export declare const Modal: React.FC<ModalProps>;
