import { create } from 'zustand';

const useLiveStore = create((set) => ({
  // Session metadata
  isLive: false,
  sessionInfo: null,
  
  // High-frequency live data
  leaderboard: [],
  positions: {},
  weather: null,
  raceControlMessages: [],
  teamRadios: [],
  
  // Actions
  setSessionStatus: (isLive, sessionInfo) => set({ isLive, sessionInfo }),
  
  updateLeaderboard: (drivers) => set({ leaderboard: drivers }),
  
  updatePositions: (newPositions) => set((state) => ({
    positions: { ...state.positions, ...newPositions }
  })),
  
  setWeather: (weatherData) => set({ weather: weatherData }),
  
  addRaceControlMessage: (message) => set((state) => {
    // Avoid duplicates based on date
    const exists = state.raceControlMessages.some(m => m.date === message.date);
    if (exists) return state;
    return {
      raceControlMessages: [message, ...state.raceControlMessages].slice(0, 100)
    };
  }),
  
  addTeamRadio: (radio) => set((state) => {
    // Avoid duplicates based on date
    const exists = state.teamRadios.some(r => r.date === radio.date);
    if (exists) return state;
    return {
      teamRadios: [radio, ...state.teamRadios].slice(0, 50)
    };
  }),

  // Reset store (useful between sessions)
  resetLiveState: () => set({
    leaderboard: [],
    positions: {},
    weather: null,
    raceControlMessages: [],
    teamRadios: []
  })
}));

export default useLiveStore;
