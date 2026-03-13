import { useEffect, useRef } from 'react';
import useLiveStore from '../store/liveStore';

const OPENF1_BASE_URL = 'https://api.openf1.org/v1';

export default function useLiveSession() {
  const { isLive, setSessionStatus, updatePositions, setWeather, addRaceControlMessage, addTeamRadio } = useLiveStore();
  const pollIntervalRef = useRef(null);
  
  // 1. Check if a session is currently live
  useEffect(() => {
    const checkLiveSession = async () => {
      try {
        const res = await fetch(`${OPENF1_BASE_URL}/sessions?session_key=latest`);
        const data = await res.json();
        
        if (data && data.length > 0) {
          const session = data[0];
          // Simple heuristic: if end date is in the future or not set, it's live
          const now = new Date();
          const endDate = session.date_end ? new Date(session.date_end) : null;
          
          if (!endDate || now < endDate) {
            setSessionStatus(true, session);
          } else {
            setSessionStatus(false, session);
          }
        }
      } catch (error) {
        console.error("Failed to check live session status:", error);
      }
    };

    checkLiveSession();
    // Re-check every 60 seconds
    const statusInterval = setInterval(checkLiveSession, 60000);
    return () => clearInterval(statusInterval);
  }, [setSessionStatus]);

  // 2. If live, start polling high-frequency endpoints every 3 seconds
  useEffect(() => {
    if (!isLive) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      return;
    }

    const pollData = async () => {
      try {
        // Fetch latest positions
        const posRes = await fetch(`${OPENF1_BASE_URL}/location?session_key=latest`);
        const posData = await posRes.json();
        if (posData && posData.length > 0) {
            // Group by driver to store the latest position per driver
            const latestPos = {};
            posData.forEach(p => {
                const existing = latestPos[p.driver_number];
                if (!existing || new Date(p.date) > new Date(existing.date)) {
                    latestPos[p.driver_number] = p;
                }
            });
            updatePositions(latestPos);
        }

        // Fetch latest weather
        const weatherRes = await fetch(`${OPENF1_BASE_URL}/weather?session_key=latest`);
        const weatherData = await weatherRes.json();
        if (weatherData && weatherData.length > 0) {
            setWeather(weatherData[weatherData.length - 1]);
        }

        // Note: Race Control and Team Radio ideally require keeping track of the last seen date
        // to avoid fetching entirely array every 3s, but OpenF1 returns the full array.
        // The store handles deduplication.
        
      } catch (error) {
        console.error("Live polling error:", error);
      }
    };

    // Initial poll
    pollData();
    
    // Poll every 3s
    pollIntervalRef.current = setInterval(pollData, 3000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isLive, updatePositions, setWeather]);
  
  return { isLive };
}
