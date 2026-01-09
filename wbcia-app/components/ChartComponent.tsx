"use client";

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush
} from 'recharts';

interface ChartProps {
  data: any[];
  seriesList: any[];
  xDomain: [number, number];
  onDomainChange: (domain: [number, number]) => void;
}

const ChartComponent: React.FC<ChartProps> = ({ data, seriesList, xDomain, onDomainChange }) => {
  return (
    <div className="w-full h-[600px] bg-white p-4 rounded-lg shadow-md">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="year" 
            type="number" 
            domain={xDomain} 
            allowDataOverflow
          />
          <Tooltip labelFormatter={(value) => `Year: ${value}`} />
          <Legend />
          
          {seriesList.map((series, index) => (
            <YAxis
              key={series.id}
              yAxisId={series.id}
              orientation="left"
              stroke={series.color}
              label={{ value: series.indicatorName.substring(0, 15) + '...', angle: -90, position: 'insideLeft', fill: series.color }}
              // Offset axes to avoid overlap if there are many. 
              // Recharts doesn't auto-stack left axes well, so we might just overlay them 
              // or let the user know. For now, simple overlay is standard.
            />
          ))}

          {seriesList.map((series) => (
            <Line
              key={series.id}
              yAxisId={series.id}
              type="monotone"
              dataKey={series.id}
              stroke={series.color}
              name={series.indicatorName}
              dot={false}
              strokeWidth={2}
            />
          ))}
          
          <Brush 
            dataKey="year" 
            height={30} 
            stroke="#8884d8"
            onChange={(range) => {
              // Optional: Hook this up to text inputs if needed, 
              // or just let Brush handle the visual zooming.
              // We rely on the parent's xDomain for the main view.
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChartComponent;
