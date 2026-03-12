/**
 * React Query hooks for F1 data
 */
import { useQuery } from '@tanstack/react-query';
import * as jolpica from '../api/jolpica';
import * as openf1 from '../api/openf1';

// --- Jolpica/Historical Data Hooks ---

export function useDriverStandings(season = 'current') {
  return useQuery({
    queryKey: ['driverStandings', season],
    queryFn: () => jolpica.fetchDriverStandings(season),
    staleTime: 5 * 60 * 1000, // 5 min
    retry: 2,
  });
}

export function useConstructorStandings(season = 'current') {
  return useQuery({
    queryKey: ['constructorStandings', season],
    queryFn: () => jolpica.fetchConstructorStandings(season),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function useRaceSchedule(season = 'current') {
  return useQuery({
    queryKey: ['raceSchedule', season],
    queryFn: () => jolpica.fetchRaceSchedule(season),
    staleTime: 30 * 60 * 1000, // 30 min — schedule doesn't change often
    retry: 2,
  });
}

export function useRaceResults(season, round) {
  return useQuery({
    queryKey: ['raceResults', season, round],
    queryFn: () => jolpica.fetchRaceResults(season, round),
    enabled: !!season && !!round,
    staleTime: 60 * 60 * 1000, // 1 hour — results are final
    retry: 2,
  });
}

export function useLastRaceResults() {
  return useQuery({
    queryKey: ['lastRaceResults'],
    queryFn: () => jolpica.fetchLastRaceResults(),
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });
}

// --- OpenF1 Live Data Hooks ---

export function useOpenF1Drivers(sessionKey = 'latest') {
  return useQuery({
    queryKey: ['openf1Drivers', sessionKey],
    queryFn: () => openf1.fetchDrivers(sessionKey),
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });
}

export function useOpenF1Weather(sessionKey = 'latest') {
  return useQuery({
    queryKey: ['openf1Weather', sessionKey],
    queryFn: () => openf1.fetchWeather(sessionKey),
    staleTime: 60 * 1000, // 1 min during live
    retry: 2,
  });
}

export function useOpenF1Meetings(year) {
  return useQuery({
    queryKey: ['openf1Meetings', year],
    queryFn: () => openf1.fetchMeetings(year),
    staleTime: 30 * 60 * 1000,
    retry: 2,
  });
}

export function useOpenF1RaceControl(sessionKey = 'latest') {
  return useQuery({
    queryKey: ['openf1RaceControl', sessionKey],
    queryFn: () => openf1.fetchRaceControl(sessionKey),
    staleTime: 30 * 1000,
    retry: 2,
  });
}

// --- Live Timing Hooks (with polling) ---

export function useOpenF1Intervals(sessionKey = 'latest') {
  return useQuery({
    queryKey: ['openf1Intervals', sessionKey],
    queryFn: () => openf1.fetchIntervals(sessionKey),
    staleTime: 10 * 1000,
    refetchInterval: 15 * 1000,
    retry: 2,
  });
}

export function useOpenF1Laps(sessionKey = 'latest', driverNumber) {
  return useQuery({
    queryKey: ['openf1Laps', sessionKey, driverNumber],
    queryFn: () => openf1.fetchLaps(sessionKey, driverNumber),
    staleTime: 15 * 1000,
    refetchInterval: 20 * 1000,
    retry: 2,
  });
}

export function useOpenF1Stints(sessionKey = 'latest') {
  return useQuery({
    queryKey: ['openf1Stints', sessionKey],
    queryFn: () => openf1.fetchStints(sessionKey),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    retry: 2,
  });
}

export function useOpenF1PitStops(sessionKey = 'latest') {
  return useQuery({
    queryKey: ['openf1PitStops', sessionKey],
    queryFn: () => openf1.fetchPitStops(sessionKey),
    staleTime: 15 * 1000,
    refetchInterval: 20 * 1000,
    retry: 2,
  });
}

export function useOpenF1Positions(sessionKey = 'latest') {
  return useQuery({
    queryKey: ['openf1Positions', sessionKey],
    queryFn: () => openf1.fetchPositions(sessionKey),
    staleTime: 10 * 1000,
    refetchInterval: 15 * 1000,
    retry: 2,
  });
}

export function useOpenF1Location(sessionKey = 'latest', driverNumber) {
  return useQuery({
    queryKey: ['openf1Location', sessionKey, driverNumber],
    queryFn: () => openf1.fetchLocation(sessionKey, driverNumber),
    staleTime: 30 * 1000,
    retry: 2,
  });
}

export function useOpenF1TeamRadio(sessionKey = 'latest', driverNumber) {
  return useQuery({
    queryKey: ['openf1TeamRadio', sessionKey, driverNumber],
    queryFn: () => openf1.fetchTeamRadio(sessionKey, driverNumber),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    retry: 2,
  });
}
