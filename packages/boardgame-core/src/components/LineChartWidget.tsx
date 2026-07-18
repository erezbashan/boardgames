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
  yAxisWidth?: number;
}

export const LineChartWidget: React.FC<LineChartWidgetProps> = ({ data, lines, title, height = 300, hideXAxis, hideLegend, hideTooltip, yAxisWidth = 40 }) => {
  return (
    <div style={{ width: '100%', height: height + 50, marginBottom: '20px' }}>
      {title && <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          {!hideXAxis && <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />}
          <YAxis stroke="rgba(255,255,255,0.5)" width={yAxisWidth} />
          {!hideTooltip && <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: 'white' }} formatter={(value: any) => Math.round(Number(value))} />}
          {!hideLegend && <Legend />}
          {lines.map((line, i) => (
            <Line 
              key={line.key} 
              type="monotone" 
              dataKey={line.key} 
              name={line.name || line.key} 
              stroke={line.color} 
              strokeWidth={3}
              dot={line.dot ?? true}
              activeDot={{ r: 8 }} 
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
