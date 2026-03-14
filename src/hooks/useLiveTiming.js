import { useState, useEffect, useRef, useCallback } from 'react';

const OPENF1_BASE = 'https://api.openf1.org/v1';

/**
 * useLiveTiming — manages all live session data polling
 * 
 * Three polling tiers:
 * - Fast (2s):  intervals, race_control, car_data (delta with date> filter)
 * - Medium (8s): laps, stints, weather (full refetch — smaller payloads)
 * - Slow (once): drivers (static per session)
 */
export default function useLiveTiming(sessionKey) {
  const [drivers, setDrivers] = useState([]);
  const [positions, setPositions] = useState([]);
  const [intervals, setIntervals] = useState([]);
  const [laps, setLaps] = useState([]);
  const [stints, setStints] = useState([]);
  const [raceControl, setRaceControl] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fastPollRef = useRef(null);
  const slowPollRef = useRef(null);
  const lastFastPollRef = useRef(null);

  // Helper: fetch with error handling
  const f1Fetch = useCallback(async (endpoint) => {
    try {
      const res = await fetch(`${OPENF1_BASE}${endpoint}`);
      if (!res.ok) return [];
      const data = await res.json();
      if (data?.detail) return []; // OpenF1 error response
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }, []);

  // Fetch static data ONCE per session
  const loadStaticData = useCallback(async (key) => {
    if (!key) return;
    setLoading(true);
    setError(null);

    try {
      const [driversData, posData, intervalData, lapsData, stintsData, rcData, weatherData] = await Promise.all([
        f1Fetch(`/drivers?session_key=${key}`),
        f1Fetch(`/position?session_key=${key}`),
        f1Fetch(`/intervals?session_key=${key}`),
        f1Fetch(`/laps?session_key=${key}`),
        f1Fetch(`/stints?session_key=${key}`),
        f1Fetch(`/race_control?session_key=${key}`),
        f1Fetch(`/weather?session_key=${key}`),
      ]);

      setDrivers(driversData);
      setPositions(posData);
      setIntervals(intervalData);
      setLaps(lapsData);
      setStints(stintsData);
      setRaceControl(rcData);
      if (weatherData.length > 0) setWeather(weatherData[weatherData.length - 1]);

      lastFastPollRef.current = new Date().toISOString();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [f1Fetch]);

  // Fast poll: delta-fetch intervals + race_control + positions (every 2s)
  const fastPoll = useCallback(async (key) => {
    if (!key) return;
    const since = lastFastPollRef.current;
    const dateFilter = since ? `&date>${since}` : '';

    try {
      const [intData, rcData, posData] = await Promise.all([
        f1Fetch(`/intervals?session_key=${key}${dateFilter}`),
        f1Fetch(`/race_control?session_key=${key}${dateFilter}`),
        f1Fetch(`/position?session_key=${key}${dateFilter}`),
      ]);

      if (intData.length > 0) {
        setIntervals(prev => mergeByDriver(prev, intData, 'driver_number'));
      }

      if (rcData.length > 0) {
        setRaceControl(prev => [...prev, ...rcData]);
      }

      if (posData.length > 0) {
        setPositions(prev => mergeByDriver(prev, posData, 'driver_number'));
      }

      lastFastPollRef.current = new Date().toISOString();
    } catch (err) {
      console.error('Fast poll error:', err);
    }
  }, [f1Fetch]);

  // Slow poll: refetch laps, stints, weather (every 8s)
  const slowPoll = useCallback(async (key) => {
    if (!key) return;

    try {
      const [lapsData, stintsData, weatherData] = await Promise.all([
        f1Fetch(`/laps?session_key=${key}`),
        f1Fetch(`/stints?session_key=${key}`),
        f1Fetch(`/weather?session_key=${key}`),
      ]);

      if (lapsData.length > 0) setLaps(lapsData);
      if (stintsData.length > 0) setStints(stintsData);
      if (weatherData.length > 0) setWeather(weatherData[weatherData.length - 1]);
    } catch (err) {
      console.error('Slow poll error:', err);
    }
  }, [f1Fetch]);

  // Setup polling lifecycle
  useEffect(() => {
    if (!sessionKey) {
      setLoading(false);
      return;
    }

    loadStaticData(sessionKey);

    // Fast poll every 2 seconds
    fastPollRef.current = setInterval(() => fastPoll(sessionKey), 2000);

    // Slow poll every 8 seconds
    slowPollRef.current = setInterval(() => slowPoll(sessionKey), 8000);

    return () => {
      clearInterval(fastPollRef.current);
      clearInterval(slowPollRef.current);
    };
  }, [sessionKey, loadStaticData, fastPoll, slowPoll]);

  // Build leaderboard from all data sources
  const leaderboard = buildLeaderboard(drivers, positions, intervals, laps, stints);

  return {
    drivers,
    leaderboard,
    positions,
    intervals,
    laps,
    stints,
    raceControl,
    weather,
    loading,
    error,
  };
}

// --- Helpers ---

/** Merge new data, keeping latest per driver */
function mergeByDriver(prevArr, newArr, driverField) {
  const map = new Map();
  // Add existing
  prevArr.forEach(item => {
    const key = item[driverField];
    const existing = map.get(key);
    if (!existing || new Date(item.date) > new Date(existing.date)) {
      map.set(key, item);
    }
  });
  // Overwrite with newer
  newArr.forEach(item => {
    const key = item[driverField];
    const existing = map.get(key);
    if (!existing || new Date(item.date) > new Date(existing.date)) {
      map.set(key, item);
    }
  });
  return Array.from(map.values());
}

/** Build sorted leaderboard from raw OpenF1 data */
function buildLeaderboard(drivers, positions, intervals, laps, stints) {
  if (!drivers.length) return [];

  // Latest position per driver
  const latestPos = {};
  positions.forEach(p => {
    const e = latestPos[p.driver_number];
    if (!e || new Date(p.date) > new Date(e.date)) latestPos[p.driver_number] = p;
  });

  // Latest interval per driver
  const latestInt = {};
  intervals.forEach(i => {
    const e = latestInt[i.driver_number];
    if (!e || new Date(i.date) > new Date(e.date)) latestInt[i.driver_number] = i;
  });

  // Latest & best lap per driver
  const latestLap = {};
  const bestLap = {};
  laps.forEach(l => {
    const e = latestLap[l.driver_number];
    if (!e || l.lap_number > e.lap_number) latestLap[l.driver_number] = l;
    if (l.lap_duration && (!bestLap[l.driver_number] || l.lap_duration < bestLap[l.driver_number].lap_duration)) {
      bestLap[l.driver_number] = l;
    }
  });

  // Latest stint per driver
  const latestStint = {};
  stints.forEach(s => {
    const e = latestStint[s.driver_number];
    if (!e || s.stint_number > e.stint_number) latestStint[s.driver_number] = s;
  });

  // Deduplicate drivers
  const uniqueDrivers = [];
  const seen = new Set();
  drivers.forEach(d => {
    if (!seen.has(d.driver_number)) {
      seen.add(d.driver_number);
      uniqueDrivers.push(d);
    }
  });

  return uniqueDrivers
    .map(driver => {
      const pos = latestPos[driver.driver_number];
      const intv = latestInt[driver.driver_number];
      const lap = latestLap[driver.driver_number];
      const best = bestLap[driver.driver_number];
      const stint = latestStint[driver.driver_number];

      return {
        driverNumber: driver.driver_number,
        code: driver.name_acronym || `${driver.driver_number}`,
        fullName: driver.full_name || '',
        teamName: driver.team_name || '',
        teamColor: driver.team_colour ? `#${driver.team_colour}` : '#666',
        position: pos?.position || 99,
        gap: intv?.gap_to_leader != null ? (intv.gap_to_leader === 0 ? '' : `+${intv.gap_to_leader}s`) : '',
        interval: intv?.interval != null ? `+${intv.interval}s` : '',
        lastLap: lap?.lap_duration ? fmtDuration(lap.lap_duration) : '—',
        bestLap: best?.lap_duration ? fmtDuration(best.lap_duration) : '—',
        lapNumber: lap?.lap_number || 0,
        compound: stint?.compound || '',
        tyreAge: stint?.tyre_age_at_pit || stint?.lap_end ? (stint.lap_end - stint.lap_start + 1) : 0,
      };
    })
    .sort((a, b) => a.position - b.position);
}

function fmtDuration(seconds) {
  if (!seconds || seconds <= 0) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : secs;
}
