import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useLiveStore } from '../../store/liveStore';
import { getTeamColour } from '../../utils/teamColours';
import { formatLapTime } from '../../utils/formatters';


const LapComparison = () => {
  const { laps, drivers } = useLiveStore();
  const [selectedDrivers, setSelectedDrivers] = useState([1, 11]); // Default Max and Checo for example, should be dynamic

  const toggleDriver = (number) => {
    if (selectedDrivers.includes(number)) {
      setSelectedDrivers(selectedDrivers.filter(d => d !== number));
    } else {
      if (selectedDrivers.length < 4) {
        setSelectedDrivers([...selectedDrivers, number]);
      }
    }
  };

  const chartData = useMemo(() => {
    if (!laps || laps.length === 0) return [];
    
    // Group by lap number
    const lapsMap = {};
    let maxLap = 0;

    laps.forEach(lap => {
        if (!selectedDrivers.includes(lap.driver_number)) return;
        if (!lapsMap[lap.lap_number]) {
            lapsMap[lap.lap_number] = { lap: lap.lap_number };
        }
        lapsMap[lap.lap_number][`d${lap.driver_number}`] = lap.lap_duration;
        if (lap.lap_number > maxLap) maxLap = lap.lap_number;
    });

    const data = [];
    for (let i = 1; i <= maxLap; i++) {
        if (lapsMap[i]) data.push(lapsMap[i]);
    }
    return data;
  }, [laps, selectedDrivers]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="lap-label">Lap {label}</p>
          {payload.map(p => {
              const driverCode = p.dataKey.replace('d', '');
              const d = drivers.find(dr => dr.driver_number == driverCode);
              return (
                  <p key={driverCode} style={{ color: p.color, margin: '2px 0' }}>
                      {d?.name_acronym}: {formatLapTime(p.value)}
                  </p>
              );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="lap-comparison-panel">
      <div className="panel-header">LAP COMPARISON</div>
      <div className="driver-picker">
        {drivers.slice(0, 10).map(d => { // limit for demo if too many
            const isSelected = selectedDrivers.includes(d.driver_number);
            const teamCol = getTeamColour(d.team_name);
            return (
                <button 
                  key={d.driver_number}
                  className={`driver-pill ${isSelected ? 'selected' : ''}`}
                  style={{ 
                      borderColor: teamCol, 
                      backgroundColor: isSelected ? teamCol : 'transparent',
                      color: isSelected ? '#000' : '#FFF'
                  }}
                  onClick={() => toggleDriver(d.driver_number)}
                >
                  {d.name_acronym}
                </button>
            )
        })}
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <XAxis dataKey="lap" stroke="#888" />
            <YAxis 
                stroke="#888" 
                domain={['dataMin', 'dataMax']} 
                tickFormatter={(val) => formatLapTime(val)}
            />
            <Tooltip content={<CustomTooltip />} />
            {selectedDrivers.map(dNum => {
                const driver = drivers.find(d => d.driver_number === dNum);
                const color = driver ? getTeamColour(driver.team_name) : '#888';
                return (
                    <Line 
                      key={dNum} 
                      type="monotone" 
                      dataKey={`d${dNum}`} 
                      stroke={color} 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LapComparison;
