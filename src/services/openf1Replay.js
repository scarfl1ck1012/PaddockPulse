const BASE = 'https://api.openf1.org/v1';

// Get session key for a given year + round
export async function getSessionKey(year, round) {
  // First get meeting key from year + round
  const meetings = await fetch(`${BASE}/meetings?year=${year}`).then(r => r.json());
  // Meetings are sorted by date. Find round N
  const meeting = meetings[round - 1]; // approximate
  if (!meeting) return null;
  
  const sessions = await fetch(
    `${BASE}/sessions?meeting_key=${meeting.meeting_key}&session_name=Race`
  ).then(r => r.json());
  
  return sessions[0]?.session_key;
}

// Get all drivers for a session
export async function getDrivers(sessionKey) {
  return fetch(`${BASE}/drivers?session_key=${sessionKey}`).then(r => r.json());
  // Returns: [{ driver_number, name_acronym, team_name, team_colour, full_name }]
}

// Get X/Y positions for one driver (can be 50,000-100,000 records)
export async function getDriverLocation(sessionKey, driverNumber) {
  return fetch(`${BASE}/location?session_key=${sessionKey}&driver_number=${driverNumber}`)
    .then(r => r.json());
  // Returns: [{ driver_number, x, y, date }] sorted by date ascending
}

// Get car telemetry for one driver
export async function getDriverCarData(sessionKey, driverNumber) {
  return fetch(`${BASE}/car_data?session_key=${sessionKey}&driver_number=${driverNumber}`)
    .then(r => r.json());
  // Returns: [{ driver_number, date, speed, n_gear, drs, throttle, brake }]
}

// Get stints (tyre data)
export async function getStints(sessionKey) {
  return fetch(`${BASE}/stints?session_key=${sessionKey}`).then(r => r.json());
  // Returns: [{ driver_number, stint_number, lap_start, lap_end, compound, tyre_age_at_start }]
}

// Get all laps
export async function getLaps(sessionKey) {
  return fetch(`${BASE}/laps?session_key=${sessionKey}`).then(r => r.json());
}

// Get race control
export async function getRaceControl(sessionKey) {
  return fetch(`${BASE}/race_control?session_key=${sessionKey}`).then(r => r.json());
}

// Get weather
export async function getWeather(sessionKey) {
  return fetch(`${BASE}/weather?session_key=${sessionKey}`).then(r => r.json());
}

// Get pit stops
export async function getPitStops(sessionKey) {
  return fetch(`${BASE}/pit?session_key=${sessionKey}`).then(r => r.json());
}

// Get intervals
export async function getIntervals(sessionKey) {
  return fetch(`${BASE}/intervals?session_key=${sessionKey}`).then(r => r.json());
}
