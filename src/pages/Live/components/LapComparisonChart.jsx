import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import useLiveStore from '../../../store/liveStore';
import { getTeamColour } from '../../../utils/teamColours';
import { formatLapTime } from '../../../utils/formatters';
import './LapComparisonChart.css';

// Custom tooltip renderer for M:SS.mmm format
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip glass-card">
        <p className="tooltip-lap">Lap {label}</p>
        <div className="tooltip-drivers">
          {payload.map((entry, index) => (
            <div key={index} className="tooltip-row" style={{ color: entry.color }}>
              <span className="tooltip-name">{entry.name}</span>
              <span className="tooltip-time">{formatLapTime(entry.value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Formatter for Y-Axis ticks 
const yAxisTickFormatter = (value) => formatLapTime(value);

export default function LapComparisonChart() {
  const { leaderboard } = useLiveStore();

  // Pick top 4 drivers for comparison by default
  const topDrivers = useMemo(() => leaderboard.slice(0, 4), [leaderboard]);

  // Generate mock lap time series data for the top 4 drivers if no real historical data is ready yet.
  // In a fully integrated app, this would poll the /laps endpoint for these specific drivers.
  const chartData = useMemo(() => {
    if (topDrivers.length === 0) return [];
    
    const data = [];
    const maxLaps = 20; // Example 20 laps of history
    
    // Base times for mock data
    const bases = topDrivers.map((d, i) => 82.0 + (i * 0.2)); // 82s = 1:22.0

    for (let lap = 1; lap <= maxLaps; lap++) {
      const dataPoint = { lap };
      topDrivers.forEach((driver, idx) => {
        // Add random variance (+/- 1.5s) to the base time
        const variance = (Math.random() * 3) - 1.5;
        // Occasional pit stop spike
        const isPit = lap === 12 + idx ? 25 : 0; 
        
        dataPoint[driver.name_acronym] = bases[idx] + variance + isPit;
      });
      data.push(dataPoint);
    }
    
    return data;
  }, [topDrivers]);

  if (topDrivers.length === 0) {
    return (
      <div className="lap-comparison-chart empty">
        <p>Awaiting lap time data for Recharts integration...</p>
      </div>
    );
  }

  return (
    <div className="lap-comparison-chart">
      <div className="chart-header">
        <h4>Live Lap Pace (Top 4)</h4>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
            className="f1-line-chart"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="lap" 
              stroke="rgba(255,255,255,0.4)" 
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <YAxis 
              domain={['auto', 'auto']}
              tickFormatter={yAxisTickFormatter}
              stroke="rgba(255,255,255,0.4)"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 2 }} />
            <Legend 
              wrapperStyle={{ fontSize: 12, fontFamily: 'sans-serif', paddingTop: 10 }}
              iconType="circle"
            />
            
            {topDrivers.map((driver) => (
              <Line
                key={driver.name_acronym}
                type="monotone"
                dataKey={driver.name_acronym}
                name={driver.name_acronym}
                stroke={getTeamColour(driver.team_name, driver.team_colour)}
                strokeWidth={3}
                dot={{ r: 3, fill: getTeamColour(driver.team_name, driver.team_colour), strokeWidth: 0 }}
                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                isAnimationActive={false} // Prevents jumpiness on tick updates
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
