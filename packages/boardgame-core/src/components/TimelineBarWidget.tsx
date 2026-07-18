import React from 'react';

export interface TimelineSegment {
  name: string | number; // usually turn or time, for x-axis
  color: string; // color of the bar segment
  label?: string; // what to show on hover or inside the bar
}

interface TimelineBarWidgetProps {
  data: TimelineSegment[];
  title?: string;
  height?: number;
}

export const TimelineBarWidget: React.FC<TimelineBarWidgetProps> = ({ data, title, height = 40 }) => {
  if (data.length === 0) return null;
  
  return (
    <div style={{ width: '100%', marginBottom: '20px' }}>
      {title && <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>{title}</h3>}
      <div style={{ 
        display: 'flex', 
        width: 'calc(100% - 50px)', 
        margin: '0 10px 0 40px',
        height: height + 'px', 
        borderRadius: '8px', 
        overflow: 'hidden',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
      }}>
        {data.map((segment, index) => (
          <div 
            key={index}
            title={segment.label || String(segment.name)}
            style={{
              flex: 1, // each turn takes equal space
              background: segment.color || 'transparent',
              borderRight: index < data.length - 1 ? '1px solid rgba(0,0,0,0.2)' : 'none',
              transition: 'background 0.3s'
            }}
          />
        ))}
      </div>
    </div>
  );
};
