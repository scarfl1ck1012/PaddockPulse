/**
 * Compare Service — API calls specific to Compare page
 * Handles pit stops, stints, and session key resolution for OpenF1 data
 */
import * as jolpica from '../api/jolpica.js';
import * as openf1 from '../api/openf1.js';

const OPENF1_BASE = 'https://api.openf1.org/v1';

/**
 * Fetch pit stop data from Jolpica
 */
export async function fetchPitStops(year, round, signal) {
  const data = await jolpica.fetchPitStops(year, round, signal);
  return data?.MRData?.RaceTable?.Races?.[0]?.PitStops || [];
}

/**
 * Fetch season results with explicit limit=100
 */
export async function fetchAllSeasonResults(year, signal) {
  const data = await jolpica.fetchSeasonResults(year, signal);
  return data?.MRData?.RaceTable?.Races || [];
}

/**
 * Fetch race results for a specific round
 */
export async function fetchRoundResults(year, round, signal) {
  const data = await jolpica.fetchRaceResults(year, round, signal);
  return data?.MRData?.RaceTable?.Races?.[0]?.Results || [];
}

/**
 * Fetch lap-by-lap data
 */
export async function fetchLaps(year, round, signal) {
  const data = await jolpica.fetchLapData(year, round, signal);
  return data?.MRData?.RaceTable?.Races?.[0]?.Laps || [];
}

/**
 * Find OpenF1 session key for a given race (if available, 2023+)
 */
export async function findSessionKey(year, raceName, signal) {
  if (year < 2023) return null;
  
  try {
    const meetings = await openf1.fetchMeetings(year, signal);
    if (!Array.isArray(meetings)) return null;

    // Match by name (fuzzy)
    const raceNameLower = (raceName || '').toLowerCase();
    const meeting = meetings.find(m =>
      (m.meeting_name || '').toLowerCase().includes(raceNameLower) ||
      raceNameLower.includes((m.meeting_name || '').toLowerCase())
    );

    if (!meeting) return null;

    // Get race session for this meeting
    const sessions = await openf1.fetchSessionsByYear(year, signal);
    if (!Array.isArray(sessions)) return null;

    const raceSession = sessions.find(s =>
      s.meeting_key === meeting.meeting_key && s.session_type === 'Race'
    );

    return raceSession?.session_key || null;
  } catch {
    return null;
  }
}

/**
 * Fetch OpenF1 stints for a session key (2023+)
 */
export async function fetchOpenF1Stints(sessionKey, signal) {
  if (!sessionKey) return [];
  try {
    const data = await openf1.fetchStints(sessionKey, signal);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Fetch race control messages from OpenF1 (for safety car laps)
 */
export async function fetchSafetyCarLaps(sessionKey, signal) {
  if (!sessionKey) return [];
  try {
    const res = await fetch(`${OPENF1_BASE}/race_control?session_key=${sessionKey}&category=SafetyCar`, { signal });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Build tyre stints from pit stop data + OpenF1 stints
 * Returns: { driverId: [{ startLap, endLap, compound, laps }] }
 */
export function buildStints(pitStops, totalLaps, openf1Stints, driverMap) {
  const stintsByDriver = {};

  // If we have OpenF1 stints, use them (they have compound info)
  if (openf1Stints.length > 0) {
    openf1Stints.forEach(s => {
      const driverNum = s.driver_number;
      // Find driverId from driverMap
      const driverId = driverMap?.[driverNum] || `driver_${driverNum}`;
      if (!stintsByDriver[driverId]) stintsByDriver[driverId] = [];
      stintsByDriver[driverId].push({
        startLap: s.lap_start || 1,
        endLap: s.lap_end || totalLaps,
        compound: s.compound || 'UNKNOWN',
        laps: (s.lap_end || totalLaps) - (s.lap_start || 1) + 1,
      });
    });
    return stintsByDriver;
  }

  // Fallback: reconstruct stints from pit stop lap numbers
  const pitsByDriver = {};
  pitStops.forEach(p => {
    if (!pitsByDriver[p.driverId]) pitsByDriver[p.driverId] = [];
    pitsByDriver[p.driverId].push(parseInt(p.lap));
  });

  Object.entries(pitsByDriver).forEach(([driverId, pitLaps]) => {
    pitLaps.sort((a, b) => a - b);
    const stints = [];
    let prevLap = 1;

    pitLaps.forEach(pitLap => {
      stints.push({
        startLap: prevLap,
        endLap: pitLap,
        compound: 'UNKNOWN',
        laps: pitLap - prevLap + 1,
      });
      prevLap = pitLap + 1;
    });

    // Final stint
    if (prevLap <= totalLaps) {
      stints.push({
        startLap: prevLap,
        endLap: totalLaps,
        compound: 'UNKNOWN',
        laps: totalLaps - prevLap + 1,
      });
    }

    stintsByDriver[driverId] = stints;
  });

  return stintsByDriver;
}

/**
 * Parse lap time string "1:32.456" to seconds
 */
export function parseLapTime(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(timeStr) || null;
}

/**
 * Format seconds to "m:ss.SSS"
 */
export function formatLapTimeFromSeconds(seconds) {
  if (!seconds || seconds <= 0) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : secs;
}
