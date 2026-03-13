import React, { useEffect, useState } from 'react';
import { fetchConstructorStandings, fetchSeasonResults } from '../../api/jolpica';
import { getTeamColour } from '../../utils/teamColours';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

const ConstructorStandings = ({ year }) => {
  const [standings, setStandings] = useState([]);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [teamResults, setTeamResults] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // For constructors, getting per-race breakdown is a bit tricky with Ergast.
  // One way is fetching all season results and grouping by team when a team is expanded.
  const [allSeasonResults, setAllSeasonResults] = useState(null);

  useEffect(() => {
    const loadStandings = async () => {
      setIsLoading(true);
      const data = await fetchConstructorStandings(year);
      if (data?.MRData?.StandingsTable?.StandingsLists?.[0]) {
        setStandings(data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings);
      } else {
        setStandings([]);
      }
      setIsLoading(false);
      setExpandedTeam(null);
    };
    loadStandings();
  }, [year]);

  const handleExpand = async (constructorId) => {
    if (expandedTeam === constructorId) {
      setExpandedTeam(null);
      return;
    }
    setExpandedTeam(constructorId);

    // If we haven't loaded the full season results yet to parse out the team data
    if (!allSeasonResults) {
      const res = await fetchSeasonResults(year);
      if (res?.MRData?.RaceTable?.Races) {
        setAllSeasonResults(res.MRData.RaceTable.Races);
        processTeamResults(constructorId, res.MRData.RaceTable.Races);
      }
    } else {
      processTeamResults(constructorId, allSeasonResults);
    }
  };

  const processTeamResults = (constructorId, racesData) => {
      if (teamResults[constructorId]) return; // already processed

      const results = racesData.map(race => {
          const teamRaces = race.Results.filter(r => r.Constructor.constructorId === constructorId);
          // calculate combined points
          const totalPoints = teamRaces.reduce((sum, r) => sum + parseFloat(r.points), 0);
          return {
              round: race.round,
              raceName: race.raceName,
              totalPoints,
              drivers: teamRaces.map(r => ({ name: r.Driver.familyName, points: r.points, pos: r.positionText }))
          };
      });

      setTeamResults(prev => ({ ...prev, [constructorId]: results }));
  };

  if (isLoading) return <div>Loading Constructor Standings...</div>;

  return (
    <div className="standings-table-container">
      <table className="standings-table">
        <thead>
          <tr>
            <th>POS</th>
            <th>CONSTRUCTOR</th>
            <th>NATIONALITY</th>
            <th>POINTS</th>
            <th>WINS</th>
          </tr>
        </thead>
        <tbody>
          {standings.length === 0 ? (
            <tr>
              <td colSpan="5" style={{textAlign: "center", padding: "40px", color: "var(--text-secondary)"}}>
                No constructor standings available for {year} yet.
              </td>
            </tr>
          ) : standings.map(team => {
            const constructorId = team.Constructor.constructorId;
            const isExpanded = expandedTeam === constructorId;
            const resData = teamResults[constructorId] || [];
            const teamCol = getTeamColour(team.Constructor.name);

            return (
              <React.Fragment key={constructorId}>
                <tr 
                  className="standings-row" 
                  style={{ borderLeft: `4px solid ${teamCol}` }}
                  onClick={() => handleExpand(constructorId)}
                >
                  <td>{team.position}</td>
                  <td><strong>{team.Constructor.name}</strong></td>
                  <td>{team.Constructor.nationality}</td>
                  <td>{team.points}</td>
                  <td>{team.wins}</td>
                </tr>
                
                {isExpanded && (
                  <tr className="driver-detail-row">
                    <td colSpan="5">
                      <div className="detail-pnl animate-slide-in">
                        
                        <div className="detail-table-outer">
                          <h4>{year} TEAM BREAKDOWN</h4>
                          {resData.length > 0 ? (
                            <table className="detail-results-table">
                              <thead>
                                <tr>
                                  <th>RND</th>
                                  <th>GRAND PRIX</th>
                                  <th>TEAM PTS</th>
                                  <th>WATCH</th>
                                </tr>
                              </thead>
                              <tbody>
                                {resData.map(r => (
                                  <tr key={r.round}>
                                    <td>{r.round}</td>
                                    <td>{r.raceName}</td>
                                    <td><strong>{r.totalPoints}</strong></td>
                                    <td>
                                      <Link to={`/recap?year=${year}&round=${r.round}`} className="btn-watch">Replay Race</Link>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div>Loading team data...</div>
                          )}
                        </div>

                        <div className="detail-chart-outer">
                          <h4>POINTS PER RACE</h4>
                          {resData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                              <BarChart data={resData}>
                                <XAxis dataKey="round" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
                                  cursor={{fill: 'rgba(255, 255, 255, 0.1)'}}
                                  formatter={(value, name, props) => [value + ' pts', props.payload.raceName]}
                                />
                                <Bar dataKey="totalPoints" fill={teamCol} radius={[4, 4, 0, 0]} />
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

export default ConstructorStandings;
