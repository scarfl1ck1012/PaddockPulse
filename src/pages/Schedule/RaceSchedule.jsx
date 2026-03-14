import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import useCountdown from '../../hooks/useCountdown';
import { fetchSeasonSchedule, fetchRaceResults } from '../../services/api';
import { getCountryFlag, CURRENT_SEASON } from '../../api/constants';
import './RaceSchedule.css';

const YEARS = Array.from({ length: CURRENT_SEASON - 1999 }, (_, i) => CURRENT_SEASON - i);

// --- Notification helpers ---
function getNotifKey(sessionDate) {
  return `pp_notif_${sessionDate}`;
}

function isNotifScheduled(sessionDate) {
  try { return localStorage.getItem(getNotifKey(sessionDate)) === '1'; } catch { return false; }
}

function scheduleNotification(sessionName, sessionDate) {
  if (!('Notification' in window)) return false;
  const notifyTime = new Date(sessionDate).getTime() - 30 * 60 * 1000;
  const delay = notifyTime - Date.now();
  if (delay > 0) {
    setTimeout(() => {
      new Notification('PaddockPulse 🏎️', {
        body: `${sessionName} starts in 30 minutes!`,
        icon: '/favicon.ico',
      });
    }, delay);
    try { localStorage.setItem(getNotifKey(sessionDate), '1'); } catch {}
    return true;
  }
  return false;
}

async function requestNotifPermission() {
  if (!('Notification' in window)) {
    alert('This browser does not support notifications');
    return false;
  }
  const perm = await Notification.requestPermission();
  return perm === 'granted';
}

