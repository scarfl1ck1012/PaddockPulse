import React from 'react';
import { Link } from 'react-router-dom';
import useLiveSession from '../../hooks/useLiveSession';
import useCountdown from '../../hooks/useCountdown';
import useSchedule from '../../hooks/useSchedule';
import { getTeamColour } from '../../utils/teamColours';
import { getCountryFlag } from '../../api/constants';
import './Dashboard.css';

function SkeletonCard() {
  return (
    <div className="stat-card glass-card skeleton-card">
      <div className="skeleton-line short" />
      <div className="skeleton-line" />
    </div>
  );
}

function HeroBanner({ isLive, nextRace, loading }) {
  // Build the countdown target date from the next race
  const raceDateTime = nextRace
    ? nextRace.date + 'T' + (nextRace.time || '14:00:00Z')
    : null;
  const { isExpired, formattedString } = useCountdown(raceDateTime || '2099-01-01T00:00:00Z');

  if (loading) {
    return (
      <section className="hero-banner glass-card is-countdown">
        <div className="countdown-container">
          <div className="skeleton-line short" style={{ margin: '0 auto' }} />
          <div className="skeleton-line" style={{ width: '60%', margin: '12px auto' }} />
        </div>
      </section>
    );
  }

  if (isLive) {
    return (
      <section className="hero-banner glass-card is-live">
        <div className="live-now-container">
          <span className="pulsing-dot"></span>
          <div className="live-text-block">
            <h1 className="live-title">LIVE NOW</h1>
            <p className="live-subtitle">
              {nextRace ? `${nextRace.raceName} — ${nextRace.Circuit?.circuitName || ''}` : 'Track activity in progress'}
            </p>
          </div>
          <Link to="/live" className="action-button primary">Enter PitWall</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="hero-banner glass-card is-countdown">
      <div className="countdown-container">
        <h2 className="next-session-title">NEXT SESSION STARTS IN</h2>
        <div className="timer-display">{isExpired ? 'RACE WEEKEND' : formattedString}</div>
        {nextRace && (
          <p className="session-info">
            {getCountryFlag(nextRace.Circuit?.Location?.country || '')} {nextRace.raceName} • {nextRace.Circuit?.circuitName || ''}
          </p>
        )}
      </div>
    </section>
  );
}

export default function Dashboard() {
  const { isLive } = useLiveSession();
  const { nextRace, loading, error, lastRacePodium, driverLeader, constructorLeader, reload } = useSchedule();

  return (
    <div className="dashboard-container page-container">

      {/* 1. Dynamic Hero / Session Banner */}
      <HeroBanner isLive={isLive} nextRace={nextRace} loading={loading} />

      {/* Error state */}
      {error && (
        <div className="error-banner glass-card">
          <p>Failed to load data.</p>
          <button className="action-button secondary" onClick={reload}>Retry</button>
        </div>
      )}

      {/* 2. Quick Stats Strip */}
      <section className="quick-stats-strip">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <div className="stat-card glass-card">
              <span className="stat-label">Driver Standings Leader</span>
              <div className="stat-value">
                <span className="stat-name">{driverLeader?.name || '—'}</span>
                <span className="stat-number">{driverLeader?.points || 0} pts</span>
              </div>
            </div>
            <div className="stat-card glass-card">
              <span className="stat-label">Constructor Leader</span>
              <div className="stat-value">
                <span className="stat-name" style={{ color: constructorLeader ? getTeamColour(constructorLeader.name) : 'inherit' }}>
                  {constructorLeader?.name || '—'}
                </span>
                <span className="stat-number">{constructorLeader?.points || 0} pts</span>
              </div>
            </div>
            <div className="stat-card glass-card">
              <span className="stat-label">Last Race Winner</span>
              <div className="stat-value">
                <span className="stat-name">
                  {lastRacePodium?.p1 ? `${lastRacePodium.p1.Driver.givenName} ${lastRacePodium.p1.Driver.familyName}` : '—'}
                </span>
                <span className="stat-detail">{lastRacePodium?.raceName || ''}</span>
              </div>
            </div>
          </>
        )}
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
        {loading ? (
          <div className="podium-visual-mini">
            <div className="skeleton-line" style={{ width: '80%', margin: '20px auto' }} />
          </div>
        ) : lastRacePodium ? (
          <div className="podium-visual-mini">
            <div className="podium-step step-2">
              <span className="driver-code">{lastRacePodium.p2?.Driver?.code || '—'}</span>
              <div className="block silver">P2</div>
            </div>
            <div className="podium-step step-1">
              <span className="driver-code">{lastRacePodium.p1?.Driver?.code || '—'}</span>
              <div className="block gold">P1</div>
            </div>
            <div className="podium-step step-3">
              <span className="driver-code">{lastRacePodium.p3?.Driver?.code || '—'}</span>
              <div className="block bronze">P3</div>
            </div>
          </div>
        ) : (
          <p className="text-muted" style={{ padding: '20px', textAlign: 'center' }}>No race results yet this season.</p>
        )}
      </section>

    </div>
  );
}
