/**
 * Centralized API Service Layer
 * All components import from here — never fetch directly.
 * Provides caching via localStorage and request deduplication.
 */
import * as jolpica from '../api/jolpica.js';
import * as openf1 from '../api/openf1.js';

// --- localStorage cache helpers ---
const CACHE_PREFIX = 'pp_cache_';

function getCached(key, ttlMs) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > ttlMs) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setCache(key, data) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // localStorage full — silently ignore
  }
}

// --- Request deduplication ---
const inflightRequests = new Map();

function dedup(key, fetcher) {
  if (inflightRequests.has(key)) return inflightRequests.get(key);
  const promise = fetcher().finally(() => inflightRequests.delete(key));
  inflightRequests.set(key, promise);
  return promise;
}

// --- Schedule ---
const SCHEDULE_TTL = 60 * 60 * 1000; // 1 hour

export async function fetchCurrentSchedule(signal) {
  const cacheKey = 'schedule_current';
  const cached = getCached(cacheKey, SCHEDULE_TTL);
  if (cached) return cached;

  return dedup(cacheKey, async () => {
    const data = await jolpica.fetchCurrentSchedule(signal);
    if (data) setCache(cacheKey, data);
    return data;
  });
}

export async function fetchSeasonSchedule(year, signal) {
  const cacheKey = `schedule_${year}`;
  const cached = getCached(cacheKey, SCHEDULE_TTL);
  if (cached) return cached;

  return dedup(cacheKey, async () => {
    const data = await jolpica.fetchSeasonSchedule(year, signal);
    if (data) setCache(cacheKey, data);
    return data;
  });
}

// --- Results (no aggressive caching) ---
export async function fetchRaceResults(year, round, signal) {
  return dedup(`results_${year}_${round}`, () => jolpica.fetchRaceResults(year, round, signal));
}

export async function fetchSeasonResults(year, signal) {
  return dedup(`season_results_${year}`, () => jolpica.fetchSeasonResults(year, signal));
}

export async function fetchLastRaceResults(signal) {
  return dedup('last_race', () => jolpica.fetchLastRaceResults(signal));
}

export async function fetchLapData(year, round, signal) {
  return dedup(`laps_${year}_${round}`, () => jolpica.fetchLapData(year, round, signal));
}

// --- Standings (fresh each visit) ---
export async function fetchDriverStandings(year, signal) {
  return dedup(`driverStandings_${year}`, () => jolpica.fetchDriverStandings(year, signal));
}

export async function fetchConstructorStandings(year, signal) {
  return dedup(`constructorStandings_${year}`, () => jolpica.fetchConstructorStandings(year, signal));
}

// --- Driver detail ---
export async function fetchDriverSeasonResults(year, driverId, signal) {
  return dedup(`driverResults_${year}_${driverId}`, () => jolpica.fetchDriverSeasonResults(year, driverId, signal));
}

// --- OpenF1 Live ---
export const fetchLatestSession = openf1.fetchLatestSession;
export const fetchSessionsByYear = openf1.fetchSessionsByYear;
export const fetchDriversLive = openf1.fetchDrivers;
export const fetchPositionsLive = openf1.fetchPositions;
export const fetchIntervalsLive = openf1.fetchIntervals;
export const fetchIntervalsDelta = openf1.fetchIntervalsDelta;
export const fetchLocationLive = openf1.fetchLocation;
export const fetchLocationDelta = openf1.fetchLocationDelta;
export const fetchStintsLive = openf1.fetchStints;
export const fetchPitStopsLive = openf1.fetchPitStops;
export const fetchCarDataLive = openf1.fetchCarData;
export const fetchCarDataDelta = openf1.fetchCarDataDelta;
export const fetchRaceControlLive = openf1.fetchRaceControl;
export const fetchWeatherLive = openf1.fetchWeather;
export const fetchTeamRadioLive = openf1.fetchTeamRadio;
export const fetchLapsLive = openf1.fetchLaps;
export const fetchMeetings = openf1.fetchMeetings;
