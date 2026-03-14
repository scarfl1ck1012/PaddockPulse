const BASE_URL = 'https://api.openf1.org/v1';

const fetchOpenF1 = async (endpoint, signal) => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, { signal });
    if (!response.ok) throw new Error(`OpenF1 Error: ${response.status}`);
    const data = await response.json();
    if (data && data.detail) {
      console.warn("OpenF1 Offline/Error:", data.detail);
      return [];
    }
    return data;
  } catch (error) {
    if (error.name === 'AbortError') return [];
    console.error(error);
    return [];
  }
};

// Sessions
export const fetchLatestSession = (signal) => fetchOpenF1('/sessions?session_key=latest', signal);
export const fetchSessionsByYear = (year, signal) => fetchOpenF1(`/sessions?year=${year}`, signal);
export const fetchSessionsByCircuit = (year, circuitShortName, signal) => fetchOpenF1(`/sessions?year=${year}&circuit_short_name=${circuitShortName}`, signal);

// Drivers
export const fetchDrivers = (sessionKey, signal) => fetchOpenF1(`/drivers?session_key=${sessionKey}`, signal);

// Lap data
export const fetchLaps = (sessionKey, driverNumber, signal) => {
  const driverParam = driverNumber ? `&driver_number=${driverNumber}` : '';
  return fetchOpenF1(`/laps?session_key=${sessionKey}${driverParam}`, signal);
};

// Positions & Location
export const fetchPositions = (sessionKey, signal) => fetchOpenF1(`/position?session_key=${sessionKey}`, signal);
export const fetchLocation = (sessionKey, signal) => fetchOpenF1(`/location?session_key=${sessionKey}`, signal);
export const fetchLocationDelta = (sessionKey, since, signal) => fetchOpenF1(`/location?session_key=${sessionKey}&date>${since}`, signal);

// Intervals
export const fetchIntervals = (sessionKey, signal) => fetchOpenF1(`/intervals?session_key=${sessionKey}`, signal);
export const fetchIntervalsDelta = (sessionKey, since, signal) => fetchOpenF1(`/intervals?session_key=${sessionKey}&date>${since}`, signal);

// Stints & Pit
export const fetchStints = (sessionKey, signal) => fetchOpenF1(`/stints?session_key=${sessionKey}`, signal);
export const fetchPitStops = (sessionKey, signal) => fetchOpenF1(`/pit?session_key=${sessionKey}`, signal);

// Car data (telemetry)
export const fetchCarData = (sessionKey, signal) => fetchOpenF1(`/car_data?session_key=${sessionKey}`, signal);
export const fetchCarDataDelta = (sessionKey, since, signal) => fetchOpenF1(`/car_data?session_key=${sessionKey}&date>${since}`, signal);

// Race control
export const fetchRaceControl = (sessionKey, signal) => fetchOpenF1(`/race_control?session_key=${sessionKey}`, signal);

// Weather
export const fetchWeather = (sessionKey, signal) => fetchOpenF1(`/weather?session_key=${sessionKey}`, signal);

// Team radio
export const fetchTeamRadio = (sessionKey, signal) => fetchOpenF1(`/team_radio?session_key=${sessionKey}`, signal);

// Meetings
export const fetchMeetings = (year, signal) => fetchOpenF1(`/meetings?year=${year}`, signal);
