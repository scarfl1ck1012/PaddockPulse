import React, { useEffect, useState } from 'react';
import { fetchDriverStandings, fetchDriverSeasonResults } from '../../api/jolpica';
import { getTeamColour } from '../../utils/teamColours';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

const DriverStandings = ({ year }) => {
  const [standings, setStandings] = useState([]);
  const [expandedDriver, setExpandedDriver] = useState(null);
  const [driverResults, setDriverResults] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStandings = async () => {
      setIsLoading(true);
      const data = await fetchDriverStandings(year);
      if (data?.MRData?.StandingsTable?.StandingsLists?.[0]) {
        setStandings(data.MRData.StandingsTable.StandingsLists[0].DriverStandings);
      } else {
        setStandings([]);
      }
      setIsLoading(false);
      setExpandedDriver(null);
    };
    loadStandings();
  }, [year]);

  const handleExpand = async (driverId) => {
    if (expandedDriver === driverId) {
      setExpandedDriver(null);
      return;
    }
    setExpandedDriver(driverId);
    
    if (!driverResults[driverId]) {
      const res = await fetchDriverSeasonResults(year, driverId);
      if (res?.MRData?.RaceTable?.Races) {
        setDriverResults(prev => ({ ...prev, [driverId]: res.MRData.RaceTable.Races }));
      }
    }
  };

  if (isLoading) return <div>Loading Driver Standings...</div>;

  return (
    <div className="standings-table-container">
      <table className="standings-table">
        <thead>
          <tr>
            <th>POS</th>
            <th>DRIVER</th>
            <th>NATIONALITY</th>
            <th>TEAM</th>
            <th>POINTS</th>
            <th>WINS</th>
          </tr>
        </thead>
        <tbody>
          {standings.map(driver => {
            const isExpanded = expandedDriver === driver.Driver.driverId;
            const resData = driverResults[driver.Driver.driverId] || [];
            const constructor = driver.Constructors[0];
            const teamCol = getTeamColour(constructor?.name);

            // Prepare chart data
            const chartData = resData.map(r => ({
              round: r.round,
              raceName: r.raceName,
              points: parseFloat(r.Results[0].points)
            }));

            return (
              <React.Fragment key={driver.Driver.driverId}>
                <tr 
                  className="standings-row" 
                  style={{ borderLeft: `4px solid ${teamCol}` }}
                  onClick={() => handleExpand(driver.Driver.driverId)}
                >
                  <td>{driver.position}</td>
                  <td>{driver.Driver.givenName} {driver.Driver.familyName}</td>
                  <td>{driver.Driver.nationality}</td>
                  <td>{constructor?.name || '-'}</td>
                  <td>{driver.points}</td>
                  <td>{driver.wins}</td>
                </tr>
                
                {isExpanded && (
                  <tr className="driver-detail-row">
                    <td colSpan="6">
                      <div className="detail-pnl animate-slide-in">
                        
                        <div className="detail-table-outer">
                          <h4>{year} RACE RESULTS</h4>
                          {resData.length > 0 ? (
                            <table className="detail-results-table">
                              <thead>
                                <tr>
                                  <th>RND</th>
                                  <th>GRAND PRIX</th>
                                  <th>GRID</th>
                                  <th>FINISH</th>
                                  <th>PTS</th>
                                  <th>STATUS</th>
                                  <th></th>
                                </tr>
                              </thead>
                              <tbody>
                                {resData.map(r => {
                                  const result = r.Results[0];
                                  return (
                                    <tr key={r.round}>
                                      <td>{r.round}</td>
                                      <td>{r.raceName}</td>
                                      <td>{result.grid}</td>
                                      <td>{result.positionText}</td>
                                      <td>{result.points}</td>
                                      <td>{result.status}</td>
                                      <td>
                                        <Link to={`/recap?year=${year}&round=${r.round}`} className="btn-watch">Replay</Link>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          ) : (
                            <div>Loading results...</div>
                          )}
                        </div>

                        <div className="detail-chart-outer">
                          <h4>POINTS PER RACE</h4>
                          {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                              <BarChart data={chartData}>
                                <XAxis dataKey="round" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
                                  cursor={{fill: 'rgba(255, 255, 255, 0.1)'}}
                                  formatter={(value, name, props) => [value + ' pts', props.payload.raceName]}
                                />
                                <Bar dataKey="points" fill={teamCol} radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              Loading chart...
                            </div>
                          )}
                        </div>

                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DriverStandings;
