import React, { useState, useMemo } from 'react';
import SessionSelector from '../../components/shared/SessionSelector';
import { fetchDrivers, fetchLaps, fetchStints } from '../../api/openf1';
import { getTeamColour } from '../../utils/teamColours';
import { formatLapTime } from '../../utils/formatters';
import { TYRE_PALETTE } from '../../utils/tyrePalette';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './Compare.css';

const Compare = () => {
  const [sessionKey, setSessionKey] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [selectedDrivers, setSelectedDrivers] = useState([]);
  const [laps, setLaps] = useState([]);
  const [stints, setStints] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [excludePits, setExcludePits] = useState(false);

  const handleSelectSession = async (key) => {
    setIsLoading(true);
    setSessionKey(key);
    try {
      const [drvs, lps, stnts] = await Promise.all([
          fetchDrivers(key),
          fetchLaps(key, ''), // empty string gets all? OpenF1 limits might apply
          fetchStints(key)
      ]);
      setDrivers(drvs);
      setLaps(lps);
      setStints(stnts);
      setSelectedDrivers([]);
    } catch(e) {
      console.error(e);
    }
    setIsLoading(false);
  };

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
    
    const lapsMap = {};
    let maxLap = 0;

    laps.forEach(lap => {
        if (!selectedDrivers.includes(lap.driver_number)) return;
        
        // Exclude pit laps if enabled (is_pit_out_lap or is_pit_in_lap might not exist, but we can filter by duration)
        if (excludePits && lap.is_pit_out_lap) return;

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
  }, [laps, selectedDrivers, excludePits]);

  const fastestLaps = useMemo(() => {
     const stats = {};
     selectedDrivers.forEach(dNum => {
         const driverLaps = laps.filter(l => l.driver_number === dNum && l.lap_duration);
         if (driverLaps.length === 0) return;
         
         const fastest = driverLaps.reduce((min, lap) => lap.lap_duration < min.lap_duration ? lap : min, driverLaps[0]);
         
         const validLaps = driverLaps.filter(l => l.lap_duration < fastest.lap_duration * 1.15); // filter out obvious pit laps for avg
         const avg = validLaps.reduce((sum, l) => sum + l.lap_duration, 0) / validLaps.length;

         const driverStints = stints.filter(s => s.driver_number === dNum);

         stats[dNum] = {
             fastestTime: fastest.lap_duration,
             lapOccurred: fastest.lap_number,
             avgTime: avg,
             pits: Math.max(0, driverStints.length - 1)
         };
     });
     return stats;
  }, [laps, stints, selectedDrivers]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="compare-tooltip">
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
    <div className="compare-page">
      <div className="compare-header">
        <h1>COMPARE DRIVERS</h1>
        <p>Analyze historical lap times and strategies across drivers.</p>
      </div>

      <SessionSelector onSelectSession={handleSelectSession} />

      {isLoading && <div className="compare-loading">Loading Session Data...</div>}

      {!isLoading && sessionKey && (
        <div className="compare-content">
          <div className="driver-picker-container">
            <h3>SELECT DRIVERS (Up to 4)</h3>
            <div className="driver-pill-grid">
              {drivers.map(d => {
                const isSelected = selectedDrivers.includes(d.driver_number);
                const teamCol = getTeamColour(d.team_name);
                return (
                  <button 
                    key={d.driver_number}
                    className={`driver-pill large ${isSelected ? 'selected' : ''}`}
                    style={{ 
                        borderColor: teamCol, 
                        backgroundColor: isSelected ? teamCol : 'transparent',
                        color: isSelected ? '#000' : '#FFF'
                    }}
                    onClick={() => toggleDriver(d.driver_number)}
                  >
                    {d.name_acronym} <span className="pill-number">{d.driver_number}</span>
                  </button>
                )
              })}
            </div>
            
            {selectedDrivers.length > 0 && (
                <div className="chart-controls">
                    <label className="toggle-label">
                        <input type="checkbox" checked={excludePits} onChange={e => setExcludePits(e.target.checked)} />
                        Exclude out-laps / slow laps (smooth chart)
                    </label>
                </div>
            )}
          </div>

          {selectedDrivers.length > 0 && (
              <>
                <div className="compare-chart-panel">
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <XAxis dataKey="lap" stroke="#888" />
                      <YAxis 
                          stroke="#888" 
                          domain={['dataMin - 1', 'dataMax + 1']} 
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
                                connectNulls={!excludePits}
                              />
                          );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="compare-stats-grid">
                    <div className="fastest-laps-table-container">
                        <h3>PERFORMANCE STATS</h3>
                        <table className="fastest-laps-table">
                            <thead>
                                <tr>
                                    <th>DRIVER</th>
                                    <th>FASTEST LAP</th>
                                    <th>LAP</th>
                                    <th>AVG TIME</th>
                                    <th>PITS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedDrivers.map(dNum => {
                                    const d = drivers.find(dr => dr.driver_number === dNum);
                                    const stats = fastestLaps[dNum];
                                    const teamCol = getTeamColour(d?.team_name);
                                    if (!stats) return null;
                                    return (
                                        <tr key={dNum} style={{ borderLeft: `4px solid ${teamCol}`}}>
                                            <td>{d?.name_acronym}</td>
                                            <td className="mono">{formatLapTime(stats.fastestTime)}</td>
                                            <td>{stats.lapOccurred}</td>
                                            <td className="mono">{formatLapTime(stats.avgTime)}</td>
                                            <td>{stats.pits}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="strategy-timeline-container">
                        <h3>TYRE STRATEGY TIMELINE</h3>
                        <div className="strategy-timelines">
                            {selectedDrivers.map(dNum => {
                                const d = drivers.find(dr => dr.driver_number === dNum);
                                const dStints = stints.filter(s => s.driver_number === dNum);
                                return (
                                    <div key={dNum} className="strategy-row">
                                        <div className="s-driver">{d?.name_acronym}</div>
                                        <div className="s-timeline">
                                            {dStints.map((stint, idx) => {
                                                const lapsCount = stint.stint_length || 10;
                                                const width = `${Math.min(lapsCount * 3, 100)}%`;
                                                const color = TYRE_PALETTE[stint.compound] || '#555';
                                                return (
                                                    <div 
                                                        key={idx} 
                                                        className="s-stint" 
                                                        style={{ width, backgroundColor: color }}
                                                        title={`${stint.compound} - Laps: ${lapsCount}`}
                                                    >
                                                        {stint.compound?.[0] || '?'}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
              </>
          )}
        </div>
      )}
    </div>
  );
};

export default Compare;
