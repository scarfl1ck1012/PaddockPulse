import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveStore } from '../../store/liveStore';
import { fetchSeasonRaces, fetchDriverStandings, fetchConstructorStandings } from '../../api/jolpica';
import { useCountdown } from '../../hooks/useCountdown';
import './Dashboard.css';

const NextRaceCountdown = ({ nextRace }) => {
    // Determine the next actual session time if possible (e.g. FP1), else use Race time
    let targetDate = `${nextRace.date}T${nextRace.time}`;
    let sessionName = "RACE";
    if (nextRace.FirstPractice && new Date(`${nextRace.FirstPractice.date}T${nextRace.FirstPractice.time}`) > new Date()) {
        targetDate = `${nextRace.FirstPractice.date}T${nextRace.FirstPractice.time}`;
        sessionName = "FP1";
    }

    const { days, hours, minutes, seconds } = useCountdown(targetDate);

    return (
        <div className="countdown-widget">
            <h3>NEXT UP: {nextRace.raceName} ({sessionName})</h3>
            <div className="countdown-clocks">
                <div className="c-block"><span>{days}</span><label>DAYS</label></div>
                <div className="c-block"><span>{hours}</span><label>HRS</label></div>
                <div className="c-block"><span>{minutes}</span><label>MIN</label></div>
                <div className="c-block"><span>{seconds}</span><label>SEC</label></div>
            </div>
            <Link to="/schedule" className="btn-secondary">View Schedule</Link>
        </div>
    );
};

const Dashboard = () => {
    const { isLive, sessionInfo } = useLiveStore();
    const [nextRace, setNextRace] = useState(null);
    const [leaders, setLeaders] = useState({ driver: null, constructor: null });
    
    useEffect(() => {
        const loadDashboardData = async () => {
            const currentYear = new Date().getFullYear();
            
            // 1. Next Race
            const schedule = await fetchSeasonRaces(currentYear);
            if (schedule?.MRData?.RaceTable?.Races) {
                const upcoming = schedule.MRData.RaceTable.Races.find(r => new Date(`${r.date}T${r.time}`) > new Date());
                setNextRace(upcoming);
            }

            // 2. Leaders
            try {
                const [dStandings, cStandings] = await Promise.all([
                    fetchDriverStandings(currentYear),
                    fetchConstructorStandings(currentYear)
                ]);

                let driver = null;
                let constructor = null;

                if (dStandings?.MRData?.StandingsTable?.StandingsLists?.[0]) {
                    driver = dStandings.MRData.StandingsTable.StandingsLists[0].DriverStandings[0];
                }
                
                if (cStandings?.MRData?.StandingsTable?.StandingsLists?.[0]) {
                    constructor = cStandings.MRData.StandingsTable.StandingsLists[0].ConstructorStandings[0];
                }

                setLeaders({ driver, constructor });

            } catch(e) { console.error(e) }
        };

        loadDashboardData();
    }, []);

    return (
        <div className="home-page">
            <section className="hero-section">
                {isLive ? (
                    <div className="hero-live">
                        <div className="live-badge animate-pulse">🔴 LIVE NOW</div>
                        <h1 className="hero-title">{sessionInfo?.session_name || 'F1 SESSION'}</h1>
                        <p className="hero-subtitle">Real-time telemetry and timing available.</p>
                        <Link to="/live" className="btn-primary large">ENTER DASHBOARD</Link>
                    </div>
                ) : (
                    <div className="hero-offline">
                        <h1 className="hero-title">PADDOCKPULSE</h1>
                        <p className="hero-subtitle">Your comprehensive Formula 1 companion.</p>
                        {nextRace ? (
                            <NextRaceCountdown nextRace={nextRace} />
                        ) : (
                            <div className="season-over">SEASON COMPLETED</div>
                        )}
                    </div>
                )}
            </section>

            <section className="stats-strip">
                <div className="strip-item">
                    <span className="strip-label">CHAMPIONSHIP LEADER</span>
                    <span className="strip-value">
                        {leaders.driver 
                            ? `${leaders.driver.Driver.familyName} (${leaders.driver.points} pts)` 
                            : 'Loading...'}
                    </span>
                </div>
                <div className="strip-item">
                    <span className="strip-label">CONSTRUCTOR LEADER</span>
                    <span className="strip-value">
                        {leaders.constructor 
                            ? `${leaders.constructor.Constructor.name} (${leaders.constructor.points} pts)` 
                            : 'Loading...'}
                    </span>
                </div>
                <div className="strip-item">
                    <span className="strip-label">NEXT GRAND PRIX</span>
                    <span className="strip-value">{nextRace ? nextRace.Circuit.circuitName : 'TBC'}</span>
                </div>
            </section>

            <section className="feature-grid">
                <Link to="/live" className="feature-card">
                    <div className="f-icon">⏱</div>
                    <h3>Live Timing</h3>
                    <p>Real-time telemetry, track map, and radio during active sessions.</p>
                </Link>
                
                <Link to="/standings" className="feature-card">
                    <div className="f-icon">🏆</div>
                    <h3>Standings</h3>
                    <p>Driver and constructor championship points and historical breakdown.</p>
                </Link>

                <Link to="/compare" className="feature-card">
                    <div className="f-icon">📊</div>
                    <h3>Head-to-Head</h3>
                    <p>Compare lap times, strategies, and performance across drivers.</p>
                </Link>

                <Link to="/recap" className="feature-card">
                    <div className="f-icon">⏪</div>
                    <h3>Race Recap</h3>
                    <p>Interactive playback of historical races with live leaderboard shifts.</p>
                </Link>

                <Link to="/schedule" className="feature-card">
                    <div className="f-icon">🗓</div>
                    <h3>Schedule</h3>
                    <p>Full season calendar, session times, and reminder notifications.</p>
                </Link>

                <Link to="/learn" className="feature-card">
                    <div className="f-icon">🏎</div>
                    <h3>Learn F1</h3>
                    <p>New to the sport? Understand the rules, tyres, and formats here.</p>
                </Link>
            </section>
        </div>
    );
};

export default Dashboard;
