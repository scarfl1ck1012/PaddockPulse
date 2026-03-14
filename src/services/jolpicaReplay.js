/**
 * jolpicaReplay.js
 * Fallback for pre-2018 races that don't have OpenF1 telemetry.
 */

// Get basic race results to get drivers
export async function getJolpicaResults(year, round) {
  return fetch(`https://api.jolpi.ca/ergast/f1/${year}/${round}/results.json?limit=100`)
    .then(r => r.json())
    .then(data => data?.MRData?.RaceTable?.Races[0]?.Results || []);
}

// Get lap by lap positions for the whole race
export async function getJolpicaLaps(year, round) {
  return fetch(`https://api.jolpi.ca/ergast/f1/${year}/${round}/laps.json?limit=2000`)
    .then(r => r.json())
    .then(data => data?.MRData?.RaceTable?.Races[0]?.Laps || []);
}
