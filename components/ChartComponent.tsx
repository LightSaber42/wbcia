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

const formatYAxis = (tickItem: any) => {
  if (typeof tickItem !== 'number') return tickItem;
  if (tickItem === 0) return '0';
  
  const absValue = Math.abs(tickItem);
  if (absValue >= 1000000000000) return (tickItem / 1000000000000).toFixed(1) + 'T';
  if (absValue >= 1000000000) return (tickItem / 1000000000).toFixed(1) + 'B';
  if (absValue >= 1000000) return (tickItem / 1000000).toFixed(1) + 'M';
  if (absValue >= 1000) return (tickItem / 1000).toFixed(1) + 'k';
  return tickItem.toFixed(0);
};

const CustomYAxisLabel = (props: any) => {
  const { viewBox, color, text, index } = props;
  const { x, y, height } = viewBox;
  
  // Position labels at the top of the axis, staggered vertically
  const labelY = y + 20 + (index * 20);
  
  return (
    <g transform={`translate(${x}, ${labelY})`}>
      <rect
        x="-5"
        y="-10"
        width="150"
        height="16"
        fill="white"
        fillOpacity="0.8"
        stroke={color}
        strokeWidth="0.5"
        rx="2"
      />
      <text
        x="2"
        y="2"
        fill={color}
        fontSize="10"
        fontWeight="bold"
        textAnchor="start"
      >
        {text.length > 25 ? text.substring(0, 22) + '...' : text}
      </text>
    </g>
  );
};

const ChartComponent: React.FC<ChartProps> = ({ data, seriesList, xDomain, onDomainChange }) => {
  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 40, // Increased top margin for staggered labels
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
          <Tooltip 
            labelFormatter={(value) => `Year: ${value}`} 
            formatter={(value: any) => [typeof value === 'number' ? value.toLocaleString() : value, '']}
          />
          <Legend />
          
          {seriesList.map((series, index) => (
            <YAxis
              key={series.id}
              yAxisId={series.id}
              orientation="left"
              stroke={series.color}
              tickFormatter={formatYAxis}
              width={45}
              tick={{ fontSize: 10 }}
              tickMargin={2}
              label={
                <CustomYAxisLabel 
                  color={series.color} 
                  text={series.indicatorName} 
                  index={index}
                />
              }
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
            onChange={(e: any) => {
              if (e.startIndex !== undefined && e.endIndex !== undefined && data && data.length > 0) {
                const startYear = data[e.startIndex]?.year;
                const endYear = data[e.endIndex]?.year;
                if (startYear !== undefined && endYear !== undefined) {
                  onDomainChange([startYear, endYear]);
                }
              }
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChartComponent;
