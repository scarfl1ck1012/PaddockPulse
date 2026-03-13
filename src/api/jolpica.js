const BASE_URL = 'https://api.jolpi.ca/ergast/f1';

const fetchJolpica = async (endpoint) => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) throw new Error(`Jolpica Error: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const fetchSeasonRaces = (year) => fetchJolpica(`/${year}/races.json`);
export const fetchRaceResults = (year, round) => fetchJolpica(`/${year}/${round}/results.json`);
export const fetchDriverStandings = (year) => fetchJolpica(`/${year}/driverStandings.json`);
export const fetchConstructorStandings = (year) => fetchJolpica(`/${year}/constructorStandings.json`);
export const fetchQualifying = (year, round) => fetchJolpica(`/${year}/${round}/qualifying.json`);
export const fetchPitStops = (year, round) => fetchJolpica(`/${year}/${round}/pitstops.json`);
export const fetchDriverSeasonResults = (year, driverId) => fetchJolpica(`/${year}/drivers/${driverId}/results.json`);
export const fetchSeasonResults = (year) => fetchJolpica(`/${year}/results.json`);
