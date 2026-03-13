import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getTeamColour } from '../../utils/teamColours';
import { formatLapTime } from '../../utils/formatters';
import './Recap.css';

// Mock race data for demonstration
const MOCK_RACES = {
  '2025': [
    { round: 1, name: 'Bahrain Grand Prix', country: '🇧🇭', totalLaps: 57 },
    { round: 2, name: 'Saudi Arabian Grand Prix', country: '🇸🇦', totalLaps: 50 },
    { round: 3, name: 'Australian Grand Prix', country: '🇦🇺', totalLaps: 58 },
  ],
  '2024': [
    { round: 1, name: 'Bahrain Grand Prix', country: '🇧🇭', totalLaps: 57 },
    { round: 2, name: 'Saudi Arabian Grand Prix', country: '🇸🇦', totalLaps: 50 },
  ],
};

// Simulated leaderboard at any given lap
const generateLeaderboardAtLap = (lap) => {
  const drivers = [
    { pos: 1, acronym: 'VER', team: 'Red Bull Racing', gap: 'LEADER' },
    { pos: 2, acronym: 'NOR', team: 'McLaren', gap: `+${(1.2 + Math.random() * 3).toFixed(1)}s` },
    { pos: 3, acronym: 'LEC', team: 'Ferrari', gap: `+${(3.5 + Math.random() * 5).toFixed(1)}s` },
    { pos: 4, acronym: 'PIA', team: 'McLaren', gap: `+${(8 + Math.random() * 4).toFixed(1)}s` },
    { pos: 5, acronym: 'SAI', team: 'Ferrari', gap: `+${(12 + Math.random() * 5).toFixed(1)}s` },
  ];
  return drivers;
};

export default function Recap() {
  const [year, setYear] = useState('2025');
  const [selectedRace, setSelectedRace] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLap, setCurrentLap] = useState(1);
  const [leaderboard, setLeaderboard] = useState([]);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  const races = MOCK_RACES[year] || [];
  const isPre2018 = parseInt(year) < 2018;

  // Update leaderboard whenever current lap changes
  useEffect(() => {
    if (selectedRace) {
      setLeaderboard(generateLeaderboardAtLap(currentLap));
    }
  }, [currentLap, selectedRace]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedRace) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Draw simplified track
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.roundRect(30, 30, canvas.width - 60, canvas.height - 60, 40);
    ctx.stroke();

    // Draw dots around track based on current lap progress
    const progress = currentLap / (selectedRace.totalLaps || 50);
    leaderboard.forEach((driver, i) => {
      const angle = (progress * Math.PI * 2) - (i * 0.15) - Math.PI / 2;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const rx = (canvas.width - 80) / 2;
      const ry = (canvas.height - 80) / 2;
      const x = cx + rx * Math.cos(angle);
      const y = cy + ry * Math.sin(angle);

      const color = getTeamColour(driver.team);
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(driver.acronym, x, y);
    });
  }, [currentLap, leaderboard, selectedRace]);

  // Play/Pause logic
  const togglePlay = useCallback(() => {
    if (!selectedRace) return;
    if (isPlaying) {
      clearInterval(intervalRef.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      intervalRef.current = setInterval(() => {
        setCurrentLap(prev => {
          if (prev >= (selectedRace.totalLaps || 50)) {
            clearInterval(intervalRef.current);
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 300); // Advance 1 lap per 300ms
    }
  }, [isPlaying, selectedRace]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleScrub = (e) => {
    const val = parseInt(e.target.value);
    setCurrentLap(val);
    // Pause if scrubbing
    if (isPlaying) {
      clearInterval(intervalRef.current);
      setIsPlaying(false);
    }
  };

  const handleSelectRace = (race) => {
    setSelectedRace(race);
    setCurrentLap(1);
    setIsPlaying(false);
    clearInterval(intervalRef.current);
  };

  return (
    <div className="recap-page page-container">
      <div className="page-header">
        <h1 className="page-title">🎬 Race Recap</h1>
        <p className="page-subtitle">Relive past races lap by lap</p>
      </div>

      {/* Year + GP Selector */}
      <div className="recap-selector glass-card">
        <div className="selector-group">
          <label>Year</label>
          <select value={year} onChange={(e) => { setYear(e.target.value); setSelectedRace(null); }}>
            {Object.keys(MOCK_RACES).map(y => <option key={y}>{y}</option>)}
            <option>2017</option>
            <option>2016</option>
          </select>
        </div>

        <div className="races-list">
          {isPre2018 && (
            <div className="pre2018-disclaimer">
              ⚠️ Detailed telemetry data is not available before the 2018 season. Replay functionality may be limited.
            </div>
          )}
          {races.map(race => (
            <button
              key={race.round}
              className={`race-pick ${selectedRace?.round === race.round ? 'active' : ''}`}
              onClick={() => handleSelectRace(race)}
            >
              <span>{race.country}</span>
              <span>{race.name}</span>
              <span className="laps-count">{race.totalLaps} laps</span>
            </button>
          ))}
          {races.length === 0 && !isPre2018 && <p className="no-data">No race data available.</p>}
        </div>
      </div>

      {/* Replay Viewer */}
      {selectedRace && (
        <div className="recap-viewer">
          <div className="recap-main-row">
            {/* Canvas Track Map */}
            <div className="recap-canvas-wrapper glass-card">
              <div className="canvas-container">
                <canvas ref={canvasRef}></canvas>
              </div>
              <div className="lap-indicator">
                <span className="current-lap">LAP {currentLap}</span>
                <span className="total-laps"> / {selectedRace.totalLaps}</span>
              </div>
            </div>

            {/* Live Leaderboard */}
            <div className="recap-leaderboard glass-card">
              <h3>Race Order</h3>
              <div className="recap-driver-list">
                {leaderboard.map(driver => (
                  <div
                    key={driver.acronym}
                    className="recap-driver-row"
                    style={{ borderLeft: `4px solid ${getTeamColour(driver.team)}` }}
                  >
                    <span className="recap-pos">{driver.pos}</span>
                    <span className="recap-name">{driver.acronym}</span>
                    <span className="recap-gap">{driver.gap}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline Controls */}
          <div className="recap-controls glass-card">
            <button className="play-pause-btn" onClick={togglePlay}>
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
            <input
              type="range"
              min={1}
              max={selectedRace.totalLaps}
              value={currentLap}
              onChange={handleScrub}
              className="timeline-slider"
            />
            <span className="timeline-label">
              {currentLap} / {selectedRace.totalLaps}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
