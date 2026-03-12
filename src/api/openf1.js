/**
 * OpenF1 API Client
 * https://openf1.org
 * Rate limit: ~3 req/s
 */

const BASE_URL = 'https://api.openf1.org/v1';

// Simple rate limiter: queue requests to stay under 3/sec
let lastRequest = 0;
async function rateLimitedFetch(url) {
  const now = Date.now();
  const elapsed = now - lastRequest;
  if (elapsed < 350) {
    await new Promise(r => setTimeout(r, 350 - elapsed));
  }
  lastRequest = Date.now();

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`OpenF1 API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch drivers for a session
 */
export async function fetchDrivers(sessionKey = 'latest') {
  return rateLimitedFetch(`${BASE_URL}/drivers?session_key=${sessionKey}`);
}

/**
 * Fetch weather data for a session
 */
export async function fetchWeather(sessionKey = 'latest') {
  return rateLimitedFetch(`${BASE_URL}/weather?session_key=${sessionKey}`);
}

/**
 * Fetch race control messages
 */
export async function fetchRaceControl(sessionKey = 'latest') {
  return rateLimitedFetch(`${BASE_URL}/race_control?session_key=${sessionKey}`);
}

/**
 * Fetch car positions
 */
export async function fetchPositions(sessionKey = 'latest', driverNumber) {
  let url = `${BASE_URL}/position?session_key=${sessionKey}`;
  if (driverNumber) url += `&driver_number=${driverNumber}`;
  return rateLimitedFetch(url);
}

/**
 * Fetch meetings (race weekends)
 */
export async function fetchMeetings(year) {
  let url = `${BASE_URL}/meetings`;
  if (year) url += `?year=${year}`;
  return rateLimitedFetch(url);
}

/**
 * Fetch sessions for a meeting
 */
export async function fetchSessions(meetingKey) {
  let url = `${BASE_URL}/sessions`;
  if (meetingKey) url += `?meeting_key=${meetingKey}`;
  return rateLimitedFetch(url);
}

/**
 * Fetch car telemetry data
 */
export async function fetchCarData(sessionKey, driverNumber, speed_gte) {
  let url = `${BASE_URL}/car_data?session_key=${sessionKey}&driver_number=${driverNumber}`;
  if (speed_gte) url += `&speed>=${speed_gte}`;
  return rateLimitedFetch(url);
}

/**
 * Fetch stint / tyre data
 */
export async function fetchStints(sessionKey, driverNumber) {
  let url = `${BASE_URL}/stints?session_key=${sessionKey}`;
  if (driverNumber) url += `&driver_number=${driverNumber}`;
  return rateLimitedFetch(url);
}

/**
 * Fetch team radio messages
 */
export async function fetchTeamRadio(sessionKey, driverNumber) {
  let url = `${BASE_URL}/team_radio?session_key=${sessionKey}`;
  if (driverNumber) url += `&driver_number=${driverNumber}`;
  return rateLimitedFetch(url);
}

/**
 * Fetch interval data
 */
export async function fetchIntervals(sessionKey, driverNumber) {
  let url = `${BASE_URL}/intervals?session_key=${sessionKey}`;
  if (driverNumber) url += `&driver_number=${driverNumber}`;
  return rateLimitedFetch(url);
}

/**
 * Fetch lap data
 */
export async function fetchLaps(sessionKey, driverNumber) {
  let url = `${BASE_URL}/laps?session_key=${sessionKey}`;
  if (driverNumber) url += `&driver_number=${driverNumber}`;
  return rateLimitedFetch(url);
}

/**
 * Fetch pit stop data
 */
export async function fetchPitStops(sessionKey = 'latest', driverNumber) {
  let url = `${BASE_URL}/pit?session_key=${sessionKey}`;
  if (driverNumber) url += `&driver_number=${driverNumber}`;
  return rateLimitedFetch(url);
}

/**
 * Fetch car location data (x, y coordinates on track)
 */
export async function fetchLocation(sessionKey = 'latest', driverNumber) {
  let url = `${BASE_URL}/location?session_key=${sessionKey}`;
  if (driverNumber) url += `&driver_number=${driverNumber}`;
  return rateLimitedFetch(url);
}
