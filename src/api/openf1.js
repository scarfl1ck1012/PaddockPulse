const BASE_URL = 'https://api.openf1.org/v1';

const fetchOpenF1 = async (endpoint) => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) throw new Error(`OpenF1 Error: ${response.status}`);
    const data = await response.json();
    if (data && data.detail) {
      console.warn("OpenF1 Offline/Error:", data.detail);
      return [];
    }
    return data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const fetchLatestSession = () => fetchOpenF1('/sessions?session_key=latest');
export const fetchDrivers = (sessionKey) => fetchOpenF1(`/drivers?session_key=${sessionKey}`);
export const fetchLaps = (sessionKey, driverNumber) => fetchOpenF1(`/laps?session_key=${sessionKey}&driver_number=${driverNumber}`);
export const fetchPositions = (sessionKey) => fetchOpenF1(`/position?session_key=${sessionKey}`);
export const fetchIntervals = (sessionKey) => fetchOpenF1(`/intervals?session_key=${sessionKey}`);
export const fetchStints = (sessionKey) => fetchOpenF1(`/stints?session_key=${sessionKey}`);
export const fetchWeather = (sessionKey) => fetchOpenF1(`/weather?session_key=${sessionKey}`);
export const fetchRaceControl = (sessionKey) => fetchOpenF1(`/race_control?session_key=${sessionKey}`);
export const fetchTeamRadio = (sessionKey) => fetchOpenF1(`/team_radio?session_key=${sessionKey}`);
export const fetchPitStops = (sessionKey) => fetchOpenF1(`/pit?session_key=${sessionKey}`);
export const fetchCarData = (sessionKey) => fetchOpenF1(`/car_data?session_key=${sessionKey}`);
export const fetchSessionsByYear = (year) => fetchOpenF1(`/sessions?year=${year}`);
export const fetchSessionsByCircuit = (year, circuitShortName) => fetchOpenF1(`/sessions?year=${year}&circuit_short_name=${circuitShortName}`);
