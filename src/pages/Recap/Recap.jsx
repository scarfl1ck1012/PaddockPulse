import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getTeamColour } from '../../utils/teamColours';
import { CURRENT_SEASON, getCountryFlag, TYRE_COMPOUNDS } from '../../api/constants';
import { fetchSeasonResults, fetchLapData } from '../../services/api';
import * as openf1 from '../../api/openf1';
import './Recap.css';

const YEARS = Array.from({ length: CURRENT_SEASON - 1995 }, (_, i) => CURRENT_SEASON - i);
const SPEEDS = [1, 2, 5, 10, 30];

// Parse lap time "1:32.456" to seconds
function parseLapTime(t) {
  if (!t) return null;
  const parts = t.split(':');
  if (parts.length === 2) return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  return parseFloat(t) || null;
}

export default function Recap() {
  const [year, setYear] = useState(CURRENT_SEASON);
  const [races, setRaces] = useState([]);
  const [selectedRound, setSelectedRound] = useState('');
  const [loading, setLoading] = useState({ races: false, data: false });
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState(null);

  // Race data
  const [drivers, setDrivers] = useState([]);
  const [positionFrames, setPositionFrames] = useState([]);
  const [totalLaps, setTotalLaps] = useState(0);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLap, setCurrentLap] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [hiddenDrivers, setHiddenDrivers] = useState(new Set());

  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const lastFrameTimeRef = useRef(0);

  // Fetch races for year
  useEffect(() => {
    const controller = new AbortController();
    async function loadRaces() {
      setLoading(prev => ({ ...prev, races: true }));
      setError(null);
      setRaces([]);
      setSelectedRound('');
      setDrivers([]);
      setPositionFrames([]);

      try {
        const data = await fetchSeasonResults(year, controller.signal);
        const raceList = data?.MRData?.RaceTable?.Races || [];
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

  // Load race data when round selected
  useEffect(() => {
    if (!selectedRound) return;
    const controller = new AbortController();

    async function loadRaceData() {
      setLoading(prev => ({ ...prev, data: true }));
      setError(null);
      setIsPlaying(false);
      setCurrentLap(0);
      setLoadingMsg('Fetching race data...');

      try {
        // Get results for driver info
        const selectedRace = races.find(r => r.round === selectedRound);
        const results = selectedRace?.Results || [];

        const driverList = results.map(r => ({
          driverId: r.Driver?.driverId,
          code: r.Driver?.code || r.Driver?.familyName?.substring(0, 3).toUpperCase(),
          name: `${r.Driver?.givenName || ''} ${r.Driver?.familyName || ''}`,
          team: r.Constructor?.name || '',
          position: parseInt(r.position),
          status: r.status,
          number: r.number,
          color: getTeamColour(r.Constructor?.name) || '#666',
        }));
        setDrivers(driverList);

        // Fetch lap-by-lap data from Jolpica
        setLoadingMsg('Fetching lap data...');
        const lapData = await fetchLapData(year, selectedRound, controller.signal);
        const laps = lapData?.MRData?.RaceTable?.Races?.[0]?.Laps || [];
        setTotalLaps(laps.length);

        if (laps.length === 0) {
          setLoadingMsg('No lap data available for this race.');
          setPositionFrames([]);
          setLoading(prev => ({ ...prev, data: false }));
          return;
        }

        // Build position frames: one per lap
        setLoadingMsg(`Building position frames (${laps.length} laps × ${driverList.length} drivers)...`);

        const frames = laps.map(lap => {
          const lapNum = parseInt(lap.number);
          const positions = {};
          lap.Timings?.forEach(t => {
            positions[t.driverId] = {
              position: parseInt(t.position),
              time: t.time,
              timeSeconds: parseLapTime(t.time),
            };
          });
          return { lap: lapNum, positions };
        });

        setPositionFrames(frames);
        setLoadingMsg('Ready!');
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      } finally {
        setLoading(prev => ({ ...prev, data: false }));
      }
    }

    loadRaceData();
    return () => controller.abort();
  }, [year, selectedRound, races]);

  // --- Canvas drawing ---
  const drawFrame = useCallback((lapIdx) => {
    const canvas = canvasRef.current;
    if (!canvas || !positionFrames.length || lapIdx >= positionFrames.length) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const frame = positionFrames[lapIdx];
    if (!frame) return;

    // Draw an oval track
    const cx = W / 2;
    const cy = H / 2;
    const rx = W * 0.4;
    const ry = H * 0.38;

    // Track outline
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 20;
    ctx.stroke();

    // Track center line
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Place drivers around the track based on position
    const activeDrivers = drivers.filter(d => !hiddenDrivers.has(d.driverId));
    const totalPositions = activeDrivers.length || 20;

    activeDrivers.forEach(driver => {
      const posData = frame.positions[driver.driverId];
      if (!posData) return;

      const pos = posData.position;
      // Position along the ellipse: leader at top, spread evenly
      const angle = -Math.PI / 2 + (pos - 1) * (Math.PI * 2 / totalPositions);
      const x = cx + rx * Math.cos(angle);
      const y = cy + ry * Math.sin(angle);

      // Draw car dot
      const isLeader = pos === 1;
      const radius = isLeader ? 8 : 6;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = driver.color;
      ctx.fill();
      ctx.strokeStyle = isLeader ? '#ffd700' : '#fff';
      ctx.lineWidth = isLeader ? 2 : 1;
      ctx.stroke();

      // Driver code label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(driver.code, x, y + radius + 12);
    });

    // Lap indicator overlay
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, H - 36, W, 36);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Lap ${frame.lap} / ${totalLaps}`, cx, H - 12);
  }, [positionFrames, drivers, totalLaps, hiddenDrivers]);

  // Draw current frame
  useEffect(() => {
    drawFrame(currentLap);
  }, [currentLap, drawFrame]);

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = Math.min(parent.clientWidth * 0.6, 400);
        drawFrame(currentLap);
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [drawFrame, currentLap]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !positionFrames.length) return;

    const speed = SPEEDS[speedIdx];
    const interval = 1000 / speed; // ms per frame

    const step = (timestamp) => {
      if (timestamp - lastFrameTimeRef.current >= interval) {
        lastFrameTimeRef.current = timestamp;
        setCurrentLap(prev => {
          if (prev >= positionFrames.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }
      animRef.current = requestAnimationFrame(step);
    };

    animRef.current = requestAnimationFrame(step);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isPlaying, speedIdx, positionFrames.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === 'Space') { e.preventDefault(); setIsPlaying(p => !p); }
      if (e.code === 'ArrowUp') { e.preventDefault(); setSpeedIdx(i => Math.min(i + 1, SPEEDS.length - 1)); }
      if (e.code === 'ArrowDown') { e.preventDefault(); setSpeedIdx(i => Math.max(i - 1, 0)); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const toggleDriver = (driverId) => {
    setHiddenDrivers(prev => {
      const next = new Set(prev);
      if (next.has(driverId)) next.delete(driverId);
      else next.add(driverId);
      return next;
    });
  };

  const restart = () => { setCurrentLap(0); setIsPlaying(true); };
  const selectedRace = races.find(r => r.round === selectedRound);

  // Current leaderboard at this lap
  const currentLeaderboard = useMemo(() => {
    if (!positionFrames.length || currentLap >= positionFrames.length) return drivers;
    const frame = positionFrames[currentLap];
    return [...drivers]
      .map(d => ({
        ...d,
        currentPos: frame.positions[d.driverId]?.position || 99,
        lapTime: frame.positions[d.driverId]?.time || '',
      }))
      .sort((a, b) => a.currentPos - b.currentPos);
  }, [drivers, positionFrames, currentLap]);

  return (
    <div className="recap-page page-container">
      <div className="page-header">
        <h1 className="page-title">🎬 Race Replay</h1>
        <p className="page-subtitle">Watch races unfold lap by lap</p>
      </div>

      {/* Selector */}
      <div className="recap-selector glass-card">
        <div className="selector-group">
          <label>Year</label>
          <select value={year} onChange={e => setYear(Number(e.target.value))}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="races-list">
          {loading.races && <span className="chip-loading">Loading...</span>}
          {races.map(race => (
            <button
              key={race.round}
              className={`race-pick ${selectedRound === race.round ? 'active' : ''}`}
              onClick={() => setSelectedRound(race.round)}
            >
              R{race.round} {race.raceName?.replace(' Grand Prix', '')}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="error-banner glass-card">
          <p>{error}</p>
        </div>
      )}

      {loading.data ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>{loadingMsg}</p>
          <div className="progress-track" style={{ maxWidth: 300, margin: '16px auto' }}>
            <div className="progress-fill" style={{ width: '60%' }} />
          </div>
        </div>
      ) : positionFrames.length > 0 ? (
        <div className="recap-viewer">
          <div className="recap-main-row">
            {/* Track Canvas */}
            <div className="recap-track-wrapper glass-card">
              <div className="canvas-container" style={{ position: 'relative' }}>
                <canvas ref={canvasRef} style={{ width: '100%', display: 'block' }} />
              </div>
            </div>

            {/* Leaderboard */}
            <div className="recap-leaderboard glass-card">
              <h3>Lap {(positionFrames[currentLap]?.lap) || 0} / {totalLaps}</h3>
              <div className="recap-driver-list">
                {currentLeaderboard.map((d, i) => {
                  const isDNF = d.status && d.status !== 'Finished' && !d.status.startsWith('+');
                  const isHidden = hiddenDrivers.has(d.driverId);
                  return (
                    <div
                      key={d.driverId}
                      className={`recap-driver-row ${isHidden ? 'driver-hidden' : ''}`}
                      style={{ borderLeftColor: d.color }}
                    >
                      <span className="recap-pos">{d.currentPos || i + 1}</span>
                      <span className="recap-color-dot" style={{ backgroundColor: d.color }} />
                      <span className="recap-name">{d.code}</span>
                      <span className="recap-gap">{d.lapTime || ''}</span>
                      {isDNF && <span className="recap-dnf">OUT</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="recap-controls glass-card">
            <button className="play-pause-btn" onClick={() => setIsPlaying(p => !p)}>
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
            <button className="play-pause-btn" onClick={restart} style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
              ↺ Restart
            </button>
            <div className="speed-controls">
              {SPEEDS.map((s, i) => (
                <button
                  key={s}
                  className={`speed-btn ${speedIdx === i ? 'active' : ''}`}
                  onClick={() => setSpeedIdx(i)}
                >
                  {s}x
                </button>
              ))}
            </div>
            <input
              type="range"
              className="timeline-slider"
              min={0}
              max={positionFrames.length - 1}
              value={currentLap}
              onChange={e => { setCurrentLap(parseInt(e.target.value)); setIsPlaying(false); }}
            />
            <span className="timeline-label">
              Lap {positionFrames[currentLap]?.lap || 0}/{totalLaps}
            </span>
          </div>

          {/* Driver Toggles */}
          <div className="driver-toggles glass-card">
            <h4>Toggle Drivers</h4>
            <div className="driver-toggle-pills">
              {drivers.map(d => (
                <button
                  key={d.driverId}
                  className={`driver-pill ${hiddenDrivers.has(d.driverId) ? '' : 'selected'}`}
                  style={!hiddenDrivers.has(d.driverId) ? {
                    borderColor: d.color,
                    backgroundColor: `${d.color}22`,
                    color: d.color,
                  } : {}}
                  onClick={() => toggleDriver(d.driverId)}
                >
                  <span className="pill-color" style={{ backgroundColor: d.color }} />
                  {d.code}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        !loading.races && selectedRound && (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>
              {loadingMsg || 'No lap data available for this race.'}
            </p>
          </div>
        )
      )}
    </div>
  );
}
