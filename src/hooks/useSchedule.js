import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchCurrentSchedule, fetchLastRaceResults, fetchDriverStandings, fetchConstructorStandings } from '../services/api.js';

/**
 * useSchedule — shared hook for current season schedule
 * Returns: schedule, nextRace, isLive, currentRace, loading, error,
 *          driverLeader, constructorLeader, lastRaceResult
 */
export default function useSchedule() {
  const [schedule, setSchedule] = useState([]);
  const [nextRace, setNextRace] = useState(null);
  const [currentRace, setCurrentRace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRacePodium, setLastRacePodium] = useState(null);
  const [driverLeader, setDriverLeader] = useState(null);
  const [constructorLeader, setConstructorLeader] = useState(null);
  const abortRef = useRef(null);

  const loadData = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      // Fetch schedule + stats in parallel
      const [scheduleData, lastRaceData, driverData, constructorData] = await Promise.all([
        fetchCurrentSchedule(controller.signal),
        fetchLastRaceResults(controller.signal),
        fetchDriverStandings('current', controller.signal),
        fetchConstructorStandings('current', controller.signal),
      ]);

      // Parse schedule
      const races = scheduleData?.MRData?.RaceTable?.Races || [];
      setSchedule(races);

      // Find next race: first race whose date is in the future
      const now = new Date();
      let foundNext = null;
      let foundCurrent = null;

      for (const race of races) {
        const raceDate = new Date(race.date + 'T' + (race.time || '00:00:00Z'));
        // Consider the race "current" if it's within 3 days (race weekend)
        const raceWeekendStart = new Date(raceDate);
        raceWeekendStart.setDate(raceWeekendStart.getDate() - 3);

        if (raceDate > now) {
          if (!foundNext) foundNext = race;
          if (raceWeekendStart <= now) foundCurrent = race;
          break;
        }
      }

      // If no future race found, all races are done — show last race
      if (!foundNext && races.length > 0) {
        foundNext = races[races.length - 1];
      }

      setNextRace(foundNext);
      setCurrentRace(foundCurrent);

      // Parse last race results
      const lastResults = lastRaceData?.MRData?.RaceTable?.Races?.[0];
      if (lastResults) {
        const results = lastResults.Results || [];
        setLastRacePodium({
          raceName: lastResults.raceName,
          p1: results[0] || null,
          p2: results[1] || null,
          p3: results[2] || null,
        });
      }

      // Parse standings leaders
      const drivers = driverData?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings;
      if (drivers && drivers.length > 0) {
        const leader = drivers[0];
        setDriverLeader({
          name: `${leader.Driver.givenName} ${leader.Driver.familyName}`,
          points: leader.points,
          team: leader.Constructors?.[0]?.name || '',
        });
      }

      const constructors = constructorData?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings;
      if (constructors && constructors.length > 0) {
        const leader = constructors[0];
        setConstructorLeader({
          name: leader.Constructor.name,
          points: leader.points,
        });
      }

    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
        console.error('useSchedule error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [loadData]);

  return {
    schedule,
    nextRace,
    currentRace,
    loading,
    error,
    reload: loadData,
    lastRacePodium,
    driverLeader,
    constructorLeader,
  };
}
