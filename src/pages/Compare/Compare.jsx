import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend, ReferenceArea, ReferenceLine
} from 'recharts';
import { getTeamColour } from '../../utils/teamColours';
import { CURRENT_SEASON, TYRE_COMPOUNDS } from '../../api/constants';
import * as cs from '../../services/compareService';
import './Compare.css';

const YEARS = Array.from({ length: CURRENT_SEASON - 1995 }, (_, i) => CURRENT_SEASON - i);

const TEAM_COLORS_FALLBACK = [
  '#e10600', '#00d2be', '#ff8000', '#0600ef',
  '#006f62', '#2293d1', '#b6babd', '#c92d4b'
];

const TYRE_COLORS = {
  SOFT: '#e10600', MEDIUM: '#f5c623', HARD: '#f0f0f5',
  INTERMEDIATE: '#43b02a', WET: '#0080ff', UNKNOWN: '#666',
};

// --- Sub-components ---

function SkeletonBlock({ height = 200 }) {
  return (
    <div className="glass-card" style={{ padding: '20px', minHeight: height }}>
      <div className="skeleton-line short" />
      <div className="skeleton-line" style={{ marginTop: 16, height: height - 60 }} />
    </div>
  );
}

function TyreStrategyChart({ stints, selectedDrivers, totalLaps, getColor }) {
  if (!selectedDrivers.length || !totalLaps) return null;

  return (
    <div className="tyre-strategy-chart glass-card">
      <h4>Tyre Strategy</h4>
      <div className="strategy-rows">
        {selectedDrivers.map((driver, di) => {
          const driverStints = stints[driver.driverId] || [];
          return (
            <div key={driver.driverId} className="strategy-row">
              <span className="strategy-driver" style={{ color: getColor(driver, di) }}>
                {driver.code}
              </span>
              <div className="strategy-bar">
                {driverStints.map((stint, si) => {
                  const widthPct = (stint.laps / totalLaps) * 100;
                  const compound = stint.compound?.toUpperCase() || 'UNKNOWN';
                  const bgColor = TYRE_COLORS[compound] || TYRE_COLORS.UNKNOWN;
                  const textColor = compound === 'HARD' || compound === 'MEDIUM' ? '#000' : '#fff';
                  return (
                    <div
                      key={si}
                      className="stint-segment"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: bgColor,
                        color: textColor,
                      }}
                      title={`${compound} — Laps ${stint.startLap}–${stint.endLap} (${stint.laps} laps)`}
                    >
                      {widthPct > 8 && (
                        <span className="stint-label">{compound.substring(0, 1)} {stint.laps}L</span>
                      )}
                    </div>
                  );
                })}
                {driverStints.length === 0 && (
                  <div className="stint-segment" style={{ width: '100%', backgroundColor: '#444', color: '#999' }}>
                    <span className="stint-label">No data</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="strategy-legend">
        {Object.entries(TYRE_COLORS).filter(([k]) => k !== 'UNKNOWN').map(([compound, color]) => (
          <span key={compound} className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: color }} />
            {compound}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatCards({ selectedDrivers, getColor }) {
  return (
    <div className="compare-drivers-header">
      {selectedDrivers.map((driver, i) => {
        const color = getColor(driver, i);
        const isDNF = driver.status && driver.status !== 'Finished' && !driver.status.startsWith('+');
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
                <span className={`mini-value ${isDNF ? 'status-dnf' : ''}`}>
                  {isDNF ? 'DNF' : `P${driver.position}`}
                </span>
              </div>
              <div className="mini-stat">
                <span className="mini-label">Points</span>
                <span className="mini-value">{driver.points}</span>
              </div>
              <div className="mini-stat">
                <span className="mini-label">Fastest</span>
                <span className="mini-value">{driver.fastestLap || '—'}</span>
              </div>
              <div className="mini-stat">
                <span className="mini-label">Pits</span>
                <span className="mini-value">{driver.pitCount ?? '—'}</span>
              </div>
              <div className="mini-stat">
                <span className="mini-label">Time</span>
                <span className="mini-value">{driver.time || '—'}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- Main Component ---

export default function Compare() {
  const [year, setYear] = useState(CURRENT_SEASON);
  const [races, setRaces] = useState([]);
  const [selectedRound, setSelectedRound] = useState('');
  const [allDrivers, setAllDrivers] = useState([]);
  const [selectedDriverIds, setSelectedDriverIds] = useState([]);
  const [lapData, setLapData] = useState([]);
  const [pitStops, setPitStops] = useState([]);
  const [stints, setStints] = useState({});
  const [totalLaps, setTotalLaps] = useState(0);
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
      setPitStops([]);
      setStints({});

      try {
        const raceList = await cs.fetchAllSeasonResults(year, controller.signal);
        setRaces(raceList);
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

  // 2. Load race data when round selected
  useEffect(() => {
    if (!selectedRound) return;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    async function loadRaceData() {
      setLoading(prev => ({ ...prev, data: true }));
      setError(null);

      try {
        const [results, laps, pits] = await Promise.all([
          cs.fetchRoundResults(year, selectedRound, controller.signal),
          cs.fetchLaps(year, selectedRound, controller.signal),
          cs.fetchPitStops(year, selectedRound, controller.signal),
        ]);

        // Build driver list from results
        const pitCountMap = {};
        pits.forEach(p => { pitCountMap[p.driverId] = (pitCountMap[p.driverId] || 0) + 1; });

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
          lapsCompleted: r.laps || '0',
          pitCount: pitCountMap[r.Driver?.driverId] || 0,
          number: r.number,
        }));

        setAllDrivers(drivers);
        setLapData(laps);
        setPitStops(pits);
        setTotalLaps(laps.length);

        // Default select top 2
        if (drivers.length >= 2) {
          setSelectedDriverIds([drivers[0].driverId, drivers[1].driverId]);
        } else if (drivers.length === 1) {
          setSelectedDriverIds([drivers[0].driverId]);
        }

        // Build stints
        // Try OpenF1 for 2023+
        const selectedRace = races.find(r => r.round === selectedRound);
        const sessionKey = await cs.findSessionKey(year, selectedRace?.raceName, controller.signal);
        const openf1Stints = await cs.fetchOpenF1Stints(sessionKey, controller.signal);

        // Build driver number -> driverId map
        const driverNumMap = {};
        drivers.forEach(d => { if (d.number) driverNumMap[d.number] = d.driverId; });

        const builtStints = cs.buildStints(pits, laps.length, openf1Stints, driverNumMap);
        setStints(builtStints);

      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      } finally {
        setLoading(prev => ({ ...prev, data: false }));
      }
    }

    loadRaceData();
    return () => controller.abort();
  }, [year, selectedRound, races]);

  // Toggle driver selection
  const toggleDriver = useCallback((driverId) => {
    setSelectedDriverIds(prev => {
      if (prev.includes(driverId)) return prev.filter(id => id !== driverId);
      if (prev.length >= 6) return prev;
      return [...prev, driverId];
    });
  }, []);

  // Selected drivers data
  const selectedDrivers = useMemo(() =>
    allDrivers.filter(d => selectedDriverIds.includes(d.driverId)),
    [allDrivers, selectedDriverIds]
  );

  // Get driver color
  const getDriverColor = useCallback((driver, index) => {
    return getTeamColour(driver.team) || TEAM_COLORS_FALLBACK[index % TEAM_COLORS_FALLBACK.length];
  }, []);

  // Build chart data from lap data (position + lap time)
  const lapChartData = useMemo(() => {
    if (!lapData.length || !selectedDriverIds.length) return [];

    return lapData.map(lap => {
      const entry = { lap: parseInt(lap.number) };

      lap.Timings?.forEach(timing => {
        if (selectedDriverIds.includes(timing.driverId)) {
          const driver = allDrivers.find(d => d.driverId === timing.driverId);
          const code = driver?.code || timing.driverId;

          // Position
          entry[`${code}_pos`] = parseInt(timing.position);

          // Lap time in seconds
          const timeInSeconds = cs.parseLapTime(timing.time);
          if (timeInSeconds) {
            entry[`${code}_time`] = timeInSeconds;
            // Flag pit laps (outliers > median + 30s)
            entry[`${code}_isPit`] = false;
          }
        }
      });

      return entry;
    });
  }, [lapData, selectedDriverIds, allDrivers]);

  // Pit stop laps for reference lines
  const pitStopLaps = useMemo(() => {
    const laps = new Set();
    pitStops.forEach(p => {
      if (selectedDriverIds.includes(p.driverId)) {
        laps.add(parseInt(p.lap));
      }
    });
    return Array.from(laps).sort((a, b) => a - b);
  }, [pitStops, selectedDriverIds]);

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
        <div className="selector-group race-selector-group">
          <label>2. Race</label>
          <div className="race-chips-scroll">
            {loading.races && <span className="chip-loading">Loading...</span>}
            {!loading.races && races.length === 0 && <span className="chip-loading">No completed races</span>}
            {races.map(race => (
              <button
                key={race.round}
                className={`race-chip ${selectedRound === race.round ? 'active' : ''}`}
                onClick={() => setSelectedRound(race.round)}
              >
                R{race.round} {race.raceName?.replace(' Grand Prix', '')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="error-banner glass-card">
          <p>Failed to load data. {error}</p>
          <button className="action-button secondary" onClick={() => setSelectedRound(selectedRound)}>Retry</button>
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

      {loading.data ? (
        <div className="compare-charts-grid">
          <SkeletonBlock height={100} />
          <SkeletonBlock height={300} />
          <SkeletonBlock height={300} />
        </div>
      ) : selectedDrivers.length >= 2 ? (
        <>
          {/* Stat Cards */}
          <StatCards selectedDrivers={selectedDrivers} getColor={getDriverColor} />

          {/* Tyre Strategy */}
          <TyreStrategyChart
            stints={stints}
            selectedDrivers={selectedDrivers}
            totalLaps={totalLaps}
            getColor={getDriverColor}
          />

          {/* Charts */}
          {lapChartData.length > 0 && (
            <div className="compare-charts-grid full-width">
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
                        domain={[1, 20]}
                        stroke="rgba(255,255,255,0.4)"
                        tickLine={false}
                        axisLine={false}
                        width={30}
                      />
                      <RechartsTooltip
                        contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px' }}
                      />
                      <Legend />
                      {/* Pit stop reference lines */}
                      {pitStopLaps.map(lap => (
                        <ReferenceLine
                          key={`pit-${lap}`}
                          x={lap}
                          stroke="rgba(255,255,255,0.15)"
                          strokeDasharray="4 4"
                          label={{ value: '🔧', position: 'top', fontSize: 10 }}
                        />
                      ))}
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
                        tickFormatter={(val) => cs.formatLapTimeFromSeconds(val)}
                        stroke="rgba(255,255,255,0.4)"
                        tickLine={false}
                        axisLine={false}
                        width={60}
                      />
                      <RechartsTooltip
                        contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px' }}
                        formatter={(val) => [cs.formatLapTimeFromSeconds(val), undefined]}
                      />
                      <Legend />
                      {pitStopLaps.map(lap => (
                        <ReferenceLine
                          key={`pit-t-${lap}`}
                          x={lap}
                          stroke="rgba(255,255,255,0.15)"
                          strokeDasharray="4 4"
                        />
                      ))}
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
          )}

          {lapChartData.length === 0 && (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>No lap-by-lap data available for this race.</p>
            </div>
          )}
        </>
      ) : (
        allDrivers.length > 0 && (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>Select at least 2 drivers to compare.</p>
          </div>
        )
      )}
    </div>
  );
}
