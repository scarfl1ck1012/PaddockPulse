import { useState } from 'react';
import { useConstructorStandings } from '../../hooks/useF1Data';
import { LoadingSkeleton, ErrorState, SeasonSelector } from '../../components/Common/Common';
import { getTeamColour, CURRENT_SEASON } from '../../api/constants';
import './ConstructorStandings.css';

export default function ConstructorStandings() {
  const [season, setSeason] = useState(String(CURRENT_SEASON));
  const { data: standings, isLoading, error, refetch } = useConstructorStandings(season);

  if (error) {
    return <ErrorState message={error.message} onRetry={refetch} />;
  }

  const maxPoints = standings?.[0]?.points ? Number(standings[0].points) : 1;

  return (
    <div className="page-container" id="constructor-standings-page">
      <div className="page-header">
        <div className="standings-header-row">
          <div>
            <h1 className="page-title">Constructor Standings</h1>
            <p className="page-subtitle">Team championship points</p>
          </div>
          <SeasonSelector value={season} onChange={setSeason} />
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={10} />
      ) : standings?.length === 0 ? (
        <ErrorState message={`No constructor standings found for ${season}`} />
      ) : (
        <div className="constructor-list stagger-children">
          {standings?.map((c, idx) => {
            const teamColor = getTeamColour(c.Constructor?.constructorId);
            const pctWidth = (Number(c.points) / maxPoints) * 100;

            return (
              <div key={c.Constructor?.constructorId || idx} className="constructor-card glass-card">
                <div className="constructor-pos">
                  <span className={`pos-number ${idx < 3 ? 'pos-podium' : ''}`}>
                    {c.position}
                  </span>
                </div>

                <div className="constructor-color-stripe" style={{ background: teamColor }} />

                <div className="constructor-info">
                  <div className="constructor-name-row">
                    <h3 className="constructor-name">{c.Constructor?.name}</h3>
                    <span className="constructor-nationality">{c.Constructor?.nationality}</span>
                  </div>
                  <div className="constructor-bar-wrapper">
                    <div className="constructor-bar-track">
                      <div
                        className="constructor-bar-fill"
                        style={{ width: `${pctWidth}%`, background: teamColor }}
                      />
                    </div>
                  </div>
                </div>

                <div className="constructor-stats">
                  <div className="constructor-stat">
                    <span className="constructor-stat-value">{c.points}</span>
                    <span className="constructor-stat-label">PTS</span>
                  </div>
                  <div className="constructor-stat">
                    <span className="constructor-stat-value">{c.wins}</span>
                    <span className="constructor-stat-label">WINS</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
