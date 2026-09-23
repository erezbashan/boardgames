import React, { useEffect, useRef, useState } from 'react';

export const AnimatedValue: React.FC<{ value: number; positiveColor?: string; negativeColor?: string; suffix?: React.ReactNode }> = ({ 
  value, 
  positiveColor = '#4ade80', 
  negativeColor = '#ef4444',
  suffix 
}) => {
  const prevValue = useRef(value);
  const [animState, setAnimState] = useState({ class: '', key: 0, color: 'inherit' });

  useEffect(() => {
    if (value > prevValue.current) {
      setAnimState(s => ({ class: 'pulse-anim', key: s.key + 1, color: positiveColor }));
    } else if (value < prevValue.current) {
      setAnimState(s => ({ class: 'pulse-anim', key: s.key + 1, color: negativeColor }));
    }
    prevValue.current = value;
  }, [value, positiveColor, negativeColor]);

  const style = `
    @keyframes pulse-val-${animState.key} {
      0% { transform: scale(1); color: ${animState.color}; text-shadow: 0 0 10px ${animState.color}; }
      50% { transform: scale(2.5); color: ${animState.color}; text-shadow: 0 0 20px ${animState.color}; }
      100% { transform: scale(1); color: inherit; }
    }
    .pulse-anim-${animState.key} {
      display: inline-block;
      animation: pulse-val-${animState.key} 1.5s ease-out;
    }
  `;

  return (
    <>
      <style>{style}</style>
      <span key={animState.key} className={animState.class ? `pulse-anim-${animState.key}` : ''} style={{ display: 'inline-block' }}>
        {value}{suffix}
      </span>
    </>
  );
};
