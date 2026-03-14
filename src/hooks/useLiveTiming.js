import { useState, useEffect, useRef, useCallback } from 'react';
import * as api from '../services/api';

/**
 * useLiveTiming — manages all polling for live session data
 * Uses delta-fetching with date> filter to avoid re-fetching old data.
 * All intervals are cleaned up on unmount.
 */
export default function useLiveTiming(sessionKey) {
  const [drivers, setDrivers] = useState([]);
  const [positions, setPositions] = useState([]);
  const [intervals, setIntervals] = useState([]);
  const [laps, setLaps] = useState([]);
  const [stints, setStints] = useState([]);
  const [pitStops, setPitStops] = useState([]);
  const [raceControl, setRaceControl] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const pollRef = useRef(null);
  const lastPollRef = useRef(null);

  // Initial data load
  const loadInitialData = useCallback(async (key) => {
    if (!key) return;
    setLoading(true);
    setError(null);

    try {
      const [driversData, posData, intervalData, lapsData, stintsData, pitData, rcData, weatherData] = await Promise.all([
        api.fetchDriversLive(key),
        api.fetchPositionsLive(key),
        api.fetchIntervalsLive(key),
        api.fetchLapsLive(key),
        api.fetchStintsLive(key),
        api.fetchPitStopsLive(key),
        api.fetchRaceControlLive(key),
        api.fetchWeatherLive(key),
      ]);

      setDrivers(Array.isArray(driversData) ? driversData : []);
      setPositions(Array.isArray(posData) ? posData : []);
      setIntervals(Array.isArray(intervalData) ? intervalData : []);
      setLaps(Array.isArray(lapsData) ? lapsData : []);
      setStints(Array.isArray(stintsData) ? stintsData : []);
      setPitStops(Array.isArray(pitData) ? pitData : []);
      setRaceControl(Array.isArray(rcData) ? rcData : []);
      
      if (Array.isArray(weatherData) && weatherData.length > 0) {
        setWeather(weatherData[weatherData.length - 1]);
      }

      lastPollRef.current = new Date().toISOString();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll for updates (delta fetch)
  const pollUpdates = useCallback(async (key) => {
    if (!key || !lastPollRef.current) return;

    try {
      const since = lastPollRef.current;

      const [posData, intervalData, rcData, weatherData, stintsData, lapsData] = await Promise.all([
        api.fetchPositionsLive(key),
        api.fetchIntervalsLive(key),
        api.fetchRaceControlLive(key),
        api.fetchWeatherLive(key),
        api.fetchStintsLive(key),
        api.fetchLapsLive(key),
      ]);

      // Merge positions — keep latest per driver
      if (Array.isArray(posData) && posData.length > 0) {
        setPositions(posData);
      }

      if (Array.isArray(intervalData) && intervalData.length > 0) {
        setIntervals(intervalData);
      }

      if (Array.isArray(lapsData) && lapsData.length > 0) {
        setLaps(lapsData);
      }

      if (Array.isArray(stintsData) && stintsData.length > 0) {
        setStints(stintsData);
      }

      if (Array.isArray(rcData) && rcData.length > 0) {
        setRaceControl(rcData);
      }

      if (Array.isArray(weatherData) && weatherData.length > 0) {
        setWeather(weatherData[weatherData.length - 1]);
      }

      lastPollRef.current = new Date().toISOString();
    } catch (err) {
      console.error('Poll error:', err);
    }
  }, []);

  // Setup polling
  useEffect(() => {
    if (!sessionKey) {
      setLoading(false);
      return;
    }

    loadInitialData(sessionKey);

    // Poll every 5 seconds
    pollRef.current = setInterval(() => {
      pollUpdates(sessionKey);
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [sessionKey, loadInitialData, pollUpdates]);

  // Build leaderboard from positions and drivers
  const leaderboard = buildLeaderboard(drivers, positions, intervals, laps, stints);

  return {
    drivers,
    leaderboard,
    positions,
    intervals,
    laps,
    stints,
    pitStops,
    raceControl,
    weather,
    loading,
    error,
  };
}

// Build sorted leaderboard from various data sources
function buildLeaderboard(drivers, positions, intervals, laps, stints) {
  if (!drivers.length) return [];

  // Get latest position per driver
  const latestPositions = {};
  positions.forEach(p => {
    const existing = latestPositions[p.driver_number];
    if (!existing || new Date(p.date) > new Date(existing.date)) {
      latestPositions[p.driver_number] = p;
    }
  });

  // Get latest interval per driver
  const latestIntervals = {};
  intervals.forEach(i => {
    const existing = latestIntervals[i.driver_number];
    if (!existing || new Date(i.date) > new Date(existing.date)) {
      latestIntervals[i.driver_number] = i;
    }
  });

  // Get latest lap per driver
  const latestLaps = {};
  laps.forEach(l => {
    const existing = latestLaps[l.driver_number];
    if (!existing || l.lap_number > existing.lap_number) {
      latestLaps[l.driver_number] = l;
    }
  });

  // Get best lap per driver
  const bestLaps = {};
  laps.forEach(l => {
    if (!l.lap_duration) return;
    const existing = bestLaps[l.driver_number];
    if (!existing || l.lap_duration < existing.lap_duration) {
      bestLaps[l.driver_number] = l;
    }
  });

  // Get latest stint per driver
  const latestStints = {};
  stints.forEach(s => {
    const existing = latestStints[s.driver_number];
    if (!existing || s.stint_number > existing.stint_number) {
      latestStints[s.driver_number] = s;
    }
  });

  // Build leaderboard entries
  const entries = drivers
    .filter((d, i, arr) => arr.findIndex(x => x.driver_number === d.driver_number) === i)
    .map(driver => {
      const pos = latestPositions[driver.driver_number];
      const interval = latestIntervals[driver.driver_number];
      const lap = latestLaps[driver.driver_number];
      const best = bestLaps[driver.driver_number];
      const stint = latestStints[driver.driver_number];

      return {
        driverNumber: driver.driver_number,
        code: driver.name_acronym || `${driver.driver_number}`,
        fullName: driver.full_name || '',
        teamName: driver.team_name || '',
        teamColor: driver.team_colour ? `#${driver.team_colour}` : '#666',
        position: pos?.position || 99,
        gap: interval?.gap_to_leader != null ? `+${interval.gap_to_leader}s` : '',
        interval: interval?.interval != null ? `+${interval.interval}s` : '',
        lastLap: lap?.lap_duration ? formatDuration(lap.lap_duration) : '—',
        bestLap: best?.lap_duration ? formatDuration(best.lap_duration) : '—',
        lapNumber: lap?.lap_number || 0,
        compound: stint?.compound || '',
        tyreAge: stint?.tyre_age_at_pit || 0,
        isPitIn: stint?.pit_in || false,
      };
    })
    .sort((a, b) => a.position - b.position);

  return entries;
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : secs;
}
