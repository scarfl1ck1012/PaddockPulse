import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchSeasonRaces, fetchRaceResults, fetchQualifying } from '../../api/jolpica';
import PodiumResult from '../../components/schedule/PodiumResult';
import { getTeamColour } from '../../utils/teamColours';
import './Results.css';

const Results = () => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [races, setRaces] = useState([]);
    const [selectedRound, setSelectedRound] = useState('');
    const [sessionType, setSessionType] = useState('Race');
    const [raceData, setRaceData] = useState(null);
    const [qualiData, setQualiData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const years = Array.from({ length: new Date().getFullYear() - 1949 }, (_, i) => new Date().getFullYear() - i);
    const sessionTypes = ['Race', 'Qualifying', 'Sprint', 'Practice'];

    useEffect(() => {
        const loadRaces = async () => {
            const data = await fetchSeasonRaces(year);
            if (data?.MRData?.RaceTable?.Races) {
                // filter completed races
                const completed = data.MRData.RaceTable.Races.filter(r => new Date(`${r.date}T${r.time}`) < new Date());
                setRaces(completed);
                if (completed.length > 0) {
                    setSelectedRound(completed[completed.length - 1].round);
                } else {
                    setSelectedRound('');
                    setRaceData(null);
                    setQualiData(null);
                }
            }
        };
        loadRaces();
    }, [year]);

    useEffect(() => {
        const loadResults = async () => {
            if (!selectedRound) return;
            setIsLoading(true);
            try {
                if (sessionType === 'Race') {
                    const res = await fetchRaceResults(year, selectedRound);
                    if (res?.MRData?.RaceTable?.Races[0]) {
                        setRaceData(res.MRData.RaceTable.Races[0]);
                    } else {
                        setRaceData(null);
                    }
                } else if (sessionType === 'Qualifying') {
                    const res = await fetchQualifying(year, selectedRound);
                    if (res?.MRData?.RaceTable?.Races[0]) {
                        setQualiData(res.MRData.RaceTable.Races[0]);
                    } else {
                        setQualiData(null);
                    }
                }
            } catch(e) { console.error(e) }
            setIsLoading(false);
        };
        loadResults();
    }, [year, selectedRound, sessionType]);

    const renderQualiResults = () => {
        if (!qualiData || !qualiData.QualifyingResults) return <div>No Qualifying data available.</div>;
        
        return (
            <div className="table-container">
                <table className="results-table">
                    <thead>
                        <tr>
                            <th>POS</th>
                            <th>DRIVER</th>
                            <th>TEAM</th>
                            <th>Q1</th>
                            <th>Q2</th>
                            <th>Q3</th>
                        </tr>
                    </thead>
                    <tbody>
                        {qualiData.QualifyingResults.map(res => {
                            const teamCol = getTeamColour(res.Constructor.name);
                            // Eliminated if no Q2/Q3 time
                            const isQ1Out = !res.Q2 && !res.Q3;
                            const isQ2Out = res.Q2 && !res.Q3;

                            return (
                                <tr key={res.Driver.driverId} style={{ borderLeft: `4px solid ${teamCol}` }}>
                                    <td>{res.position}</td>
                                    <td><b>{res.Driver.givenName} {res.Driver.familyName}</b></td>
                                    <td>{res.Constructor.name}</td>
                                    <td className={`mono ${isQ1Out ? 'eliminated' : ''}`}>{res.Q1 || '-'}</td>
                                    <td className={`mono ${isQ2Out ? 'eliminated' : ''}`}>{res.Q2 || '-'}</td>
                                    <td className="mono">{res.Q3 || '-'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderRaceResults = () => {
        if (!raceData || !raceData.Results) return <div>No Race data available.</div>;

        const results = raceData.Results;
        const fastestLapHolder = results.find(r => r.FastestLap?.rank === "1");

        return (
            <>
                {results.length >= 3 && (
                    <div className="podium-wrapper">
                        <PodiumResult results={results} />
                    </div>
                )}

                <div className="stats-panel">
                    <div className="stat-box">
                        <span className="st-lbl">WINNER TIME</span>
                        <span className="st-val mono">{results[0].Time?.time || '-'}</span>
                    </div>
                    {fastestLapHolder && (
                        <div className="stat-box">
                            <span className="st-lbl">FASTEST LAP</span>
                            <span className="st-val mono purple-text">{fastestLapHolder.FastestLap.Time.time} ({fastestLapHolder.Driver.familyName})</span>
                        </div>
                    )}
                    <div className="stat-box">
                        <span className="st-lbl">REPLAY</span>
                        <Link to={`/recap?year=${year}&round=${selectedRound}`} className="watch-btn">▶ Watch</Link>
                    </div>
                </div>

                <div className="table-container">
                    <table className="results-table">
                        <thead>
                            <tr>
                                <th>POS</th>
                                <th>DRIVER</th>
                                <th>CAR</th>
                                <th>LAPS</th>
                                <th>TIME / GAP</th>
                                <th>PTS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map(res => {
                                const teamCol = getTeamColour(res.Constructor.name);
                                const isFastest = res.FastestLap?.rank === "1";
                                const isPole = res.grid === "1";
                                const isDNF = !res.status.includes('Finished') && !res.status.includes('Lap');

                                return (
                                    <tr 
                                        key={res.Driver.driverId} 
                                        className={isFastest ? 'fastest-lap-row' : ''}
                                        style={{ borderLeft: `4px solid ${teamCol}` }}
                                    >
                                        <td>{res.positionText === 'R' ? 'DNF' : res.positionText}</td>
                                        <td>
                                            <b>{res.Driver.givenName} {res.Driver.familyName}</b>
                                            {isPole && <span className="pole-badge">POLE</span>}
                                        </td>
                                        <td>{res.Constructor.name}</td>
                                        <td>{res.laps}</td>
                                        <td className={`mono ${isDNF ? 'dnf-text' : ''}`}>
                                            {isDNF ? res.status : (res.Time?.time || res.status)}
                                        </td>
                                        <td>{res.points}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </>
        );
    };

    return (
        <div className="results-page">
            <div className="results-header">
                <h1>RACE RESULTS</h1>
                
                <div className="selectors-row">
                    <select value={year} onChange={e => setYear(e.target.value)}>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>

                    <select value={selectedRound} onChange={e => setSelectedRound(e.target.value)}>
                        <option value="">-- Select Grand Prix --</option>
                        {races.map(r => (
                            <option key={r.round} value={r.round}>{r.raceName}</option>
                        ))}
                    </select>
                </div>

                {selectedRound && (
                    <div className="session-toggles">
                        {sessionTypes.map(type => (
                            <button 
                                key={type}
                                className={`session-toggle ${sessionType === type ? 'active' : ''}`}
                                onClick={() => setSessionType(type)}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="loading-state">Loading Results...</div>
            ) : (
                <div className="results-content">
                    {sessionType === 'Race' && renderRaceResults()}
                    {sessionType === 'Qualifying' && renderQualiResults()}
                    {(sessionType === 'Sprint' || sessionType === 'Practice') && (
                        <div className="empty-state">Detailed {sessionType} results not available for this session.</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Results;
