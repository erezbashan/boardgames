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
    .pulse-green { animation: pulse-green 2.25s ease-out; }
    .pulse-red { animation: pulse-red 2.25s ease-out; }
  `;
  document.head.appendChild(style);
}

export const AnimatedCounter = ({ value, icon, color, suffix, width, resetKey, disableAnimation }: { value: number, icon: React.ReactNode, color: string, suffix?: string, width?: string, resetKey?: number | string, disableAnimation?: boolean }) => {
  const prevValue = useRef(value);
  const [animState, setAnimState] = useState({ class: '', key: 0 });

  const prevResetKey = useRef(resetKey);
  useEffect(() => {
    let effectivePrev = prevValue.current;
    
    // If the reset key changed (e.g. turn changed to a new player),
    // we want to pretend the previous value was 0 so it pulses green up to their starting stats!
    if (resetKey !== prevResetKey.current) {
      prevResetKey.current = resetKey;
      effectivePrev = 0; // Pretend it started at 0 for the new turn
      
      // If the new value is ALSO 0 (e.g. Coins), we don't want it to pulse green from 0 to 0.
      if (value === 0) {
         prevValue.current = 0;
         return; // Skip animation entirely
      }
    }
    
    if (disableAnimation) {
      // Force clear any leftover animation class when entering a disabled state
      setAnimState(s => ({ class: '', key: s.key + 1 }));
    } else {
      if (value > effectivePrev) {
        setAnimState(s => ({ class: 'pulse-green', key: s.key + 1 }));
      } else if (value < effectivePrev) {
        setAnimState(s => ({ class: 'pulse-red', key: s.key + 1 }));
      }
    }
    prevValue.current = value;
  }, [value, resetKey, disableAnimation]);

  return (
    <div style={{ color, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', width, minWidth: width }}>
      <span>{icon}</span>
      <span key={`anim-${animState.key}`} className={animState.class} style={{ display: 'inline-block', transition: 'all 0.3s', fontFamily: width ? 'monospace' : 'inherit' }}>
        {value}{suffix}
      </span>
    </div>
  );
};
