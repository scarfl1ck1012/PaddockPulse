import { useState, useEffect, useCallback } from 'react';
import useLiveSession from '../../hooks/useLiveSession';
import useLiveTiming from '../../hooks/useLiveTiming';
import useCountdown from '../../hooks/useCountdown';
import useSchedule from '../../hooks/useSchedule';
import { getCountryFlag } from '../../api/constants';
import { TYRE_COMPOUNDS } from '../../api/constants';

import './LiveTiming.css';

function TyreIcon({ compound }) {
  const tyre = TYRE_COMPOUNDS[compound?.toUpperCase()] || { color: '#666', letter: '?' };
  return (
    <span className="tyre-icon" style={{ backgroundColor: tyre.color, color: compound === 'HARD' ? '#000' : '#fff' }}>
      {tyre.letter}
    </span>
  );
}

function WeatherWidget({ weather }) {
  if (!weather) return null;
  return (
    <div className="weather-widget glass-card">
      <h4>🌤 Weather</h4>
      <div className="weather-grid">
        <div className="weather-item">
          <span className="weather-label">Track</span>
          <span className="weather-value">{weather.track_temperature?.toFixed(1) || '—'}°C</span>
        </div>
        <div className="weather-item">
          <span className="weather-label">Air</span>
          <span className="weather-value">{weather.air_temperature?.toFixed(1) || '—'}°C</span>
        </div>
        <div className="weather-item">
          <span className="weather-label">Humidity</span>
          <span className="weather-value">{weather.humidity?.toFixed(0) || '—'}%</span>
        </div>
        <div className="weather-item">
          <span className="weather-label">Wind</span>
          <span className="weather-value">{weather.wind_speed?.toFixed(1) || '—'} km/h</span>
        </div>
      </div>
    </div>
  );
}

function TimingTower({ leaderboard }) {
  if (!leaderboard.length) {
    return (
      <div className="timing-tower glass-card">
        <h3>Timing Tower</h3>
        <p className="no-data-text">Waiting for position data...</p>
      </div>
    );
  }

  return (
    <div className="timing-tower glass-card">
      <h3>Timing Tower</h3>
      <div className="tower-header">
        <span className="th-pos">P</span>
        <span className="th-driver">Driver</span>
        <span className="th-gap">Gap</span>
        <span className="th-last">Last</span>
        <span className="th-best">Best</span>
        <span className="th-tyre">Tyre</span>
      </div>
      <div className="tower-rows">
        {leaderboard.map((entry, i) => (
          <div key={entry.driverNumber} className="tower-row" style={{ borderLeftColor: entry.teamColor }}>
            <span className="td-pos">{entry.position}</span>
            <span className="td-driver">
              <span className="driver-code-badge">{entry.code}</span>
            </span>
            <span className="td-gap">{i === 0 ? 'LEADER' : entry.gap || '—'}</span>
            <span className="td-last">{entry.lastLap}</span>
            <span className="td-best">{entry.bestLap}</span>
            <span className="td-tyre">
              {entry.compound && <TyreIcon compound={entry.compound} />}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RaceControlFeed({ messages }) {
  const recentMessages = messages.slice(-50).reverse();
  
  return (
    <div className="race-control-feed glass-card">
      <h3>Race Control</h3>
      {recentMessages.length === 0 ? (
        <p className="no-data-text">No messages yet</p>
      ) : (
        <div className="rc-messages">
          {recentMessages.map((msg, i) => (
            <div key={i} className={`rc-message ${msg.flag || ''}`}>
              <span className="rc-time">
                {msg.date ? new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
              </span>
              <span className="rc-text">{msg.message || JSON.stringify(msg)}</span>
              {msg.flag && <span className="rc-flag">{msg.flag}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LiveTiming() {
  const { isLive } = useLiveSession();
  const { nextRace, loading: scheduleLoading } = useSchedule();
  const [sessionKey, setSessionKey] = useState(null);

  // Detect active session
  useEffect(() => {
    async function detectSession() {
      try {
        const res = await fetch('https://api.openf1.org/v1/sessions?session_key=latest');
        const data = await res.json();
        if (data && data.length > 0) {
          const session = data[0];
          const now = new Date();
          const endDate = session.date_end ? new Date(session.date_end) : null;
          if (!endDate || now < endDate) {
            setSessionKey(session.session_key);
          }
        }
      } catch (err) {
        console.error('Session detection error:', err);
      }
    }
    detectSession();
  }, []);

  const { leaderboard, raceControl, weather, loading: liveLoading } = useLiveTiming(sessionKey);

  // Build countdown target from next race
  const raceDateTime = nextRace
    ? nextRace.date + 'T' + (nextRace.time || '14:00:00Z')
    : null;
  const { formattedString } = useCountdown(raceDateTime || '2099-01-01T00:00:00Z');

  if (!isLive && !sessionKey) {
    return (
      <div className="page-container" id="live-page-offline">
        <div className="offline-banner glass-card">
          <h2>No Active Session</h2>
          {scheduleLoading ? (
            <div className="skeleton-line" style={{ width: '60%', margin: '16px auto' }} />
          ) : nextRace ? (
            <>
              <p>Next up: <strong>{nextRace.raceName}</strong></p>
              <p className="circuit-info">
                {getCountryFlag(nextRace.Circuit?.Location?.country || '')} {nextRace.Circuit?.circuitName || ''}
              </p>
              <div className="countdown-display">{formattedString}</div>
            </>
          ) : (
            <p>No upcoming sessions scheduled.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="live-timing-layout page-container">
      {/* Top 3-Panel Dashboard */}
      <div className="live-panels-row">
        {/* Left: Timing Tower */}
        <div className="live-panel panel-left">
          <TimingTower leaderboard={leaderboard} />
        </div>
        
        {/* Centre: Weather */}
        <div className="live-panel panel-center">
          <WeatherWidget weather={weather} />
          <div className="glass-card" style={{ padding: 'var(--space-4)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p className="no-data-text">Track Map — Live data streaming</p>
          </div>
        </div>
        
        {/* Right: Race Control */}
        <div className="live-panel panel-right">
          <RaceControlFeed messages={raceControl} />
        </div>
      </div>
    </div>
  );
}
