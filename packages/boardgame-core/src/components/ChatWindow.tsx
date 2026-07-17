import React, { useState } from 'react';
import { Modal } from './Modal';
import type { ChatMessage } from '../engine/types';

export interface ChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSendMessage }) => {
  const [msg, setMsg] = useState('');
  const [showAll, setShowAll] = useState(false);

  const handleSend = () => {
    if (msg.trim()) {
      onSendMessage(msg.trim());
      setMsg('');
    }
  };

  const recentMessages = [...messages].reverse().slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px', marginBottom: '10px' }}>
        <h4 style={{ margin: 0, fontSize: '18px' }}>Chat</h4>
        <button onClick={() => setShowAll(true)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '12px' }}>See All</button>
      </div>
      
      <div style={{ flex: 1, overflow: 'hidden', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '10px', marginBottom: '10px', display: 'flex', flexDirection: 'column-reverse' }}>
        {messages.length === 0 && <p style={{ margin: '5px 0', fontSize: '14px', color: 'gray' }}>Say hello!</p>}
        {recentMessages.map((m, i) => (
          <p key={i} style={{ margin: '5px 0', fontSize: '14px' }}>
            <strong style={{ color: (m as any).color || '#3b82f6' }}>{m.sender}:</strong> {m.text}
          </p>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input 
          className="modern-input" 
          style={{ margin: 0, padding: '8px', flex: 1 }} 
          value={msg} 
          onChange={e => setMsg(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Say something..." 
        />
        <button className="btn primary" onClick={handleSend} disabled={!msg.trim()} style={{ padding: '8px 16px' }}>Send</button>
      </div>

      <Modal isOpen={showAll} title="Chat History" onClose={() => setShowAll(false)} width="600px">
        <div style={{ maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {messages.map((m, i) => (
            <p key={i} style={{ margin: '10px 0', fontSize: '16px' }}>
              <strong style={{ color: (m as any).color || '#3b82f6' }}>{m.sender}:</strong> {m.text}
            </p>
          ))}
        </div>
      </Modal>
    </div>
  );
};
