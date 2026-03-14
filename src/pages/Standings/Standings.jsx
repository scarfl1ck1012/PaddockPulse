import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getTeamColour } from '../../utils/teamColours';
import { getCountryFlag, CURRENT_SEASON } from '../../api/constants';
import { fetchDriverStandings, fetchConstructorStandings, fetchDriverSeasonResults } from '../../services/api';
import './Standings.css';

const YEARS = Array.from({ length: CURRENT_SEASON - 1949 }, (_, i) => CURRENT_SEASON - i);

function SkeletonRows() {
  return Array.from({ length: 8 }).map((_, i) => (
    <div key={i} className="standings-row skeleton-row">
      <div className="skeleton-line short" />
      <div className="skeleton-line" />
    </div>
  ));
}

function DriverRow({ driver, year }) {
  const [expanded, setExpanded] = useState(false);
  const [raceResults, setRaceResults] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const teamColor = getTeamColour(driver.Constructors?.[0]?.name || '');
  const driverId = driver.Driver?.driverId;
  const driverName = `${driver.Driver?.givenName || ''} ${driver.Driver?.familyName || ''}`;
  const nationality = driver.Driver?.nationality || '';

  const handleExpand = useCallback(async () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    
    if (newExpanded && raceResults.length === 0 && driverId) {
      setLoadingDetail(true);
      try {
        const data = await fetchDriverSeasonResults(year, driverId);
        const races = data?.MRData?.RaceTable?.Races || [];
        setRaceResults(races);
      } catch (err) {
        console.error('Failed to load driver results:', err);
      } finally {
        setLoadingDetail(false);
      }
    }
  }, [expanded, raceResults.length, driverId, year]);

  // Build cumulative points data for the line chart
  const cumulativeData = raceResults.reduce((acc, race) => {
    const pts = parseFloat(race.Results?.[0]?.points || 0);
    const prevTotal = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
    acc.push({
      round: `R${race.round}`,
      race: race.raceName?.replace(' Grand Prix', '') || `R${race.round}`,
      points: pts,
      cumulative: prevTotal + pts,
    });
    return acc;
  }, []);

  return (
    <>
      <div 
        className={`standings-row ${expanded ? 'expanded' : ''}`}
        onClick={handleExpand}
        style={{ borderLeft: `4px solid ${teamColor}` }}
      >
        <div className="pos">{driver.position}</div>
        <div className="driver-info">
          <span className="name">{driverName}</span>
          <span className="team" style={{ color: teamColor }}>{driver.Constructors?.[0]?.name || ''}</span>
        </div>
        <div className="nationality">{getCountryFlag(nationality)}</div>
        <div className="wins">{driver.wins}</div>
        <div className="points">{driver.points}</div>
        <div className="expand-icon">{expanded ? '▲' : '▼'}</div>
      </div>
      
      {expanded && (
        <div className="standings-expanded-detail glass-card">
          {loadingDetail ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <div className="skeleton-line" style={{ width: '60%', margin: '0 auto' }} />
            </div>
          ) : (
            <div className="detail-grid">
              {/* Race results table */}
              <div className="mini-table-container">
                <h4>Race by Race Results</h4>
                {raceResults.length > 0 ? (
                  <table className="mini-table">
                    <thead>
                      <tr>
                        <th>Rnd</th>
                        <th>Race</th>
                        <th>Grid</th>
                        <th>Pos</th>
                        <th>Pts</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {raceResults.map(race => {
                        const result = race.Results?.[0];
                        const isDNF = result?.status && result.status !== 'Finished' && !result.status.startsWith('+');
                        return (
                          <tr key={race.round} className={isDNF ? 'dnf-row' : ''}>
                            <td>{race.round}</td>
                            <td>{race.raceName?.replace(' Grand Prix', '') || ''}</td>
                            <td>{result?.grid || '—'}</td>
                            <td>{result?.position || '—'}</td>
                            <td className="pts-cell">{result?.points || '0'}</td>
                            <td className={isDNF ? 'status-dnf' : 'status-ok'}>
                              {isDNF ? 'DNF' : '✓'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p className="no-data">No race results available.</p>
                )}
              </div>
              
              {/* Points charts */}
              {cumulativeData.length > 0 && (
                <div className="points-chart-container">
                  <h4>Points per Race</h4>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={cumulativeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="round" stroke="rgba(255,255,255,0.4)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 9 }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: 'rgba(255,255,255,0.1)'}} contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '8px' }} />
                      <Bar dataKey="points" fill={teamColor} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  <h4 style={{ marginTop: '16px' }}>Cumulative Points</h4>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={cumulativeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="round" stroke="rgba(255,255,255,0.4)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 9 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '8px' }} />
                      <Line type="monotone" dataKey="cumulative" stroke={teamColor} strokeWidth={3} dot={{ r: 3, fill: teamColor }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

function ConstructorRow({ team }) {
  const teamColor = getTeamColour(team.Constructor?.name || '');
  
  return (
    <div className="standings-row" style={{ borderLeft: `4px solid ${teamColor}` }}>
      <div className="pos">{team.position}</div>
      <div className="driver-info">
        <span className="name">{team.Constructor?.name || ''}</span>
        <span className="team" style={{ color: teamColor }}>{team.Constructor?.nationality || ''}</span>
      </div>
      <div className="nationality">{getCountryFlag(team.Constructor?.nationality || '')}</div>
      <div className="wins">{team.wins}</div>
      <div className="points">{team.points}</div>
    </div>
  );
}

export default function Standings() {
  const [activeTab, setActiveTab] = useState('drivers');
  const [year, setYear] = useState(CURRENT_SEASON);
  const [drivers, setDrivers] = useState([]);
  const [constructors, setConstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roundInfo, setRoundInfo] = useState('');
  const abortRef = useRef(null);

  const loadStandings = useCallback(async (selectedYear) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const [driverData, constructorData] = await Promise.all([
        fetchDriverStandings(selectedYear, controller.signal),
        fetchConstructorStandings(selectedYear, controller.signal),
      ]);

      const driverList = driverData?.MRData?.StandingsTable?.StandingsLists?.[0];
      setDrivers(driverList?.DriverStandings || []);
      
      const constructorList = constructorData?.MRData?.StandingsTable?.StandingsLists?.[0];
      setConstructors(constructorList?.ConstructorStandings || []);

      // Round info
      const round = driverList?.round;
      const season = driverList?.season;
      if (round && season) {
        setRoundInfo(`After Round ${round}`);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStandings(year);
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, [year, loadStandings]);

  return (
    <div className="standings-page page-container">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">🏆 Championship Standings</h1>
          <p className="page-subtitle">{year} Season {roundInfo && `• ${roundInfo}`}</p>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Year selector */}
          <div className="year-selector">
            <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          
          {/* Tab selector */}
          <div className="tabs-container filter-tabs">
            <button 
              className={`filter-btn ${activeTab === 'drivers' ? 'active' : ''}`}
              onClick={() => setActiveTab('drivers')}
            >
              Drivers
            </button>
            <button 
              className={`filter-btn ${activeTab === 'constructors' ? 'active' : ''}`}
              onClick={() => setActiveTab('constructors')}
            >
              Constructors
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-banner glass-card">
          <p>Failed to load standings.</p>
          <button className="action-button secondary" onClick={() => loadStandings(year)}>Retry</button>
        </div>
      )}

      <div className="standings-table-container glass-card">
        <div className="table-header-row">
          <div className="pos">Pos</div>
          <div className="driver-info">Competitor</div>
          <div className="nationality"></div>
          <div className="wins">Wins</div>
          <div className="points">Pts</div>
          {activeTab === 'drivers' && <div className="expand-icon"></div>}
        </div>
        
        <div className="table-content">
          {loading ? <SkeletonRows /> : (
            activeTab === 'drivers' ? (
              drivers.map(driver => (
                <DriverRow key={driver.Driver?.driverId || driver.position} driver={driver} year={year} />
              ))
            ) : (
              constructors.map(team => (
                <ConstructorRow key={team.Constructor?.constructorId || team.position} team={team} />
              ))
            )
          )}
          {!loading && activeTab === 'drivers' && drivers.length === 0 && (
            <p className="empty-state">No driver standings available for {year}.</p>
          )}
          {!loading && activeTab === 'constructors' && constructors.length === 0 && (
            <p className="empty-state">No constructor standings available for {year}.</p>
          )}
        </div>
      </div>
    </div>
  );
}
