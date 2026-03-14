import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import useCountdown from '../../hooks/useCountdown';
import { fetchSeasonSchedule, fetchRaceResults } from '../../services/api';
import { getCountryFlag, CURRENT_SEASON } from '../../api/constants';
import './RaceSchedule.css';

const YEARS = Array.from({ length: CURRENT_SEASON - 1999 }, (_, i) => CURRENT_SEASON - i);

function SkeletonCards() {
  return Array.from({ length: 6 }).map((_, i) => (
    <div key={i} className="race-card glass-card skeleton-race">
      <div className="skeleton-line short" />
      <div className="skeleton-line" style={{ marginTop: 12 }} />
      <div className="skeleton-line" style={{ marginTop: 8, width: '60%' }} />
    </div>
  ));
}

const RaceCard = React.memo(({ race, status }) => {
  const raceDateTime = race.date + 'T' + (race.time || '14:00:00Z');
  const { formattedString, isExpired } = useCountdown(raceDateTime);
  const isPast = status === 'past';
  const isActive = status === 'active';
  const isUpcoming = status === 'upcoming';

  const country = race.Circuit?.Location?.country || '';
  const flag = getCountryFlag(country);

  const localDate = useMemo(() => {
    try {
      const d = new Date(raceDateTime);
      return new Intl.DateTimeFormat(undefined, {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
      }).format(d);
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

      <div className="card-body">
        <div className="race-details">
          <h3>{flag} {race.raceName}</h3>
          <p className="circuit-name">{race.Circuit?.circuitName || ''}</p>
          <p className="race-location">{race.Circuit?.Location?.locality}, {country}</p>
          <p className="race-time">{localDate}</p>
        </div>
      </div>

      <div className="card-footer">
        {isPast ? (
          <Link to={`/schedule/${race.season || CURRENT_SEASON}/${race.round}`} className="action-button secondary">
            Results →
          </Link>
        ) : (
          <span className="upcoming-label">
            {isActive ? '🏎️ This Weekend' : '📅 Upcoming'}
          </span>
        )}
      </div>
    </div>
  );
});

export default function RaceSchedule() {
  const [year, setYear] = useState(CURRENT_SEASON);
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedule(year);
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, [year, loadSchedule]);

  // Determine status of each race
  const racesWithStatus = useMemo(() => {
    const now = new Date();
    return races.map(race => {
      const raceDate = new Date(race.date + 'T' + (race.time || '14:00:00Z'));
      const weekendStart = new Date(raceDate);
      weekendStart.setDate(weekendStart.getDate() - 3);

      let status = 'upcoming';
      if (raceDate < now) {
        status = 'past';
      } else if (weekendStart <= now && raceDate >= now) {
        status = 'active';
      }
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
        {loading ? <SkeletonCards /> : (
          racesWithStatus.map(({ race, status }) => (
            <RaceCard key={race.round} race={race} status={isArchive ? 'past' : status} />
          ))
        )}
        {!loading && races.length === 0 && (
          <p className="empty-state">No schedule data available for {year}.</p>
        )}
      </div>
    </div>
  );
}
