import { create } from 'zustand';

export const useLiveStore = create((set) => ({
  isLive: false,
  sessionKey: null,
  sessionType: null,
  sessionName: null,
  circuitName: null,
  drivers: [],
  positions: {}, // map of driver number to position data [{date, x, y, z}]
  intervals: [], // latest intervals per driver
  laps: [], // all laps per driver
  stints: [], // tyre stints
  radioClips: [], // team radio
  raceControl: [], // race control messages
  weather: null, // latest weather
  isLoading: true,
  
  setLiveState: (stateUpdate) => set((state) => ({ ...state, ...stateUpdate })),
}));
