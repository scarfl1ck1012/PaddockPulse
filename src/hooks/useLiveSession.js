import { useState, useEffect, useRef, useCallback } from 'react';

const OPENF1_BASE = 'https://api.openf1.org/v1';

/**
 * useLiveSession — detects ANY active F1 session (FP, Qualifying, Sprint, Race)
 * Fetches all sessions for the current year, finds one where now is between date_start and date_end.
 * Also provides the next upcoming session for countdown display.
 * Re-checks every 30 seconds.
 */
export default function useLiveSession() {
  const [isLive, setIsLive] = useState(false);
  const [liveSession, setLiveSession] = useState(null);
  const [nextSession, setNextSession] = useState(null);
  const [allSessions, setAllSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const checkSessions = useCallback(async () => {
    try {
      const year = new Date().getFullYear();
      const res = await fetch(`${OPENF1_BASE}/sessions?year=${year}`);
      if (!res.ok) throw new Error(`OpenF1 ${res.status}`);
      const sessions = await res.json();

      if (!Array.isArray(sessions) || sessions.length === 0) {
        setIsLive(false);
        setLiveSession(null);
        setNextSession(null);
        setAllSessions([]);
        setLoading(false);
        return;
      }

      setAllSessions(sessions);
      const now = new Date();

      // Find ANY session that is currently live (any type: FP, Quali, Sprint, Race)
      const live = sessions.find(s => {
        const start = new Date(s.date_start);
        const end = s.date_end ? new Date(s.date_end) : null;
        // Session is live if now is between start and end
        // If no end date, consider it live if started within the last 4 hours
        if (end) {
          return now >= start && now <= end;
        }
        return now >= start && (now - start) < 4 * 60 * 60 * 1000;
      });

      if (live) {
        setIsLive(true);
        setLiveSession(live);
        setNextSession(null);
      } else {
        setIsLive(false);
        setLiveSession(null);

        // Find next upcoming session (any type)
        const upcoming = sessions
          .filter(s => new Date(s.date_start) > now)
          .sort((a, b) => new Date(a.date_start) - new Date(b.date_start));

        setNextSession(upcoming.length > 0 ? upcoming[0] : null);
      }

      setError(null);
    } catch (err) {
      console.error('Session detection error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSessions();
    // Re-check every 30 seconds
    intervalRef.current = setInterval(checkSessions, 30000);
    return () => clearInterval(intervalRef.current);
  }, [checkSessions]);

  return {
    isLive,
    liveSession,        // Full OpenF1 session object when live
    nextSession,        // Next upcoming session when not live
    allSessions,        // All sessions for the year
    loading,
    error,
    recheckNow: checkSessions,
  };
}
