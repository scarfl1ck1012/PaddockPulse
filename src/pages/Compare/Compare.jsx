import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import { getTeamColour } from '../../utils/teamColours';
import { formatLapTime } from '../../utils/formatters';
import { CURRENT_SEASON } from '../../api/constants';
import { fetchSeasonResults, fetchRaceResults, fetchLapData } from '../../services/api';
import './Compare.css';

const YEARS = Array.from({ length: CURRENT_SEASON - 1999 }, (_, i) => CURRENT_SEASON - i);

const TEAM_COLORS_FALLBACK = [
  '#e10600', '#00d2be', '#ff8000', '#0600ef', 
  '#006f62', '#2293d1', '#b6babd', '#c92d4b'
];

function SkeletonBlock({ height = 200 }) {
  return (
    <div className="glass-card" style={{ padding: '20px', minHeight: height }}>
      <div className="skeleton-line short" />
      <div className="skeleton-line" style={{ marginTop: 16, height: height - 60 }} />
    </div>
  );
}

export default function Compare() {
  const [year, setYear] = useState(CURRENT_SEASON);
  const [races, setRaces] = useState([]);
  const [selectedRound, setSelectedRound] = useState('');
  const [allDrivers, setAllDrivers] = useState([]);
  const [selectedDriverIds, setSelectedDriverIds] = useState([]);
  const [lapData, setLapData] = useState([]);
  const [raceResults, setRaceResults] = useState([]);
  const [loading, setLoading] = useState({ races: false, data: false });
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  // 1. Fetch completed races for year
  useEffect(() => {
    const controller = new AbortController();
    
    async function loadRaces() {
      setLoading(prev => ({ ...prev, races: true }));
      setError(null);
      setRaces([]);
      setSelectedRound('');
      setAllDrivers([]);
      setSelectedDriverIds([]);
      setLapData([]);
      setRaceResults([]);

      try {
        const data = await fetchSeasonResults(year, controller.signal);
        const raceList = data?.MRData?.RaceTable?.Races || [];
        setRaces(raceList);
        // Default to most recent completed race
        if (raceList.length > 0) {
          setSelectedRound(raceList[raceList.length - 1].round);
        }
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      } finally {
        setLoading(prev => ({ ...prev, races: false }));
      }
    }

    loadRaces();
    return () => controller.abort();
  }, [year]);

  // 2. When race selected, fetch results + lap data
  useEffect(() => {
    if (!selectedRound) return;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    async function loadRaceData() {
      setLoading(prev => ({ ...prev, data: true }));
      setError(null);

      try {
        const [resultsData, lapsData] = await Promise.all([
          fetchRaceResults(year, selectedRound, controller.signal),
          fetchLapData(year, selectedRound, controller.signal),
        ]);

        const results = resultsData?.MRData?.RaceTable?.Races?.[0]?.Results || [];
        setRaceResults(results);

        // Build driver list from results
        const drivers = results.map(r => ({
          driverId: r.Driver?.driverId,
          code: r.Driver?.code || r.Driver?.familyName?.substring(0, 3).toUpperCase(),
          name: `${r.Driver?.givenName || ''} ${r.Driver?.familyName || ''}`,
          team: r.Constructor?.name || '',
          position: r.position,
          grid: r.grid,
          points: r.points,
          status: r.status,
          fastestLap: r.FastestLap?.Time?.time || null,
          time: r.Time?.time || null,
        }));
        setAllDrivers(drivers);

        // Default select top 2 drivers
        if (drivers.length >= 2) {
          setSelectedDriverIds([drivers[0].driverId, drivers[1].driverId]);
        } else if (drivers.length === 1) {
          setSelectedDriverIds([drivers[0].driverId]);
        }

        // Parse lap data
        const laps = lapsData?.MRData?.RaceTable?.Races?.[0]?.Laps || [];
        setLapData(laps);
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      } finally {
        setLoading(prev => ({ ...prev, data: false }));
      }
    }

    loadRaceData();
    return () => controller.abort();
  }, [year, selectedRound]);

  // Toggle driver selection
  const toggleDriver = useCallback((driverId) => {
    setSelectedDriverIds(prev => {
      if (prev.includes(driverId)) {
        return prev.filter(id => id !== driverId);
      }
      if (prev.length >= 6) return prev; // max 6
      return [...prev, driverId];
    });
  }, []);

  // Selected drivers data
  const selectedDrivers = useMemo(() => 
    allDrivers.filter(d => selectedDriverIds.includes(d.driverId)),
    [allDrivers, selectedDriverIds]
  );

  // Build chart data from lap data
  const lapChartData = useMemo(() => {
    if (!lapData.length || !selectedDriverIds.length) return [];

    return lapData.map(lap => {
      const entry = { lap: parseInt(lap.number) };

      lap.Timings?.forEach(timing => {
        if (selectedDriverIds.includes(timing.driverId)) {
          const driver = allDrivers.find(d => d.driverId === timing.driverId);
          const code = driver?.code || timing.driverId;
          
          // Parse lap time "1:32.456" to seconds
          const timeParts = timing.time?.split(':');
          if (timeParts?.length === 2) {
            entry[`${code}_time`] = parseFloat(timeParts[0]) * 60 + parseFloat(timeParts[1]);
          }
          
          // Position
          entry[`${code}_pos`] = parseInt(timing.position);
        }
      });

      return entry;
    });
  }, [lapData, selectedDriverIds, allDrivers]);

  // Get driver color
  const getDriverColor = useCallback((driver, index) => {
    return getTeamColour(driver.team) || TEAM_COLORS_FALLBACK[index % TEAM_COLORS_FALLBACK.length];
  }, []);

  const selectedRace = races.find(r => r.round === selectedRound);

  return (
    <div className="compare-page page-container">
      <div className="page-header">
        <h1 className="page-title">⚔️ Head-to-Head Compare</h1>
        <p className="page-subtitle">Analyze lap pace, positions, and strategies</p>
      </div>

      {/* Session Selector */}
      <div className="session-selector-panel glass-card">
        <div className="selector-group">
          <label>1. Year</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="selector-group">
          <label>2. Race</label>
          <select 
            value={selectedRound} 
            onChange={(e) => setSelectedRound(e.target.value)}
            disabled={loading.races || races.length === 0}
          >
            {loading.races && <option>Loading...</option>}
            {!loading.races && races.length === 0 && <option>No completed races</option>}
            {races.map(race => (
              <option key={race.round} value={race.round}>
                R{race.round} — {race.raceName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="error-banner glass-card">
          <p>Failed to load data. {error}</p>
        </div>
      )}

      {/* Driver Multi-Select Pills */}
      {allDrivers.length > 0 && (
        <div className="driver-pills-container glass-card">
          <div className="pills-header">
            <h4>Select Drivers (2–6)</h4>
            <span className="pill-count">{selectedDriverIds.length} selected</span>
          </div>
          <div className="driver-pills">
            {allDrivers.map((driver, i) => {
              const isSelected = selectedDriverIds.includes(driver.driverId);
              const color = getDriverColor(driver, i);
              return (
                <button
                  key={driver.driverId}
                  className={`driver-pill ${isSelected ? 'selected' : ''}`}
                  style={isSelected ? { 
                    borderColor: color, 
                    backgroundColor: `${color}22`,
                    color: color 
                  } : {}}
                  onClick={() => toggleDriver(driver.driverId)}
                >
                  <span className="pill-color" style={{ backgroundColor: color }} />
                  {driver.code}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary Stat Cards */}
      {selectedDrivers.length >= 2 && !loading.data && (
        <div className="compare-drivers-header">
          {selectedDrivers.map((driver, i) => {
            const color = getDriverColor(driver, i);
            return (
              <div key={driver.driverId} className="driver-stat-card glass-card" style={{ borderTop: `4px solid ${color}` }}>
                <h3>{driver.name}</h3>
                <span className="driver-team" style={{ color }}>{driver.team}</span>
                <div className="stat-grid">
                  <div className="mini-stat">
                    <span className="mini-label">Grid</span>
                    <span className="mini-value">P{driver.grid}</span>
                  </div>
                  <div className="mini-stat">
                    <span className="mini-label">Finish</span>
                    <span className="mini-value">P{driver.position}</span>
                  </div>
                  <div className="mini-stat">
                    <span className="mini-label">Points</span>
                    <span className="mini-value">{driver.points}</span>
                  </div>
                  <div className="mini-stat">
                    <span className="mini-label">Fastest</span>
                    <span className="mini-value">{driver.fastestLap || '—'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Charts */}
      {loading.data ? (
        <div className="compare-charts-grid">
          <SkeletonBlock height={300} />
          <SkeletonBlock height={300} />
        </div>
      ) : lapChartData.length > 0 && selectedDrivers.length >= 2 ? (
        <div className="compare-charts-grid">
          
          {/* Position over laps */}
          <div className="chart-wrapper glass-card">
            <h4>Position Over Laps</h4>
            <div className="recharts-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lapChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="lap" stroke="rgba(255,255,255,0.4)" tickLine={false} />
                  <YAxis 
                    reversed 
                    domain={[1, 'auto']} 
                    stroke="rgba(255,255,255,0.4)" 
                    tickLine={false} 
                    axisLine={false}
                    width={30}
                  />
                  <RechartsTooltip 
                    contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px' }}
                  />
                  <Legend />
                  {selectedDrivers.map((driver, i) => (
                    <Line 
                      key={driver.driverId}
                      type="stepAfter" 
                      dataKey={`${driver.code}_pos`} 
                      name={driver.code}
                      stroke={getDriverColor(driver, i)} 
                      strokeWidth={2.5} 
                      dot={false} 
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lap time comparison */}
          <div className="chart-wrapper glass-card">
            <h4>Lap Time Comparison</h4>
            <div className="recharts-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lapChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="lap" stroke="rgba(255,255,255,0.4)" tickLine={false} />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    tickFormatter={(val) => formatLapTime(val)} 
                    stroke="rgba(255,255,255,0.4)" 
                    tickLine={false} 
                    axisLine={false}
                    width={60}
                  />
                  <RechartsTooltip 
                    contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px' }}
                    formatter={(val) => [formatLapTime(val), undefined]}
                  />
                  <Legend />
                  {selectedDrivers.map((driver, i) => (
                    <Line 
                      key={driver.driverId}
                      type="monotone" 
                      dataKey={`${driver.code}_time`} 
                      name={driver.code}
                      stroke={getDriverColor(driver, i)} 
                      strokeWidth={2.5} 
                      dot={false} 
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      ) : (
        !loading.races && selectedRound && allDrivers.length > 0 && lapChartData.length === 0 && (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>
              {lapData.length === 0 
                ? 'No lap-by-lap data available for this race.'
                : 'Select at least 2 drivers to compare.'}
            </p>
          </div>
        )
      )}
    </div>
  );
}
