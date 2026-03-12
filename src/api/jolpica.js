/**
 * Jolpica API Client (Ergast-compatible)
 * https://api.jolpi.ca/ergast/f1/
 * Covers historical data from 1950 to present
 */

const BASE_URL = 'https://api.jolpi.ca/ergast/f1';

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Jolpica API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch driver championship standings for a season
 */
export async function fetchDriverStandings(season = 'current') {
  const data = await fetchJSON(`${BASE_URL}/${season}/driverStandings.json?limit=100`);
  const lists = data?.MRData?.StandingsTable?.StandingsLists;
  if (!lists || lists.length === 0) return [];
  return lists[0].DriverStandings || [];
}

/**
 * Fetch constructor championship standings for a season
 */
export async function fetchConstructorStandings(season = 'current') {
  const data = await fetchJSON(`${BASE_URL}/${season}/constructorStandings.json?limit=100`);
  const lists = data?.MRData?.StandingsTable?.StandingsLists;
  if (!lists || lists.length === 0) return [];
  return lists[0].ConstructorStandings || [];
}

/**
 * Fetch race schedule for a season
 */
export async function fetchRaceSchedule(season = 'current') {
  const data = await fetchJSON(`${BASE_URL}/${season}.json?limit=100`);
  return data?.MRData?.RaceTable?.Races || [];
}

/**
 * Fetch race results for a specific round
 */
export async function fetchRaceResults(season, round) {
  const data = await fetchJSON(`${BASE_URL}/${season}/${round}/results.json?limit=100`);
  const races = data?.MRData?.RaceTable?.Races;
  if (!races || races.length === 0) return null;
  return races[0];
}

/**
 * Fetch qualifying results for a specific round
 */
export async function fetchQualifyingResults(season, round) {
  const data = await fetchJSON(`${BASE_URL}/${season}/${round}/qualifying.json?limit=100`);
  const races = data?.MRData?.RaceTable?.Races;
  if (!races || races.length === 0) return null;
  return races[0];
}

/**
 * Fetch list of seasons
 */
export async function fetchSeasons() {
  const data = await fetchJSON(`${BASE_URL}/seasons.json?limit=200`);
  return data?.MRData?.SeasonTable?.Seasons || [];
}

/**
 * Fetch information about a specific circuit
 */
export async function fetchCircuit(circuitId) {
  const data = await fetchJSON(`${BASE_URL}/circuits/${circuitId}.json`);
  const circuits = data?.MRData?.CircuitTable?.Circuits;
  if (!circuits || circuits.length === 0) return null;
  return circuits[0];
}

/**
 * Fetch last race results
 */
export async function fetchLastRaceResults() {
  const data = await fetchJSON(`${BASE_URL}/current/last/results.json?limit=100`);
  const races = data?.MRData?.RaceTable?.Races;
  if (!races || races.length === 0) return null;
  return races[0];
}
