import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchSeasonRaces } from '../../api/jolpica';
import ReplayControls from '../../components/recap/ReplayControls';
import ReplayTrackMap from '../../components/recap/ReplayTrackMap';
import { getTeamColour } from '../../utils/teamColours';
import './Replay.css';

const Replay = () => {
    const [searchParams] = useSearchParams();
    const initialYear = searchParams.get('year') || new Date().getFullYear();
    const initialRound = searchParams.get('round') || '';

    const [year, setYear] = useState(initialYear);
    const [round, setRound] = useState(initialRound);
    
    const [races, setRaces] = useState([]);
    const [raceData, setRaceData] = useState(null); // Full classification
    const [lapsData, setLapsData] = useState([]); // Array of laps containing timings
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [currentLap, setCurrentLap] = useState(1);
    
    const animationRef = useRef();
    const lastTimeRef = useRef();

    const years = Array.from({ length: new Date().getFullYear() - 1949 }, (_, i) => new Date().getFullYear() - i);

    useEffect(() => {
        const loadRaces = async () => {
            const data = await fetchSeasonRaces(year);
            if (data?.MRData?.RaceTable?.Races) {
                setRaces(data.MRData.RaceTable.Races);
            }
        };
        loadRaces();
    }, [year]);

    const handleLoadReplay = async () => {
        if (!round) return;
        setIsPlaying(false);
        setCurrentLap(1);
        
        try {
            // Fetch results summary
            const res = await fetch(`https://api.jolpi.ca/ergast/f1/${year}/${round}/results.json`);
            const resData = await res.json();
            
            // Fetch lap by lap data
            // Note: Jolpica might return laps paginated (limit 30 by default). We need limit=2000 for a full race typically.
            const lapsRes = await fetch(`https://api.jolpi.ca/ergast/f1/${year}/${round}/laps.json?limit=2000`);
            const lData = await lapsRes.json();

            if (resData?.MRData?.RaceTable?.Races[0]) {
                setRaceData(resData.MRData.RaceTable.Races[0]);
            }
            if (lData?.MRData?.RaceTable?.Races[0]?.Laps) {
                setLapsData(lData.MRData.RaceTable.Races[0].Laps);
            }
        } catch(e) { console.error(e) }
    };

    // Auto-load if params existed
    useEffect(() => {
        if (initialRound) {
            handleLoadReplay();
        }
    }, []);

    // Animation Loop
    useEffect(() => {
        const update = (time) => {
            if (lastTimeRef.current != null) {
                const delta = time - lastTimeRef.current;
                
                // Roughly 1 lap = 90s in real time.
                // Replay speed 1x: 1 lap takes 90s -> 0.011 laps per second
                // For a more engaging UI, let's make 1x = 10s per lap.
                // This means progress += delta * (speed / 10000)
                
                const increment = (delta / 10000) * speed;
                setCurrentLap(prev => {
                    const next = prev + increment;
                    if (next >= lapsData.length) {
                        setIsPlaying(false);
                        return lapsData.length;
                    }
                    return next;
                });
            }
            lastTimeRef.current = time;
            if (isPlaying) {
                animationRef.current = requestAnimationFrame(update);
            }
        };

        if (isPlaying) {
            animationRef.current = requestAnimationFrame(update);
        } else {
            lastTimeRef.current = null;
            cancelAnimationFrame(animationRef.current);
        }

        return () => cancelAnimationFrame(animationRef.current);
    }, [isPlaying, speed, lapsData.length]);

    const handleSeek = (lap) => {
        setCurrentLap(lap);
    };

    const getLapState = (lapNum) => {
        // Find the lap data close to lapNum
        const idx = Math.floor(lapNum) - 1;
        if (idx < 0 || idx >= lapsData.length) return {};
        const lap = lapsData[idx];
        const state = {};
        lap.Timings.forEach(t => {
            state[t.driverId] = t;
        });
        return state;
    };

    const currentLapState = getLapState(currentLap);
    
    return (
        <div className="replay-page">
            <div className="replay-header">
                <h1>RACE RECAP</h1>
                <div className="replay-selector">
                    <select value={year} onChange={e => setYear(e.target.value)}>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select value={round} onChange={e => setRound(e.target.value)}>
                        <option value="">-- Select Grand Prix --</option>
                        {races.map(r => (
                            <option key={r.round} value={r.round}>{r.raceName}</option>
                        ))}
                    </select>
                    <button onClick={handleLoadReplay} disabled={!round} className="load-btn">Load Replay</button>
                </div>
            </div>

            {raceData && lapsData.length > 0 && (
                <div className="replay-dashboard">
                    <div className="replay-main">
                        <div className="replay-info-panel">
                            <h2>{raceData.raceName} {year}</h2>
                            <div className="winner-stat">
                                <strong>Winner:</strong> {raceData.Results[0].Driver.givenName} {raceData.Results[0].Driver.familyName}
                            </div>
                        </div>

                        <ReplayTrackMap 
                            lapData={currentLapState} 
                            currentLap={currentLap} 
                            drivers={raceData.Results.map(r => ({ driverId: r.Driver.driverId, code: r.Driver.code, constructorId: r.Constructor.constructorId}))} 
                        />
                        
                        <ReplayControls 
                            isPlaying={isPlaying}
                            onTogglePlay={() => setIsPlaying(!isPlaying)}
                            progress={currentLap}
                            onSeek={handleSeek}
                            speed={speed}
                            onChangeSpeed={setSpeed}
                            currentLap={currentLap}
                            totalLaps={lapsData.length}
                            onRestart={() => { setCurrentLap(1); setIsPlaying(true); }}
                        />
                    </div>

                    <div className="replay-sidebar">
                        <table className="replay-leaderboard">
                            <thead>
                                <tr>
                                    <th>POS</th>
                                    <th>DRIVER</th>
                                    <th>GAP</th>
                                </tr>
                            </thead>
                            <tbody>
                                {raceData.Results.map((r) => {
                                    // Use live lap state for ordering if possible, but ordering by classification and showing current gap is fine.
                                    const timing = currentLapState[r.Driver.driverId];
                                    const drvPos = timing ? timing.position : r.position;
                                    const teamCol = getTeamColour(r.Constructor.name);
                                    
                                    return (
                                        <tr key={r.Driver.driverId} style={{ borderLeft: `3px solid ${teamCol}` }}>
                                            <td>{drvPos}</td>
                                            <td><b>{r.Driver.code || r.Driver.familyName}</b></td>
                                            <td className="mono">{timing ? timing.time : '--:--'}</td>
                                        </tr>
                                    );
                                }).sort((a,b) => {
                                    const aPos = parseInt(a.props.children[0].props.children) || 99;
                                    const bPos = parseInt(b.props.children[0].props.children) || 99;
                                    return aPos - bPos;
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Replay;
