import { useState } from 'react';
import { useDriverStandings, useOpenF1Drivers } from '../../hooks/useF1Data';
import { LoadingSkeleton, ErrorState, SeasonSelector } from '../../components/Common/Common';
import { getTeamColour, CURRENT_SEASON } from '../../api/constants';
import './DriverStandings.css';

export default function DriverStandings() {
  const [season, setSeason] = useState(String(CURRENT_SEASON));
  const { data: standings, isLoading, error, refetch } = useDriverStandings(season);
  const { data: openf1Drivers } = useOpenF1Drivers();

  // Build headshot map from OpenF1
  const headshotMap = {};
  if (openf1Drivers) {
    openf1Drivers.forEach(d => {
      if (d.name_acronym) headshotMap[d.name_acronym] = d.headshot_url;
    });
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={refetch} />;
  }

  return (
    <div className="page-container" id="driver-standings-page">
      <div className="page-header">
        <div className="standings-header-row">
          <div>
            <h1 className="page-title">Driver Standings</h1>
            <p className="page-subtitle">Championship points and positions</p>
          </div>
          <SeasonSelector value={season} onChange={setSeason} />
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={10} />
      ) : standings?.length === 0 ? (
        <ErrorState message={`No driver standings found for ${season}`} />
      ) : (
        <div className="standings-table-wrapper">
          <table className="standings-table" id="driver-standings-table">
            <thead>
              <tr>
                <th className="col-pos">POS</th>
                <th className="col-driver">Driver</th>
                <th className="col-team">Team</th>
                <th className="col-wins">Wins</th>
                <th className="col-points">Points</th>
                <th className="col-bar"></th>
              </tr>
            </thead>
            <tbody className="stagger-children">
              {standings?.map((d, idx) => {
                const maxPoints = standings[0]?.points || 1;
                const pctWidth = (d.points / maxPoints) * 100;
                const teamColor = getTeamColour(d.Constructors?.[0]?.constructorId);
                const driverCode = d.Driver?.code;
                const headshot = headshotMap[driverCode];

                return (
                  <tr key={d.Driver?.driverId || idx} className="standings-row">
                    <td className="col-pos">
                      <span className={`pos-number ${idx < 3 ? 'pos-podium' : ''}`}>
                        {d.position}
                      </span>
                    </td>
                    <td className="col-driver">
                      <div className="driver-cell">
                        <div className="team-color-bar" style={{ background: teamColor, height: 36 }} />
                        {headshot && Number(season) >= 2023 && (
                          <img
                            src={headshot}
                            alt={d.Driver?.familyName}
                            className="driver-headshot"
                            loading="lazy"
                          />
                        )}
                        <div className="driver-name-group">
                          <span className="driver-first">{d.Driver?.givenName}</span>
                          <span className="driver-last">{d.Driver?.familyName}</span>
                        </div>
                        {driverCode && (
                          <span className="driver-code">{driverCode}</span>
                        )}
                      </div>
                    </td>
                    <td className="col-team">
                      <span className="team-name">{d.Constructors?.[0]?.name}</span>
                    </td>
                    <td className="col-wins">{d.wins}</td>
                    <td className="col-points">
                      <span className="points-value">{d.points}</span>
                    </td>
                    <td className="col-bar">
                      <div className="points-bar-track">
                        <div
                          className="points-bar-fill"
                          style={{ width: `${pctWidth}%`, background: teamColor }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
