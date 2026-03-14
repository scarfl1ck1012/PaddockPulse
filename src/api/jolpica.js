const BASE_URL = 'https://api.jolpi.ca/ergast/f1';

const fetchJolpica = async (endpoint, signal) => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, { signal });
    if (!response.ok) throw new Error(`Jolpica Error: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    if (error.name === 'AbortError') return null;
    console.error(error);
    return null;
  }
};

// Schedule
export const fetchCurrentSchedule = (signal) => fetchJolpica('/current.json', signal);
export const fetchSeasonSchedule = (year, signal) => fetchJolpica(`/${year}.json`, signal);
export const fetchSeasonRaces = (year, signal) => fetchJolpica(`/${year}/races.json`, signal);

// Results
export const fetchRaceResults = (year, round, signal) => fetchJolpica(`/${year}/${round}/results.json`, signal);
export const fetchSeasonResults = (year, signal) => fetchJolpica(`/${year}/results.json?limit=100`, signal);
export const fetchLastRaceResults = (signal) => fetchJolpica('/current/last/results.json', signal);

// Lap data
export const fetchLapData = (year, round, signal) => fetchJolpica(`/${year}/${round}/laps.json?limit=2000`, signal);

// Standings
export const fetchDriverStandings = (year, signal) => fetchJolpica(`/${year}/driverStandings.json`, signal);
export const fetchConstructorStandings = (year, signal) => fetchJolpica(`/${year}/constructorStandings.json`, signal);

// Driver detail
export const fetchDriverSeasonResults = (year, driverId, signal) => fetchJolpica(`/${year}/drivers/${driverId}/results.json`, signal);

// Qualifying & Pit stops
export const fetchQualifying = (year, round, signal) => fetchJolpica(`/${year}/${round}/qualifying.json`, signal);
export const fetchPitStops = (year, round, signal) => fetchJolpica(`/${year}/${round}/pitstops.json`, signal);

// Circuits
export const fetchCircuits = (year, signal) => fetchJolpica(`/${year}/circuits.json`, signal);