// --- Results Modal ---
function ResultsModal({ year, round, raceName, onClose }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const data = await fetchRaceResults(year, round, controller.signal);
        setResults(data?.MRData?.RaceTable?.Races?.[0]?.Results || []);
      } catch {}
      setLoading(false);
    }
    load();
    return () => controller.abort();
  }, [year, round]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="results-modal glass-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🏁 {raceName} — Race Results</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {loading ? (
          <div className="modal-loading">
            <div className="skeleton-line" />
            <div className="skeleton-line" style={{ width: '80%' }} />
            <div className="skeleton-line" style={{ width: '60%' }} />
          </div>
        ) : (
          <div className="results-table-wrapper">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Driver</th>
                  <th>Team</th>
                  <th>Grid</th>
                  <th>Status</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => {
                  const isDNF = r.status && r.status !== 'Finished' && !r.status.startsWith('+');
                  const hasFastestLap = r.FastestLap?.rank === '1';
                  return (
                    <tr key={r.position} className={isDNF ? 'dnf-row' : ''}>
                      <td className="pos-cell">{r.position}</td>
                      <td className="driver-cell">
                        {r.Driver?.givenName} <strong>{r.Driver?.familyName}</strong>
                        {hasFastestLap && <span className="fastest-lap-badge" title="Fastest Lap">⚡</span>}
                      </td>
                      <td className="team-cell">{r.Constructor?.name || ''}</td>
                      <td>{r.grid}</td>
                      <td className={isDNF ? 'status-dnf' : ''}>{r.status}</td>
                      <td className="points-cell">{r.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Session Rows with IST ---
function SessionTimings({ race }) {
  // Build estimated session times from race date
  const raceDate = new Date(race.date + 'T' + (race.time || '14:00:00Z'));
  
  // Check if sprint weekend (has Sprint in schedule)
  const hasSprint = race.Sprint;
  
  const sessions = [];
  
  if (hasSprint) {
    // Sprint weekend format
    const fp1 = new Date(raceDate); fp1.setDate(fp1.getDate() - 2); fp1.setHours(fp1.getHours() - 4);
    const sq = new Date(raceDate); sq.setDate(sq.getDate() - 1); sq.setHours(fp1.getHours());
    const sprint = new Date(raceDate); sprint.setDate(sprint.getDate() - 1); sprint.setHours(fp1.getHours() + 4);
    const quali = new Date(raceDate); quali.setDate(quali.getDate() - 1); quali.setHours(fp1.getHours() + 8);
    
    sessions.push({ name: 'Free Practice 1', icon: '🏎️', date: fp1 });
    sessions.push({ name: 'Sprint Qualifying', icon: '⏱️', date: sq });
    sessions.push({ name: 'Sprint', icon: '⚡', date: sprint });
    sessions.push({ name: 'Qualifying', icon: '⏱️', date: quali });
  } else {
    const fp1Date = race.FirstPractice ? new Date(race.FirstPractice.date + 'T' + (race.FirstPractice.time || '10:00:00Z')) : null;
    const fp2Date = race.SecondPractice ? new Date(race.SecondPractice.date + 'T' + (race.SecondPractice.time || '14:00:00Z')) : null;
    const fp3Date = race.ThirdPractice ? new Date(race.ThirdPractice.date + 'T' + (race.ThirdPractice.time || '10:00:00Z')) : null;
    const qualiDate = race.Qualifying ? new Date(race.Qualifying.date + 'T' + (race.Qualifying.time || '14:00:00Z')) : null;

    if (fp1Date) sessions.push({ name: 'Free Practice 1', icon: '🏎️', date: fp1Date });
    if (fp2Date) sessions.push({ name: 'Free Practice 2', icon: '🏎️', date: fp2Date });
    if (fp3Date) sessions.push({ name: 'Free Practice 3', icon: '🏎️', date: fp3Date });
    if (qualiDate) sessions.push({ name: 'Qualifying', icon: '⏱️', date: qualiDate });
  }

  sessions.push({ name: 'Race', icon: '🏁', date: raceDate });

  const [notifs, setNotifs] = useState({});

  const handleBell = async (session) => {
    const isoDate = session.date.toISOString();
    if (notifs[isoDate]) return; // Already scheduled

    const granted = await requestNotifPermission();
    if (!granted) return;

    const ok = scheduleNotification(`${race.raceName} — ${session.name}`, isoDate);
    if (ok) setNotifs(prev => ({ ...prev, [isoDate]: true }));
  };

  useEffect(() => {
    // Re-check which are already scheduled
    const existing = {};
    sessions.forEach(s => {
      if (isNotifScheduled(s.date.toISOString())) existing[s.date.toISOString()] = true;
    });
    setNotifs(existing);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="session-timings">
      {sessions.map((s, i) => {
        const localStr = new Intl.DateTimeFormat(undefined, {
          weekday: 'short', day: 'numeric', month: 'short',
          hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
        }).format(s.date);
        const isFuture = s.date > new Date();
        const iso = s.date.toISOString();
        const isScheduled = notifs[iso];

        return (
          <div key={i} className={`session-row ${!isFuture ? 'session-past' : ''}`}>
            <span className="session-icon">{s.icon}</span>
            <span className="session-name">{s.name}</span>
            <span className="session-time">{localStr}</span>
            {isFuture && (
              <button
                className={`bell-btn ${isScheduled ? 'active' : ''}`}
                onClick={() => handleBell(s)}
                title={isScheduled ? 'Notification scheduled' : 'Get notified 30min before'}
              >
                {isScheduled ? '🔔' : '🔕'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// --- Race Card ---
const RaceCard = React.memo(({ race, status, year, onShowResults }) => {
  const raceDateTime = race.date + 'T' + (race.time || '14:00:00Z');
  const { formattedString, isExpired } = useCountdown(raceDateTime);
  const [expanded, setExpanded] = useState(false);
  const isPast = status === 'past';
  const isActive = status === 'active';
  const isUpcoming = status === 'upcoming';

  const country = race.Circuit?.Location?.country || '';
  const flag = getCountryFlag(country);

  const localDate = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(undefined, {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
      }).format(new Date(raceDateTime));
    } catch { return race.date; }
  }, [raceDateTime, race.date]);

  return (
    <div className={`race-card glass-card ${isPast ? 'past-race' : ''} ${isActive ? 'active-race' : ''}`}>
      {isActive && <div className="active-race-ribbon">RACE WEEKEND</div>}
      {isPast && <div className="completed-badge">✓ Completed</div>}

      <div className="card-header">
        <span className="round-badge">R{race.round}</span>
        {isUpcoming && !isExpired && (
          <span className="countdown-pill">{formattedString}</span>
        )}
      </div>

      <div className="card-body" onClick={() => setExpanded(!expanded)}>
        <div className="race-details">
          <h3>{flag} {race.raceName}</h3>
          <p className="circuit-name">{race.Circuit?.circuitName || ''}</p>
          <p className="race-location">{race.Circuit?.Location?.locality}, {country}</p>
          <p className="race-time">{localDate}</p>
        </div>
      </div>

      {/* Expandable session timings */}
      {expanded && <SessionTimings race={race} />}

      <div className="card-footer">
        <button className="expand-btn" onClick={() => setExpanded(!expanded)}>
          {expanded ? '▲ Hide Sessions' : '▼ Show Sessions'}
        </button>
        {isPast && (
          <button className="action-button secondary" onClick={() => onShowResults(race)}>
            Results →
          </button>
        )}
        {!isPast && (
          <span className="upcoming-label">
            {isActive ? '🏎️ This Weekend' : '📅 Upcoming'}
          </span>
        )}
      </div>
    </div>
  );
});

// --- Main Component ---
export default function RaceSchedule() {
  const [year, setYear] = useState(CURRENT_SEASON);
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resultsModal, setResultsModal] = useState(null);
  const abortRef = useRef(null);

  const loadSchedule = useCallback(async (selectedYear) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchSeasonSchedule(selectedYear, controller.signal);
      const raceList = data?.MRData?.RaceTable?.Races || [];
      setRaces(raceList);
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedule(year);
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, [year, loadSchedule]);

  const racesWithStatus = useMemo(() => {
    const now = new Date();
    return races.map(race => {
      const raceDate = new Date(race.date + 'T' + (race.time || '14:00:00Z'));
      const weekendStart = new Date(raceDate);
      weekendStart.setDate(weekendStart.getDate() - 3);

      let status = 'upcoming';
      if (raceDate < now) status = 'past';
      else if (weekendStart <= now && raceDate >= now) status = 'active';
      return { race, status };
    });
  }, [races]);

  const isArchive = year < CURRENT_SEASON;

  return (
    <div className="schedule-page page-container">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">📅 Race Schedule {year}</h1>
          <p className="page-subtitle">
            {isArchive
              ? `Archive — ${races.length} races`
              : `${racesWithStatus.filter(r => r.status === 'past').length} completed, ${racesWithStatus.filter(r => r.status !== 'past').length} remaining`
            }
          </p>
        </div>
        <div className="year-selector">
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div className="error-banner glass-card">
          <p>Failed to load schedule.</p>
          <button className="action-button secondary" onClick={() => loadSchedule(year)}>Retry</button>
        </div>
      )}

      <div className="schedule-grid">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="race-card glass-card skeleton-race">
              <div className="skeleton-line short" />
              <div className="skeleton-line" style={{ marginTop: 12 }} />
              <div className="skeleton-line" style={{ marginTop: 8, width: '60%' }} />
            </div>
          ))
        ) : (
          racesWithStatus.map(({ race, status }) => (
            <RaceCard
              key={race.round}
              race={race}
              status={isArchive ? 'past' : status}
              year={year}
              onShowResults={(r) => setResultsModal({ year, round: r.round, raceName: r.raceName })}
            />
          ))
        )}
        {!loading && races.length === 0 && (
          <p className="empty-state">No schedule data available for {year}.</p>
        )}
      </div>

      {/* Results Modal */}
      {resultsModal && (
        <ResultsModal
          year={resultsModal.year}
          round={resultsModal.round}
          raceName={resultsModal.raceName}
          onClose={() => setResultsModal(null)}
        />
      )}
    </div>
  );
}
