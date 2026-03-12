import { useParams, Link } from 'react-router-dom';
import { useRaceResults } from '../../hooks/useF1Data';
import { LoadingSkeleton, ErrorState } from '../../components/Common/Common';
import { getTeamColour, getCountryFlag } from '../../api/constants';
import dayjs from 'dayjs';
import './RaceDetail.css';

export default function RaceDetail() {
  const { season, round } = useParams();
  const { data: race, isLoading, error, refetch } = useRaceResults(season, round);

  if (error) {
    return (
      <div className="page-container">
        <ErrorState message={error.message} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="page-container" id="race-detail-page">
      <Link to="/schedule" className="back-link" id="back-to-schedule">← Back to Schedule</Link>

      {isLoading ? (
        <LoadingSkeleton rows={10} />
      ) : !race ? (
        <ErrorState message="Race results not available" />
      ) : (
        <>
          <div className="race-detail-header">
            <div className="race-detail-meta">
              <span className="race-round-badge">ROUND {race.round}</span>
              <span className="race-detail-flag">{getCountryFlag(race.Circuit?.Location?.country)}</span>
            </div>
            <h1 className="page-title">{race.raceName}</h1>
            <p className="page-subtitle">
              {race.Circuit?.circuitName} — {dayjs(race.date).format('D MMMM YYYY')}
            </p>
          </div>

          {/* Podium Card */}
          {race.Results?.length >= 3 && (
            <div className="podium-row stagger-children" id="podium">
              {[1, 0, 2].map((i) => {
                const r = race.Results[i];
                const teamColor = getTeamColour(r.Constructor?.constructorId);
                return (
                  <div
                    key={r.Driver?.driverId}
                    className={`podium-card glass-card podium-${i + 1}`}
                  >
                    <span className="podium-pos">{r.position}</span>
                    <div className="podium-color-bar" style={{ background: teamColor }} />
                    <h3 className="podium-name">
                      {r.Driver?.givenName?.charAt(0)}. {r.Driver?.familyName}
                    </h3>
                    <p className="podium-team">{r.Constructor?.name}</p>
                    <p className="podium-time">{r.Time?.time || r.status}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Results Table */}
          <div className="results-table-wrapper">
            <table className="standings-table results-table" id="race-results-table">
              <thead>
                <tr>
                  <th className="col-pos">POS</th>
                  <th className="col-driver">Driver</th>
                  <th className="col-team">Team</th>
                  <th>Time / Status</th>
                  <th>Laps</th>
                  <th>Grid</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody className="stagger-children">
                {race.Results?.map((r, idx) => {
                  const teamColor = getTeamColour(r.Constructor?.constructorId);
                  const gained = r.grid && r.position
                    ? Number(r.grid) - Number(r.position)
                    : 0;

                  return (
                    <tr key={r.Driver?.driverId || idx} className="standings-row">
                      <td className="col-pos">
                        <span className={`pos-number ${idx < 3 ? 'pos-podium' : ''}`}>
                          {r.position}
                        </span>
                      </td>
                      <td className="col-driver">
                        <div className="driver-cell">
                          <div className="team-color-bar" style={{ background: teamColor, height: 28 }} />
                          <div className="driver-name-group">
                            <span className="driver-first">{r.Driver?.givenName}</span>
                            <span className="driver-last">{r.Driver?.familyName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="col-team">
                        <span className="team-name">{r.Constructor?.name}</span>
                      </td>
                      <td>
                        <span className="result-time">
                          {r.Time?.time || r.status}
                        </span>
                      </td>
                      <td className="result-laps">{r.laps}</td>
                      <td className="result-grid">
                        <span className="grid-pos">{r.grid}</span>
                        {gained !== 0 && (
                          <span className={`grid-change ${gained > 0 ? 'grid-gain' : 'grid-loss'}`}>
                            {gained > 0 ? `+${gained}` : gained}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`result-points ${Number(r.points) > 0 ? 'has-points' : ''}`}>
                          {r.points}
                        </span>
                      </td>
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
