import { useEffect, useRef } from 'react';
import { useLiveStore } from '../store/liveStore';
import { 
  fetchLatestSession, 
  fetchDrivers, 
  fetchPositions, 
  fetchIntervals, 
  fetchLaps, 
  fetchStints, 
  fetchWeather, 
  fetchRaceControl, 
  fetchTeamRadio 
} from '../api/openf1';
import { dayjs } from '../utils/formatters';

export const useLiveSession = () => {
  const state = useLiveStore();
  const { isLive, sessionKey, setLiveState } = state;
  const pollingIntervalRef = useRef(null);
  const isInitialMount = useRef(true);

  const checkLiveStatus = async () => {
    if (!isInitialMount.current) return;
    isInitialMount.current = false;
    
    try {
      const sessions = await fetchLatestSession();
      if (!sessions || sessions.length === 0) {
        setLiveState({ isLive: false, isLoading: false });
        return;
      }

      // Latest session
      const session = sessions[sessions.length - 1]; // Often the last in the array is the most recent
      const now = dayjs();
      
      // Determine if active
      let active = false;
      const startTime = session.date_start ? dayjs(session.date_start) : null;
      const endTime = session.date_end ? dayjs(session.date_end) : null;

      if (startTime && now.isAfter(startTime)) {
        if (!endTime || now.isBefore(endTime)) {
            active = true;
        }
      }

      setLiveState({
        isLive: active,
        sessionKey: session.session_key,
        sessionType: session.session_type,
        sessionName: session.session_name,
        circuitName: session.circuit_short_name,
        isLoading: false
      });

      if (active) {
          const drivers = await fetchDrivers(session.session_key);
          setLiveState({ drivers });
          pollLiveData(session.session_key);
      } else {
          // If not live, fetch everything once
          await fetchAllData(session.session_key);
      }
    } catch (e) {
      console.error(e);
      setLiveState({ isLoading: false });
    }
  };

  const fetchAllData = async (key) => {
    try {
      const [
          drivers,
          positions,
          intervals,
          laps,
          stints,
          weather,
          raceControl,
          radioClips
      ] = await Promise.all([
          fetchDrivers(key),
          fetchPositions(key),
          fetchIntervals(key),
          fetchLaps(key, ''), // fetch all
          fetchStints(key),
          fetchWeather(key),
          fetchRaceControl(key),
          fetchTeamRadio(key)
      ]);

      setLiveState({
        drivers,
        positions: processPositions(positions),
        intervals,
        laps,
        stints,
        weather: weather && weather.length > 0 ? weather[weather.length - 1] : null,
        raceControl,
        radioClips
      });
    } catch (e) {
        console.error("Failed to fetch all data:", e);
    }
  };

  const processPositions = (positions) => {
      const posMap = {};
      if (Array.isArray(positions)) {
          // Since the API returns historical stream, we really just want the latest position per driver if not doing playback.
          // But to be safe, we'll store the latest for each driver.
          positions.forEach(p => {
              posMap[p.driver_number] = p; // overwrite to keep latest
          });
      }
      return posMap;
  };

  const pollLiveData = async (keyToUse) => {
    const key = keyToUse || sessionKey;
    if (!key) return;
    try {
        const [
            positions,
            intervals,
            laps,
            stints,
            weather,
            raceControl,
            radioClips
        ] = await Promise.all([
            fetchPositions(key),
            fetchIntervals(key),
            fetchLaps(key, ''),
            fetchStints(key),
            fetchWeather(key),
            fetchRaceControl(key),
            fetchTeamRadio(key)
        ]);

        setLiveState({
            positions: processPositions(positions),
            intervals,
            laps,
            stints,
            weather: weather && weather.length > 0 ? weather[weather.length - 1] : null,
            raceControl,
            radioClips
        });
    } catch (e) {
        console.error("Failed to poll live data:", e);
    }
  };

  useEffect(() => {
    checkLiveStatus();
  }, []);

  useEffect(() => {
    if (isLive && sessionKey) {
      pollingIntervalRef.current = setInterval(() => pollLiveData(sessionKey), 3000);
    } else if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [isLive, sessionKey]);

  return state;
};
