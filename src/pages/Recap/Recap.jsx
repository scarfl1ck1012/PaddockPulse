import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getTeamColour } from '../../utils/teamColours';
import { CURRENT_SEASON, getCountryFlag } from '../../api/constants';
import { fetchSeasonResults, fetchLapData, fetchRaceResults } from '../../services/api';
import './Recap.css';

const YEARS = Array.from({ length: CURRENT_SEASON - 1995 }, (_, i) => CURRENT_SEASON - i);

// Simple oval track path for when no circuit SVG is available
const DEFAULT_TRACK_PATH = 'M 150,30 C 270,30 290,50 290,100 L 290,200 C 290,250 270,270 150,270 C 30,270 10,250 10,200 L 10,100 C 10,50 30,30 150,30 Z';

export default function Recap() {
  const [year, setYear] = useState(CURRENT_SEASON);
  const [races, setRaces] = useState([]);
  const [selectedRace, setSelectedRace] = useState(null);
  const [allDrivers, setAllDrivers] = useState([]);
  const [lapPositions, setLapPositions] = useState([]);
  const [totalLaps, setTotalLaps] = useState(0);
  const [loading, setLoading] = useState({ races: false, data: false });
  const [error, setError] = useState(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLap, setCurrentLap] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [visibleDrivers, setVisibleDrivers] = useState(new Set());
  const intervalRef = useRef(null);
  const trackPathRef = useRef(null);

  // Fetch races for year
  useEffect(() => {
    const controller = new AbortController();
    async function loadRaces() {
      setLoading(prev => ({ ...prev, races: true }));
      setError(null);
      setRaces([]);
      setSelectedRace(null);
      setAllDrivers([]);
      setLapPositions([]);

      try {
        const data = await fetchSeasonResults(year, controller.signal);
        const raceList = data?.MRData?.RaceTable?.Races || [];
        setRaces(raceList);
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      } finally {
        setLoading(prev => ({ ...prev, races: false }));
      }
    }
    loadRaces();
    return () => controller.abort();
  }, [year]);

  // Fetch lap data when race selected
  useEffect(() => {
    if (!selectedRace) return;
    const controller = new AbortController();

    async function loadLapData() {
      setLoading(prev => ({ ...prev, data: true }));
      setCurrentLap(1);
      setIsPlaying(false);
      if (intervalRef.current) clearInterval(intervalRef.current);

      try {
        const [lapsData, resultsData] = await Promise.all([
          fetchLapData(year, selectedRace.round, controller.signal),
          fetchRaceResults(year, selectedRace.round, controller.signal),
        ]);

        const laps = lapsData?.MRData?.RaceTable?.Races?.[0]?.Laps || [];
        const results = resultsData?.MRData?.RaceTable?.Races?.[0]?.Results || [];

        // Build driver map
        const drivers = results.map(r => ({
          driverId: r.Driver?.driverId,
          code: r.Driver?.code || r.Driver?.familyName?.substring(0, 3).toUpperCase(),
          name: `${r.Driver?.givenName || ''} ${r.Driver?.familyName || ''}`,
          team: r.Constructor?.name || '',
          position: parseInt(r.position),
          color: getTeamColour(r.Constructor?.name || ''),
        }));

        setAllDrivers(drivers);
        setVisibleDrivers(new Set(drivers.map(d => d.driverId)));
        setTotalLaps(laps.length);

        // Build lap-by-lap positions: { lap: number, positions: { driverId: position } }
        const lapData = laps.map(lap => {
          const positions = {};
          lap.Timings?.forEach(t => {
            positions[t.driverId] = parseInt(t.position);
          });
          return { lap: parseInt(lap.number), positions };
        });

        setLapPositions(lapData);
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      } finally {
        setLoading(prev => ({ ...prev, data: false }));
      }
    }

    loadLapData();
    return () => controller.abort();
  }, [year, selectedRace]);

  // Play/Pause
  const togglePlay = useCallback(() => {
    if (!selectedRace || totalLaps === 0) return;
    if (isPlaying) {
      clearInterval(intervalRef.current);
      setIsPlaying(false);
    } else {
      if (currentLap >= totalLaps) setCurrentLap(1);
      setIsPlaying(true);
      intervalRef.current = setInterval(() => {
        setCurrentLap(prev => {
          if (prev >= totalLaps) {
            clearInterval(intervalRef.current);
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 500 / speed);
    }
  }, [isPlaying, selectedRace, totalLaps, speed, currentLap]);

  // Update interval when speed changes
  useEffect(() => {
    if (isPlaying) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setCurrentLap(prev => {
          if (prev >= totalLaps) {
            clearInterval(intervalRef.current);
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 500 / speed);
    }
    return () => clearInterval(intervalRef.current);
  }, [speed, isPlaying, totalLaps]);

  // Cleanup
  useEffect(() => () => clearInterval(intervalRef.current), []);

  const handleScrub = (e) => {
    const val = parseInt(e.target.value);
    setCurrentLap(val);
    if (isPlaying) {
      clearInterval(intervalRef.current);
      setIsPlaying(false);
    }
  };

  // Current lap data
  const currentLapData = lapPositions[currentLap - 1];
  const leaderboard = useMemo(() => {
    if (!currentLapData || !allDrivers.length) return [];
    return allDrivers
      .filter(d => visibleDrivers.has(d.driverId))
      .map(d => ({
        ...d,
        currentPos: currentLapData.positions[d.driverId] || 99,
      }))
      .sort((a, b) => a.currentPos - b.currentPos);
  }, [currentLapData, allDrivers, visibleDrivers]);

  const toggleDriverVisibility = (driverId) => {
    setVisibleDrivers(prev => {
      const next = new Set(prev);
      if (next.has(driverId)) next.delete(driverId);
      else next.add(driverId);
      return next;
    });
  };

  const isPre1996 = year < 1996;

  return (
    <div className="recap-page page-container">
      <div className="page-header">
        <h1 className="page-title">🎬 Race Recap</h1>
        <p className="page-subtitle">Relive past races lap by lap</p>
      </div>

      {/* Year + Race Selector */}
      <div className="recap-selector glass-card">
        <div className="selector-group">
          <label>Year</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="races-list">
          {isPre1996 && (
            <div className="pre2018-disclaimer">
              ⚠️ Lap-by-lap data may not be available before 1996. Replay functionality may be limited.
            </div>
          )}
          {loading.races ? (
            <div className="skeleton-line" style={{ width: '80%', height: 20, margin: '10px 0' }} />
          ) : races.length > 0 ? (
            races.map(race => (
              <button
                key={race.round}
                className={`race-pick ${selectedRace?.round === race.round ? 'active' : ''}`}
                onClick={() => setSelectedRace(race)}
              >
                <span>{getCountryFlag(race.Circuit?.Location?.country || '')}</span>
                <span>{race.raceName}</span>
                <span className="laps-count">R{race.round}</span>
              </button>
            ))
          ) : (
            <p className="no-data">No completed races for {year}.</p>
          )}
        </div>
      </div>

      {error && (
        <div className="error-banner glass-card">
          <p>Failed to load data. {error}</p>
        </div>
      )}

      {/* Replay Viewer */}
      {selectedRace && (
        <div className="recap-viewer">
          {loading.data ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              <div className="skeleton-line" style={{ width: '60%', margin: '0 auto' }} />
              <p style={{ color: 'var(--text-muted)', marginTop: 16 }}>Loading lap data...</p>
            </div>
          ) : totalLaps === 0 ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>
                No lap-by-lap data available for this race. 
                {year < 1996 && ' Detailed lap data is generally available from 1996 onwards.'}
              </p>
            </div>
          ) : (
            <>
              <div className="recap-main-row">
                {/* SVG Track Map */}
                <div className="recap-track-wrapper glass-card">
                  <div className="track-svg-container">
                    <svg viewBox="0 0 300 300" className="track-svg">
                      {/* Track outline */}
                      <path
                        ref={trackPathRef}
                        d={DEFAULT_TRACK_PATH}
                        fill="none"
                        stroke="rgba(255,255,255,0.12)"
                        strokeWidth="14"
                        strokeLinecap="round"
                      />
                      <path
                        d={DEFAULT_TRACK_PATH}
                        fill="none"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="18"
                        strokeLinecap="round"
                      />
                      {/* Car dots */}
                      {leaderboard.map((driver, i) => {
                        const progress = currentLap / totalLaps;
                        const driverOffset = i * 0.02;
                        const angle = ((progress - driverOffset) * Math.PI * 2) - Math.PI / 2;
                        const cx = 150 + 120 * Math.cos(angle);
                        const cy = 150 + 100 * Math.sin(angle);
                        const isLeader = i === 0;

                        return (
                          <g key={driver.driverId}>
                            <circle
                              cx={cx}
                              cy={cy}
                              r={isLeader ? 10 : 7}
                              fill={driver.color}
                              stroke="white"
                              strokeWidth={isLeader ? 2 : 1}
                              opacity={0.9}
                            />
                            <text
                              x={cx}
                              y={cy}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill="white"
                              fontSize={isLeader ? '5.5' : '4.5'}
                              fontWeight="800"
                              fontFamily="var(--font-mono)"
                            >
                              {driver.code}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                  <div className="lap-indicator">
                    <span className="current-lap">LAP {currentLap}</span>
                    <span className="total-laps"> / {totalLaps}</span>
                  </div>
                </div>

                {/* Leaderboard */}
                <div className="recap-leaderboard glass-card">
                  <h3>Race Order — Lap {currentLap}</h3>
                  <div className="recap-driver-list">
                    {leaderboard.map(driver => (
                      <div
                        key={driver.driverId}
                        className="recap-driver-row"
                        style={{ borderLeft: `4px solid ${driver.color}` }}
                      >
                        <span className="recap-pos">{driver.currentPos}</span>
                        <span className="recap-name">{driver.code}</span>
                        <span className="recap-team">{driver.team}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Driver visibility toggles */}
              <div className="driver-toggles glass-card">
                <h4>Show/Hide Drivers</h4>
                <div className="driver-toggle-pills">
                  {allDrivers.map(d => (
                    <button
                      key={d.driverId}
                      className={`driver-pill ${visibleDrivers.has(d.driverId) ? 'selected' : ''}`}
                      style={visibleDrivers.has(d.driverId) ? { borderColor: d.color, backgroundColor: `${d.color}22`, color: d.color } : {}}
                      onClick={() => toggleDriverVisibility(d.driverId)}
                    >
                      <span className="pill-color" style={{ backgroundColor: d.color }} />
                      {d.code}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeline Controls */}
              <div className="recap-controls glass-card">
                <button className="play-pause-btn" onClick={togglePlay}>
                  {isPlaying ? '⏸ Pause' : '▶ Play'}
                </button>
                <div className="speed-controls">
                  {[1, 2, 5, 10].map(s => (
                    <button
                      key={s}
                      className={`speed-btn ${speed === s ? 'active' : ''}`}
                      onClick={() => setSpeed(s)}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min={1}
                  max={totalLaps || 1}
                  value={currentLap}
                  onChange={handleScrub}
                  className="timeline-slider"
                />
                <span className="timeline-label">
                  {currentLap} / {totalLaps}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
