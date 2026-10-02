import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export interface LineChartData {
  name: string | number; // usually turn or time
  [key: string]: any; // data keys for each line
}

export interface LineConfig {
  key: string;
  color: string;
  name?: string;
  dot?: any;
}

interface LineChartWidgetProps {
  data: LineChartData[];
  lines: LineConfig[];
  title?: string;
  height?: number;
  hideXAxis?: boolean;
  hideLegend?: boolean;
  hideTooltip?: boolean;
  showTooltip?: boolean;
  hideDots?: boolean;
  yAxisWidth?: number;
}

export const LineChartWidget: React.FC<LineChartWidgetProps> = ({ data, lines, title, height = 300, hideXAxis, hideLegend, hideTooltip, showTooltip, hideDots, yAxisWidth = 40 }) => {
  // Add slight jitter to identical values so lines don't perfectly overlap
  const jitteredData = React.useMemo(() => {
    return data.map(point => {
      const newPoint = { ...point };
      const valuesSeen = new Map<number, number>();
      for (const line of lines) {
        if (typeof newPoint[line.key] === 'number') {
          const val = newPoint[line.key];
          const count = valuesSeen.get(val) || 0;
          if (count > 0) {
            newPoint[line.key] = val + (count * 0.15); // Add slight offset for rendering
          }
          valuesSeen.set(val, count + 1);
        }
      }
      return newPoint;
    });
  }, [data, lines]);

  return (
    <div style={{ width: '100%', height: height + 50, marginBottom: '20px' }}>
      {title && <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={jitteredData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          {!hideXAxis && <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tickLine={false} />}
          <YAxis stroke="rgba(255,255,255,0.5)" width={yAxisWidth} tickLine={false} tickFormatter={(val: any) => typeof val === 'number' ? Math.round(val).toString() : val} />
          {!hideTooltip && showTooltip && <Tooltip formatter={(val: any) => typeof val === 'number' ? Math.round(val) : val} contentStyle={{ background: '#1e293b', border: '1px solid #475569', color: 'white' }} />}
          {!hideLegend && <Legend />}
          {lines.map((line, i) => (
            <Line 
              key={line.key} 
              type="monotone" 
              dataKey={line.key} 
              name={line.name || line.key} 
              stroke={line.color} 
              strokeWidth={3}
              dot={hideDots ? false : (line.dot ?? true)}
              activeDot={hideDots ? false : undefined} 
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
