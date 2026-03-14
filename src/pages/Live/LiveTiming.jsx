import React from 'react';
import useLiveSession from '../../hooks/useLiveSession';
import useLiveTiming from '../../hooks/useLiveTiming';
import useCountdown from '../../hooks/useCountdown';
import { TYRE_COMPOUNDS } from '../../api/constants';
import './LiveTiming.css';

// --- Sub-components ---

function TyreIcon({ compound }) {
  const tyre = TYRE_COMPOUNDS[compound?.toUpperCase()] || { color: '#666', letter: '?' };
  return (
    <span className="tyre-icon" style={{ backgroundColor: tyre.color, color: compound === 'HARD' ? '#000' : '#fff' }}>
      {tyre.letter}
    </span>
  );
}

function SessionHeader({ session }) {
  if (!session) return null;
  const typeName = session.session_type || session.session_name || 'Session';
  const gpName = session.meeting_name || session.circuit_short_name || '';
  return (
    <div className="live-session-header">
      <span className="pulsing-dot"></span>
      <span className="live-badge">LIVE</span>
      <span className="session-label">{gpName} · {typeName}</span>
    </div>
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

function TimingTower({ leaderboard, sessionType }) {
  const isQualifying = sessionType?.toLowerCase().includes('qualifying');

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
        <span className="th-gap">{isQualifying ? 'Delta' : 'Gap'}</span>
        <span className="th-last">Last</span>
        <span className="th-best">Best</span>
        <span className="th-tyre">Tyre</span>
      </div>
      <div className="tower-rows">
        {leaderboard.map((entry, i) => {
          const isLeader = i === 0;
          return (
            <div
              key={entry.driverNumber}
              className={`tower-row ${isLeader ? 'leader-row' : ''}`}
              style={{ borderLeftColor: entry.teamColor }}
            >
              <span className="td-pos">{entry.position}</span>
              <span className="td-driver">
                <span className="driver-code-badge">{entry.code}</span>
              </span>
              <span className="td-gap">{isLeader ? 'LEADER' : entry.gap || '—'}</span>
              <span className="td-last">{entry.lastLap}</span>
              <span className="td-best">{entry.bestLap}</span>
              <span className="td-tyre">
                {entry.compound ? <TyreIcon compound={entry.compound} /> : null}
                {entry.tyreAge > 0 && <span className="tyre-age">{entry.tyreAge}</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RaceControlFeed({ messages }) {
  const recentMessages = messages.slice(-80).reverse();

  const getFlagClass = (msg) => {
    const flag = (msg.flag || '').toUpperCase();
    const cat = (msg.category || '').toUpperCase();
    if (flag.includes('RED') || cat.includes('RED')) return 'rc-red';
    if (flag.includes('YELLOW') || cat.includes('YELLOW')) return 'rc-yellow';
    if (flag.includes('GREEN') || cat.includes('GREEN')) return 'rc-green';
    if (cat.includes('SAFETY') || cat.includes('VSC')) return 'rc-safety';
    return '';
  };

  return (
    <div className="race-control-feed glass-card">
      <h3>Race Control</h3>
      {recentMessages.length === 0 ? (
        <p className="no-data-text">No messages yet</p>
      ) : (
        <div className="rc-messages">
          {recentMessages.map((msg, i) => (
            <div key={i} className={`rc-message ${getFlagClass(msg)}`}>
              <span className="rc-time">
                {msg.date ? new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
              </span>
              <span className="rc-text">{msg.message || ''}</span>
              {msg.flag && <span className="rc-flag">{msg.flag}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OfflineState({ nextSession, loading }) {
  const sessionDate = nextSession?.date_start || '2099-01-01T00:00:00Z';
  const { formattedString } = useCountdown(sessionDate);

  const localDateTime = nextSession ? new Intl.DateTimeFormat(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
  }).format(new Date(nextSession.date_start)) : '';

  return (
    <div className="page-container" id="live-page-offline">
      <div className="offline-banner glass-card">
        <h2>No Active Session</h2>
        {loading ? (
          <div className="skeleton-line" style={{ width: '60%', margin: '16px auto' }} />
        ) : nextSession ? (
          <>
            <div className="next-session-card">
              <span className="session-type-pill">{nextSession.session_type || nextSession.session_name || 'Session'}</span>
              <h3>{nextSession.meeting_name || nextSession.circuit_short_name || 'Upcoming'}</h3>
              <p className="circuit-info">{nextSession.circuit_short_name || ''}</p>
              <p className="session-local-time">{localDateTime}</p>
            </div>
            <div className="countdown-display">{formattedString}</div>
          </>
        ) : (
          <p className="no-data-text">No upcoming sessions found for this season.</p>
        )}
      </div>
    </div>
  );
}

// --- Main Component ---

export default function LiveTiming() {
  const { isLive, liveSession, nextSession, loading: sessionLoading } = useLiveSession();
  const sessionKey = liveSession?.session_key || null;
  const { leaderboard, raceControl, weather, loading: liveLoading } = useLiveTiming(sessionKey);
  const sessionType = liveSession?.session_type || '';

  if (!isLive) {
    return <OfflineState nextSession={nextSession} loading={sessionLoading} />;
  }

  return (
    <div className="live-timing-layout page-container">
      {/* Session header */}
      <SessionHeader session={liveSession} />

      {/* Top 3-Panel Dashboard */}
      <div className="live-panels-row">
        {/* Left: Timing Tower */}
        <div className="live-panel panel-left">
          <TimingTower leaderboard={leaderboard} sessionType={sessionType} />
        </div>

        {/* Centre: Weather + Track Map placeholder */}
        <div className="live-panel panel-center">
          <WeatherWidget weather={weather} />
          <div className="glass-card track-map-placeholder">
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
