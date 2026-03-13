import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useLiveSession from '../../hooks/useLiveSession';
import useCountdown from '../../hooks/useCountdown';
// Assume we have a hook or jolpica API call for these stats, 
// using static mocks here for immediate visual compliance while data layer is pending 
// if the previous backend hooks are missing.
import './Dashboard.css';

export default function Dashboard() {
  const { isLive } = useLiveSession();
  
  // Example next session date
  const nextSessionDate = '2026-03-20T14:00:00+05:30'; 
  const { isExpired, formattedString } = useCountdown(nextSessionDate);

  // Mock Quick Stats Data (as Jolpica integration would provide)
  const quickStats = {
    championshipLeader: { name: 'Max Verstappen', points: 395, team: 'RedBull' },
    constructorLeader: { name: 'McLaren', points: 512, colour: '#FF8000' },
    lastWinner: { name: 'Lando Norris', race: 'Abu Dhabi GP', date: 'Dec 8, 2025' }
  };

  return (
    <div className="dashboard-container page-container">
      
      {/* 1. Dynamic Hero / Session Banner */}
      <section className={`hero-banner glass-card ${isLive ? 'is-live' : 'is-countdown'}`}>
        {isLive ? (
          <div className="live-now-container">
            <span className="pulsing-dot"></span>
            <div className="live-text-block">
              <h1 className="live-title">LIVE NOW</h1>
              <p className="live-subtitle">Track activity in progress</p>
            </div>
            <Link to="/live" className="action-button primary">Enter PitWall</Link>
          </div>
        ) : (
          <div className="countdown-container">
            <h2 className="next-session-title">NEXT SESSION STARTS IN</h2>
            <div className="timer-display">{formattedString}</div>
            <p className="session-info">Australian Grand Prix • FP1</p>
          </div>
        )}
      </section>

      {/* 2. Quick Stats Strip */}
      <section className="quick-stats-strip">
        <div className="stat-card glass-card">
          <span className="stat-label">Driver Standings Leader</span>
          <div className="stat-value">
            <span className="stat-name">{quickStats.championshipLeader.name}</span>
            <span className="stat-number">{quickStats.championshipLeader.points} pts</span>
          </div>
        </div>
        <div className="stat-card glass-card">
          <span className="stat-label">Constructor Leader</span>
          <div className="stat-value">
            <span className="stat-name" style={{ color: quickStats.constructorLeader.colour }}>
              {quickStats.constructorLeader.name}
            </span>
            <span className="stat-number">{quickStats.constructorLeader.points} pts</span>
          </div>
        </div>
        <div className="stat-card glass-card">
          <span className="stat-label">Last Race Winner</span>
          <div className="stat-value">
            <span className="stat-name">{quickStats.lastWinner.name}</span>
            <span className="stat-detail">{quickStats.lastWinner.race}</span>
          </div>
        </div>
      </section>

      {/* 3. Four Feature Cards */}
      <section className="features-grid">
        <Link to="/live" className="feature-card glass-card hover-lift">
          <div className="feature-icon">🔴</div>
          <h3>Live Timing</h3>
          <p>Real-time telemetry, track map, and radio.</p>
        </Link>
        <Link to="/compare" className="feature-card glass-card hover-lift">
          <div className="feature-icon">⚔️</div>
          <h3>Head-to-Head</h3>
          <p>Compare lap paces and strategies directly.</p>
        </Link>
        <Link to="/standings" className="feature-card glass-card hover-lift">
          <div className="feature-icon">🏆</div>
          <h3>Championship</h3>
          <p>Current season driver & constructor tables.</p>
        </Link>
        <Link to="/learn" className="feature-card glass-card hover-lift">
          <div className="feature-icon">📚</div>
          <h3>F1 Learn</h3>
          <p>Understand DRS, Tyres, and F1 mechanics.</p>
        </Link>
      </section>

      {/* 4. Last Race Podium Preview */}
      <section className="podium-preview glass-card">
        <div className="section-header">
          <h3>Last Race Podium</h3>
          <Link to="/results" className="text-link">Full Results &rarr;</Link>
        </div>
        <div className="podium-visual-mini">
          <div className="podium-step step-2">
            <span className="driver-code">LEC</span>
            <div className="block silver">P2</div>
          </div>
          <div className="podium-step step-1">
            <span className="driver-code">NOR</span>
            <div className="block gold">P1</div>
          </div>
          <div className="podium-step step-3">
            <span className="driver-code">PIA</span>
            <div className="block bronze">P3</div>
          </div>
        </div>
      </section>

    </div>
  );
}
