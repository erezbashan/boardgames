import React, { useEffect, useRef, useState } from 'react';

// Include the keyframes inline so it works standalone
const styleId = 'animated-counter-styles';
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = `
    @keyframes pulse-green {
      0% { transform: scale(1); color: #4ade80; }
      50% { transform: scale(2.5); color: #4ade80; }
      100% { transform: scale(1); color: inherit; }
    }
    @keyframes pulse-red {
      0% { transform: scale(1); color: #ef4444; }
      50% { transform: scale(2.5); color: #ef4444; }
      100% { transform: scale(1); color: inherit; }
    }
    .pulse-green { animation: pulse-green 1.5s ease-out; }
    .pulse-red { animation: pulse-red 1.5s ease-out; }
  `;
  document.head.appendChild(style);
}

export const AnimatedCounter = ({ value, icon, color, suffix, width }: { value: number, icon: React.ReactNode, color: string, suffix?: string, width?: string }) => {
  const prevValue = useRef(value);
  const [animState, setAnimState] = useState({ class: '', key: 0 });

  useEffect(() => {
    if (value > prevValue.current) {
      setAnimState(s => ({ class: 'pulse-green', key: s.key + 1 }));
    } else if (value < prevValue.current) {
      setAnimState(s => ({ class: 'pulse-red', key: s.key + 1 }));
    }
    prevValue.current = value;
  }, [value]);

  return (
    <div style={{ color, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', width, minWidth: width }}>
      <span>{icon}</span>
      <span key={`${value}-${animState.key}`} className={animState.class} style={{ display: 'inline-block', transition: 'all 0.3s', fontFamily: width ? 'monospace' : 'inherit' }}>
        {value}{suffix}
      </span>
    </div>
  );
};
