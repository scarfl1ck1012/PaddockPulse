import { useState, useCallback, useRef } from 'react';
import { getDrivers, getDriverLocation, getDriverCarData, getStints, getLaps,
         getRaceControl, getWeather } from '../services/openf1Replay';

const FPS = 25;
const DT = 1 / FPS; // 0.04 seconds per frame

export function useFrameBuilder() {
  const [frames, setFrames] = useState([]);
  const [trackPoints, setTrackPoints] = useState([]); // [{x, y}] circuit outline
  const [drivers, setDrivers] = useState({});          // { driverNumber: driverInfo }
  const [totalLaps, setTotalLaps] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  const [error, setError] = useState(null);
  
  // Also store race control messages
  const [raceControlLogs, setRaceControlLogs] = useState([]);
  
  const abortRef = useRef(null);

  const buildFrames = useCallback(async (sessionKey) => {
    setIsBuilding(true);
    setError(null);
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    
    try {
      // --- STEP 1: Fetch all metadata ---
      setLoadingMessage('Fetching driver info...');
      setLoadingProgress(5);
      const driversRaw = await getDrivers(sessionKey);
      
      if (!Array.isArray(driversRaw)) {
        throw new Error("OpenF1 API returned invalid driver data. Please try another race.");
      }

      const driverMap = {}; // { driverNumber: { code, teamColor, fullName } }
      driversRaw.forEach(d => {
        driverMap[d.driver_number] = {
          code: d.name_acronym,
          teamColor: '#' + d.team_colour,
          fullName: d.full_name,
          teamName: d.team_name,
          number: d.driver_number,
        };
      });
      setDrivers(driverMap);

      setLoadingMessage('Fetching tyre stints...');
      setLoadingProgress(10);
      let stints = await getStints(sessionKey);
      if (!Array.isArray(stints)) stints = [];

      // Build stint lookup: { driverNumber: [{ lapStart, lapEnd, compound, tyreAge }] }
      const stintMap = {};
      stints.forEach(s => {
        if (!stintMap[s.driver_number]) stintMap[s.driver_number] = [];
        stintMap[s.driver_number].push({
          lapStart: s.lap_start,
          lapEnd: s.lap_end,
          compound: s.compound,
          tyreAge: s.tyre_age_at_start,
        });
      });

      setLoadingMessage('Fetching lap data...');
      setLoadingProgress(15);
      let lapsRaw = await getLaps(sessionKey);
      if (!Array.isArray(lapsRaw)) lapsRaw = [];
      const maxLap = lapsRaw.length > 0 ? Math.max(...lapsRaw.map(l => l.lap_number)) : 0;
      setTotalLaps(maxLap);
      
      // Fetch race control
      let rcEvents = await getRaceControl(sessionKey);
      if (!Array.isArray(rcEvents)) rcEvents = [];
      setRaceControlLogs(rcEvents);

      // --- STEP 2: Fetch X/Y location + car data for ALL drivers ---
      // This is the equivalent of multiprocessing in Python
      const driverNumbers = Object.keys(driverMap).map(Number);
      const driverDataMap = {}; // { driverNumber: { t[], x[], y[], speed[], gear[], drs[], throttle[], brake[] } }

      for (let i = 0; i < driverNumbers.length; i++) {
        if (controller.signal.aborted) throw new Error('Aborted');
        const num = driverNumbers[i];
        const code = driverMap[num].code;
        setLoadingMessage(`Fetching telemetry: ${code} (${i+1}/${driverNumbers.length})`);
        setLoadingProgress(15 + (i / driverNumbers.length) * 55);

        // Fetch location + car data in parallel for this driver
        let [locationRaw, carDataRaw] = await Promise.all([
          getDriverLocation(sessionKey, num),
          getDriverCarData(sessionKey, num),
        ]);

        if (!Array.isArray(locationRaw)) locationRaw = [];
        if (!Array.isArray(carDataRaw)) carDataRaw = [];

        if (locationRaw.length === 0) continue;

        // Convert date strings to seconds since race start (will normalize later)
        const t_loc = locationRaw.map(d => new Date(d.date).getTime() / 1000);
        const x = locationRaw.map(d => d.x);
        const y = locationRaw.map(d => d.y);

        // Build car data lookup indexed by timestamp
        const carByTime = {};
        carDataRaw.forEach(c => {
          const t = new Date(c.date).getTime() / 1000;
          carByTime[t] = { speed: c.speed, gear: c.n_gear, drs: c.drs,
                           throttle: c.throttle, brake: c.brake };
        });

        // Get tyre for a given lap
        function getTyreAtLap(lap) {
          const driverStints = stintMap[num] || [];
          const stint = driverStints.find(s => lap >= s.lapStart && lap <= s.lapEnd);
          return stint ? stint.compound : 'UNKNOWN';
        }

        // Get current lap for a timestamp from laps data
        const driverLaps = lapsRaw.filter(l => l.driver_number === num)
          .sort((a, b) => a.lap_number - b.lap_number);

        function getLapAtTime(t_seconds) {
          // Find which lap this timestamp belongs to based on lap start times
          if (driverLaps.length === 0) return 1;
          for (let j = driverLaps.length - 1; j >= 0; j--) {
            const lapStartT = new Date(driverLaps[j].date_start).getTime() / 1000;
            if (t_seconds >= lapStartT) return driverLaps[j].lap_number;
          }
          return 1;
        }

        // Calculate lap progress based on time interpolation within the lap
        // This gives us the "distPct" needed for sorting the leaderboard
        function getProgressAtTime(t_seconds) {
          const currentLap = getLapAtTime(t_seconds);
          if (driverLaps.length === 0) return 0;
          
          const lapDataIter = driverLaps.find(l => l.lap_number === currentLap);
          if (!lapDataIter) return currentLap / maxLap;
          
          const lapStart = new Date(lapDataIter.date_start).getTime() / 1000;
          const duration = lapDataIter.lap_duration || 90; // estimate if missing
          const lapProgress = Math.max(0, Math.min(1, (t_seconds - lapStart) / duration));
          
          return (currentLap - 1 + lapProgress) / maxLap;
        }

        driverDataMap[num] = { t: t_loc, x, y, getTyreAtLap, getLapAtTime,
                               getProgressAtTime, carByTime, retired: false };
      }

      if (controller.signal.aborted) throw new Error('Aborted');

      // --- STEP 3: Build track outline from first driver's first lap ---
      // Use the driver with most location points (race leader approximation)
      setLoadingMessage('Building track outline...');
      setLoadingProgress(72);
      
      const leaderNum = driverNumbers.reduce((best, num) => 
        (driverDataMap[num]?.t.length || 0) > (driverDataMap[best]?.t.length || 0) ? num : best
      , driverNumbers[0]);
      
      const leaderData = driverDataMap[leaderNum];
      if (!leaderData) {
        throw new Error("No telemetry data found for any driver.");
      }
      
      // Get first lap only (indices where lap==1 or first ~300 points)
      const firstLapEnd = Math.min(600, Math.floor(leaderData.t.length / (totalLaps || 60)));
      const rawTrackX = leaderData.x.slice(0, firstLapEnd);
      const rawTrackY = leaderData.y.slice(0, firstLapEnd);
      
      // Normalize to 0-1 range (will be scaled to canvas in renderer)
      const xMin = Math.min(...leaderData.x);
      const xMax = Math.max(...leaderData.x);
      const yMin = Math.min(...leaderData.y);
      const yMax = Math.max(...leaderData.y);
      
      const track = rawTrackX.map((x, i) => ({
        x: (x - xMin) / (xMax - xMin),
        y: (rawTrackY[i] - yMin) / (yMax - yMin),
      }));
      setTrackPoints(track);

      // --- STEP 4: Build unified 25 FPS frame array (EXACT mirror of get_race_telemetry) ---
      setLoadingMessage('Building animation frames...');
      setLoadingProgress(78);

      // Find global time range
      let globalTMin = Infinity;
      let globalTMax = -Infinity;
      driverNumbers.forEach(num => {
        const d = driverDataMap[num];
        if (!d || d.t.length === 0) return;
        if (d.t[0] < globalTMin) globalTMin = d.t[0];
        if (d.t[d.t.length - 1] > globalTMax) globalTMax = d.t[d.t.length - 1];
      });
      
      // Safety check
      if (globalTMin === Infinity) globalTMin = 0;
      if (globalTMax === -Infinity) globalTMax = 100;

      const totalFrames = Math.floor((globalTMax - globalTMin) / DT);

      // Binary search helper (mirrors Python's np.searchsorted)
      function findClosestIndex(arr, target) {
        let lo = 0, hi = arr.length - 1;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (arr[mid] < target) lo = mid + 1;
          else hi = mid;
        }
        // Return closest
        if (lo > 0 && Math.abs(arr[lo - 1] - target) < Math.abs(arr[lo] - target)) {
          return lo - 1;
        }
        return Math.max(0, Math.min(lo, arr.length - 1));
      }

      // Normalize x/y for a given driver at a given index
      function normalizeXY(rawX, rawY) {
        return {
          x: (rawX - xMin) / (xMax - xMin),
          y: (rawY - yMin) / (yMax - yMin),
        };
      }

      const builtFrames = [];
      
      // Build in chunks to avoid blocking the main thread
      const CHUNK_SIZE = 500;
      for (let i = 0; i < totalFrames; i++) {
        if (controller.signal.aborted) throw new Error('Aborted');
        
        const t = globalTMin + i * DT;
        const frameDrivers = {};
        
        let maxLapThisFrame = 0;

        driverNumbers.forEach(num => {
          const d = driverDataMap[num];
          if (!d || d.t.length === 0) return;
          
          if (t < d.t[0]) return; // Driver hasn't started yet
          const isRetired = t > d.t[d.t.length - 1] + 60; // Hasn't moved in a minute
          
          // Find closest index in this driver's time array
          const idx = findClosestIndex(d.t, Math.min(t, d.t[d.t.length - 1]));
          const rawX = d.x[idx];
          const rawY = d.y[idx];
          const { x: normX, y: normY } = normalizeXY(rawX, rawY);
          
          // Get lap number at this time
          const lap = d.getLapAtTime(t);
          if (lap > maxLapThisFrame) maxLapThisFrame = lap;
          
          // Distance calc for leaderboard pairing
          const distPct = d.getProgressAtTime(t);
          
          // Get tyre
          const tyre = d.getTyreAtLap(lap);
          
          // Get car data (find closest timestamp in carByTime)
          const carTimes = Object.keys(d.carByTime).map(Number).sort((a,b) => a-b);
          let car = { speed: 0, gear: 0, drs: 0, throttle: 0, brake: false };
          if (carTimes.length > 0) {
             const carIdx = findClosestIndex(carTimes, t);
             car = d.carByTime[carTimes[carIdx]] || car;
          }

          frameDrivers[num] = {
            x: normX, y: normY,
            speed: car.speed, gear: car.gear,
            drs: car.drs > 9, // DRS open if > 9
            throttle: car.throttle, brake: car.brake,
            lap, tyre, retired: isRetired,
            distPct, // used for leaderboard sorting and gaps
            code: driverMap[num]?.code || String(num),
            teamColor: driverMap[num]?.teamColor || '#FFFFFF',
            fullName: driverMap[num]?.fullName,
          };
        });

        builtFrames.push({
          t: t, 
          relativeT: t - globalTMin, 
          maxLap: maxLapThisFrame,
          drivers: frameDrivers 
        });

        // Update progress and yield to browser every chunk
        if (i % CHUNK_SIZE === 0) {
          setLoadingProgress(78 + (i / totalFrames) * 20);
          await new Promise(resolve => setTimeout(resolve, 1)); // yield
        }
      }

      setFrames(builtFrames);
      setLoadingProgress(100);
      setLoadingMessage('Ready!');
      setIsBuilding(false);

    } catch (err) {
      if (err.message !== 'Aborted') {
        setError(err.message);
        setIsBuilding(false);
      }
    }
  }, []);

  const clearFrames = useCallback(() => {
    setFrames([]);
    setTrackPoints([]);
    setDrivers({});
    setRaceControlLogs([]);
    setTotalLaps(0);
    setLoadingProgress(0);
    if (abortRef.current) abortRef.current.abort();
  }, []);

  return { frames, trackPoints, drivers, totalLaps, buildFrames,
           loadingProgress, loadingMessage, isBuilding, error, clearFrames,
           raceControlLogs };
}
