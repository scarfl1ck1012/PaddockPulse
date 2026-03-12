import { useState, useMemo, useCallback } from 'react';
import { useOpenF1Drivers, useOpenF1Laps, useOpenF1Stints } from '../../hooks/useF1Data';
import { LoadingSkeleton } from '../../components/Common/Common';
import { TYRE_COMPOUNDS, getTeamColour } from '../../api/constants';
import './Replay.css';

export default function Replay() {
  const [currentLap, setCurrentLap] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  const { data: drivers, isLoading: loadingDrivers } = useOpenF1Drivers();
  const { data: allLaps, isLoading: loadingLaps } = useOpenF1Laps();
  const { data: allStints } = useOpenF1Stints();

  // Driver map
  const driverMap = useMemo(() => {
    const map = {};
    if (drivers) {
      const seen = new Set();
      drivers.forEach(d => {
        if (!seen.has(d.driver_number)) {
          map[d.driver_number] = d;
          seen.add(d.driver_number);
        }
      });
    }
    return map;
  }, [drivers]);

  // Max laps
  const maxLap = useMemo(() => {
    if (!allLaps?.length) return 0;
    return Math.max(...allLaps.map(l => l.lap_number).filter(n => !isNaN(n)));
  }, [allLaps]);

  // Build stint compound map
  const stintMap = useMemo(() => {
    if (!allStints?.length) return {};
    const map = {};
    allStints.forEach(s => {
      for (let lap = s.lap_start; lap <= (s.lap_end || s.lap_start + 50); lap++) {
        map[`${s.driver_number}_${lap}`] = s.compound;
      }
    });
    return map;
  }, [allStints]);

  // Get position snapshot for current lap
  const lapSnapshot = useMemo(() => {
    if (!allLaps?.length) return [];

    // Get all laps for the current lap number
    const lapsAtCurrent = allLaps.filter(l => l.lap_number === currentLap);

    // Build snapshot — sort by position or lap duration
    const rows = lapsAtCurrent.map(l => {
      const driver = driverMap[l.driver_number];
      const compound = stintMap[`${l.driver_number}_${currentLap}`];
      return {
        driverNumber: l.driver_number,
        driver,
        position: l.position || 99,
        lapTime: l.lap_duration,
        sector1: l.duration_sector_1,
        sector2: l.duration_sector_2,
        sector3: l.duration_sector_3,
        compound,
        isPitOut: l.is_pit_out_lap,
        stSpeed: l.st_speed,
      };
    });

    return rows.sort((a, b) => a.position - b.position);
  }, [allLaps, currentLap, driverMap, stintMap]);

  // Leader's lap time for gap calculation
  const leaderTime = lapSnapshot[0]?.lapTime;

  // Find best sector times for purple highlighting
  const bestSectors = useMemo(() => {
    const s1 = Math.min(...lapSnapshot.filter(r => r.sector1).map(r => r.sector1));
    const s2 = Math.min(...lapSnapshot.filter(r => r.sector2).map(r => r.sector2));
    const s3 = Math.min(...lapSnapshot.filter(r => r.sector3).map(r => r.sector3));
    return { s1, s2, s3 };
  }, [lapSnapshot]);

  // Playback
  const handlePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    const interval = setInterval(() => {
      setCurrentLap(prev => {
        if (prev >= maxLap) {
          clearInterval(interval);
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 800);
    // Store interval for cleanup
    return () => clearInterval(interval);
  }, [isPlaying, maxLap]);

  const formatTime = (s) => {
    if (!s) return '—';
    const mins = Math.floor(s / 60);
    const secs = (s % 60).toFixed(3);
    return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : secs;
  };

  return (
    <div className="page-container" id="replay-page">
      <div className="page-header">
        <h1 className="page-title">🎬 Race Replay</h1>
        <p className="page-subtitle">Step through the race lap by lap</p>
      </div>

      {loadingDrivers || loadingLaps ? (
        <LoadingSkeleton rows={10} />
      ) : maxLap === 0 ? (
        <div className="replay-empty glass-card">
          <div className="replay-empty-icon">🎬</div>
          <h3>No Lap Data</h3>
          <p>Lap data will be available during or after a session.</p>
        </div>
      ) : (
        <>
          {/* Playback Controls */}
          <div className="replay-controls glass-card">
            <button className="replay-btn" onClick={handlePlay}>
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
            <div className="replay-slider-wrap">
              <input
                type="range"
                className="replay-slider"
                min={1}
                max={maxLap}
                value={currentLap}
                onChange={e => { setCurrentLap(Number(e.target.value)); setIsPlaying(false); }}
              />
              <div className="replay-progress" style={{ width: `${((currentLap - 1) / (maxLap - 1)) * 100}%` }} />
            </div>
            <div className="replay-lap-display">
              <span className="replay-lap-current">Lap {currentLap}</span>
              <span className="replay-lap-total">/ {maxLap}</span>
            </div>
            <div className="replay-step-btns">
              <button className="step-btn" onClick={() => { setCurrentLap(Math.max(1, currentLap - 1)); setIsPlaying(false); }}>◀</button>
              <button className="step-btn" onClick={() => { setCurrentLap(Math.min(maxLap, currentLap + 1)); setIsPlaying(false); }}>▶</button>
            </div>
          </div>

          {/* Position Board */}
          <div className="replay-board">
            {lapSnapshot.map((row, i) => {
              const colour = row.driver?.team_colour ? `#${row.driver.team_colour}` : getTeamColour(row.driver?.team_name);
              const compound = TYRE_COMPOUNDS[row.compound];
              const gap = row.lapTime && leaderTime && i > 0
                ? `+${(row.lapTime - leaderTime).toFixed(3)}`
                : '';

              return (
                <div
                  key={row.driverNumber}
                  className={`replay-row glass-card ${i < 3 ? 'replay-podium' : ''} ${row.isPitOut ? 'replay-pit' : ''}`}
                  style={{ '--team-color': colour, animationDelay: `${i * 30}ms` }}
                >
                  <span className="replay-pos">{row.position !== 99 ? row.position : '—'}</span>
                  <div className="replay-team-bar" style={{ background: colour }} />
                  <div className="replay-driver-info">
                    <span className="replay-driver-name">{row.driver?.full_name || `#${row.driverNumber}`}</span>
                    <span className="replay-driver-code">{row.driver?.name_acronym}</span>
                  </div>
                  <div className="replay-sectors">
                    <span className={`sector-val ${row.sector1 === bestSectors.s1 ? 'sector-best' : ''}`}>
                      {row.sector1 ? row.sector1.toFixed(3) : '—'}
                    </span>
                    <span className={`sector-val ${row.sector2 === bestSectors.s2 ? 'sector-best' : ''}`}>
                      {row.sector2 ? row.sector2.toFixed(3) : '—'}
                    </span>
                    <span className={`sector-val ${row.sector3 === bestSectors.s3 ? 'sector-best' : ''}`}>
                      {row.sector3 ? row.sector3.toFixed(3) : '—'}
                    </span>
                  </div>
                  <span className="replay-time">{formatTime(row.lapTime)}</span>
                  <span className="replay-gap">{gap}</span>
                  {compound && (
                    <span className="replay-tyre" style={{
                      background: compound.color,
                      color: row.compound === 'HARD' ? '#111' : '#fff',
                    }}>
                      {compound.letter}
                    </span>
                  )}
                  {row.isPitOut && <span className="replay-pit-badge">PIT</span>}
                  {row.stSpeed ? <span className="replay-speed">{row.stSpeed}</span> : null}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
