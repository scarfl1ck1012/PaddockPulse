import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRaceSchedule } from '../../hooks/useF1Data';
import { LoadingSkeleton, ErrorState, SeasonSelector } from '../../components/Common/Common';
import { getCountryFlag, CURRENT_SEASON } from '../../api/constants';
import dayjs from 'dayjs';
import './RaceSchedule.css';

export default function RaceSchedule() {
  const [season, setSeason] = useState(String(CURRENT_SEASON));
  const { data: races, isLoading, error, refetch } = useRaceSchedule(season);

  const now = dayjs();

  if (error) {
    return <ErrorState message={error.message} onRetry={refetch} />;
  }

  // Find next race index
  const nextRaceIdx = races?.findIndex(r => dayjs(r.date).isAfter(now)) ?? -1;

  return (
    <div className="page-container" id="race-schedule-page">
      <div className="page-header">
        <div className="standings-header-row">
          <div>
            <h1 className="page-title">Race Calendar</h1>
            <p className="page-subtitle">{season} Formula 1 World Championship</p>
          </div>
          <SeasonSelector value={season} onChange={setSeason} />
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={6} type="card" />
      ) : races?.length === 0 ? (
        <ErrorState message={`No races found for ${season}`} />
      ) : (
        <div className="race-grid stagger-children">
          {races.map((race, idx) => {
            const isPast = dayjs(race.date).isBefore(now);
            const isNext = idx === nextRaceIdx;

            return (
              <div
                key={`${race.season}-${race.round}`}
                className={`race-card glass-card ${isNext ? 'race-card-next' : ''} ${isPast ? 'race-card-past' : ''}`}
                id={`race-card-${race.round}`}
              >
                {isNext && <div className="race-next-badge">NEXT UP</div>}

                <div className="race-card-top">
                  <span className="race-round">ROUND {race.round}</span>
                  <span className="race-flag">{getCountryFlag(race.Circuit?.Location?.country)}</span>
                </div>

                <h3 className="race-card-name">{race.raceName}</h3>
                <p className="race-card-circuit">{race.Circuit?.circuitName}</p>
                <p className="race-card-location">
                  {race.Circuit?.Location?.locality}, {race.Circuit?.Location?.country}
                </p>

                <div className="race-card-bottom">
                  <span className="race-card-date">
                    {dayjs(race.date).format('D MMMM YYYY')}
                  </span>
                  {isPast && (
                    <Link
                      to={`/schedule/${race.season}/${race.round}`}
                      className="btn btn-ghost race-results-btn"
                    >
                      Results →
                    </Link>
                  )}
                  {isNext && (
                    <span className="race-card-countdown">
                      {dayjs(race.date).diff(now, 'day')} days away
                    </span>
                  )}
                </div>

                {isPast && <div className="race-card-checkmark">✓</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
