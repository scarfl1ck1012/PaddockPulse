import { useLastRaceResults } from '../../hooks/useF1Data';
import { LoadingSkeleton } from '../../components/Common/Common';
import { getTeamColour, getCountryFlag } from '../../api/constants';
import './Results.css';

export default function Results() {
  const { data: raceData, isLoading } = useLastRaceResults();
  const results = raceData?.Results || [];
  const podium = results.slice(0, 3);
  const fastestLap = results.find(r => r.FastestLap?.rank === '1');

  return (
    <div className="page-container" id="results-page">
      <div className="page-header">
        <h1 className="page-title">🏁 Race Results</h1>
        <p className="page-subtitle">
          {raceData ? `${raceData.raceName} — ${raceData.Circuit?.circuitName}` : 'Latest race results'}
        </p>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={10} />
      ) : results.length === 0 ? (
        <div className="results-empty glass-card">
          <div className="results-empty-icon">🏁</div>
          <h3>No Results</h3>
          <p>Race results will appear after the first race of the season.</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          <div className="podium-section">
            <div className="podium stagger-children">
              {/* P2 */}
              {podium[1] && (
                <div className="podium-block podium-2">
                  <div className="podium-driver">
                    <div className="podium-pos">2</div>
                    <div className="podium-team-bar" style={{ background: getTeamColour(podium[1].Constructor?.constructorId) }} />
                    <h3 className="podium-name">{podium[1].Driver?.givenName} <strong>{podium[1].Driver?.familyName}</strong></h3>
                    <p className="podium-team">{podium[1].Constructor?.name}</p>
                    <p className="podium-time">{podium[1].Time?.time || podium[1].status}</p>
                  </div>
                  <div className="podium-stand podium-stand-2"></div>
                </div>
              )}
              {/* P1 */}
              {podium[0] && (
                <div className="podium-block podium-1">
                  <div className="podium-driver">
                    <div className="podium-pos podium-pos-gold">1</div>
                    <div className="podium-team-bar" style={{ background: getTeamColour(podium[0].Constructor?.constructorId) }} />
                    <h3 className="podium-name">{podium[0].Driver?.givenName} <strong>{podium[0].Driver?.familyName}</strong></h3>
                    <p className="podium-team">{podium[0].Constructor?.name}</p>
                    <p className="podium-time">{podium[0].Time?.time || ''}</p>
                  </div>
                  <div className="podium-stand podium-stand-1"></div>
                </div>
              )}
              {/* P3 */}
              {podium[2] && (
                <div className="podium-block podium-3">
                  <div className="podium-driver">
                    <div className="podium-pos">3</div>
                    <div className="podium-team-bar" style={{ background: getTeamColour(podium[2].Constructor?.constructorId) }} />
                    <h3 className="podium-name">{podium[2].Driver?.givenName} <strong>{podium[2].Driver?.familyName}</strong></h3>
                    <p className="podium-team">{podium[2].Constructor?.name}</p>
                    <p className="podium-time">{podium[2].Time?.time || podium[2].status}</p>
                  </div>
                  <div className="podium-stand podium-stand-3"></div>
                </div>
              )}
            </div>
          </div>

          {/* Fastest Lap */}
          {fastestLap && (
            <div className="fastest-lap glass-card stagger-children">
              <span className="fastest-lap-badge">⚡ FASTEST LAP</span>
              <div className="fastest-lap-info">
                <div className="fastest-lap-team-bar" style={{ background: getTeamColour(fastestLap.Constructor?.constructorId) }} />
                <span className="fastest-lap-driver">{fastestLap.Driver?.givenName} {fastestLap.Driver?.familyName}</span>
                <span className="fastest-lap-time">{fastestLap.FastestLap?.Time?.time}</span>
                <span className="fastest-lap-detail">Lap {fastestLap.FastestLap?.lap} · Avg {fastestLap.FastestLap?.AverageSpeed?.speed} {fastestLap.FastestLap?.AverageSpeed?.units}</span>
              </div>
            </div>
          )}

          {/* Full Results Table */}
          <div className="results-table-wrapper glass-card">
            <table className="results-table">
              <thead>
                <tr>
                  <th>POS</th>
                  <th></th>
                  <th>DRIVER</th>
                  <th>TEAM</th>
                  <th>TIME / STATUS</th>
                  <th>PTS</th>
                  <th>LAPS</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => {
                  const teamColour = getTeamColour(r.Constructor?.constructorId);
                  const isFastest = r.FastestLap?.rank === '1';
                  return (
                    <tr key={i} className={`results-row ${i < 3 ? 'podium-row' : ''} ${isFastest ? 'fastest-row' : ''}`}>
                      <td className="res-pos">
                        {r.position}
                      </td>
                      <td>
                        <div className="res-team-bar" style={{ background: teamColour }} />
                      </td>
                      <td className="res-driver">
                        <span className="res-given">{r.Driver?.givenName}</span>{' '}
                        <strong className="res-family">{r.Driver?.familyName}</strong>
                        {r.Driver?.code && <span className="res-code">{r.Driver.code}</span>}
                      </td>
                      <td className="res-team">{r.Constructor?.name}</td>
                      <td className="res-time">
                        {r.Time?.time || r.status}
                        {isFastest && <span className="fastest-indicator">⚡</span>}
                      </td>
                      <td className="res-points">{r.points}</td>
                      <td className="res-laps">{r.laps}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
