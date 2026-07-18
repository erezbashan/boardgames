import React, { useState, useRef, useEffect } from 'react';
import { Modal } from './Modal';

export interface GameLogProps {
  logs: React.ReactNode[];
}

export const GameLog: React.FC<GameLogProps> = ({ logs }) => {
  const [showAll, setShowAll] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px', marginBottom: '10px' }}>
        <h4 style={{ margin: 0, fontSize: '18px' }}>Game Log</h4>
        <button onClick={() => setShowAll(true)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '12px' }}>See All</button>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '10px' }}>
        {logs.length === 0 && <p style={{ margin: '5px 0', fontSize: '14px', color: 'gray' }}>Game created.</p>}
        {logs.map((l, i) => {
          if (l === '---') {
            return <hr key={i} style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '10px 0' }} />;
          }
          return <p key={i} style={{ margin: '5px 0', fontSize: '14px' }}>{l}</p>;
        })}
      </div>

      <Modal isOpen={showAll} title="Full Game Log" onClose={() => setShowAll(false)} width="600px">
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {logs.map((l, i) => {
            if (l === '---') {
              return <hr key={i} style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '15px 0' }} />;
            }
            return <p key={i} style={{ margin: '8px 0', fontSize: '16px' }}>{l}</p>;
          })}
        </div>
      </Modal>
    </div>
  );
};
