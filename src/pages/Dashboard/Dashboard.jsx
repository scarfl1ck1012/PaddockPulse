import { Link } from 'react-router-dom';
import { useDriverStandings, useRaceSchedule, useLastRaceResults } from '../../hooks/useF1Data';
import { useOpenF1Weather, useOpenF1RaceControl } from '../../hooks/useF1Data';
import { CountdownTimer, LoadingSkeleton } from '../../components/Common/Common';
import { getTeamColour, getCountryFlag, CURRENT_SEASON } from '../../api/constants';
import dayjs from 'dayjs';
import './Dashboard.css';

const FEATURE_CARDS = [
  { path: '/live', icon: '🔴', label: 'Live Timing', desc: 'Timing tower & session data', color: '#e10600' },
  { path: '/compare', icon: '⚔️', label: 'Head-to-Head', desc: 'Compare two drivers', color: '#f5a623' },
  { path: '/strategy', icon: '🧠', label: 'Strategy', desc: 'Tyre deg & pit analysis', color: '#a855f7' },
  { path: '/radio', icon: '📻', label: 'Team Radio', desc: 'Listen to radio comms', color: '#3b82f6' },
  { path: '/track-map', icon: '🗺️', label: 'Track Map', desc: 'Circuit & positions', color: '#00d97e' },
  { path: '/standings/drivers', icon: '🏆', label: 'Standings', desc: 'Championship tables', color: '#eab308' },
];

export default function Dashboard() {
  const { data: standings, isLoading: loadingStandings } = useDriverStandings('current');
  const { data: schedule, isLoading: loadingSchedule } = useRaceSchedule('current');
  const { data: lastRace, isLoading: loadingLastRace } = useLastRaceResults();
  const { data: weather } = useOpenF1Weather();
  const { data: raceControl } = useOpenF1RaceControl();

  const now = dayjs();
  const nextRace = schedule?.find(race => dayjs(race.date).isAfter(now));
  const leader = standings?.[0];
  const winner = lastRace?.Results?.[0];
  const latestWeather = weather?.[weather.length - 1];
  const latestRC = raceControl?.slice(-3).reverse() || [];

  return (
    <div className="page-container" id="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Your F1 command centre — everything at a glance</p>
      </div>

      {/* Hero Cards Row */}
      <div className="dash-hero-row stagger-children">
        {/* Next Race Card */}
        <div className="dash-card accent-card dash-next-race" id="next-race-card">
          <div className="dash-card-header">
            <span className="dash-card-label">Next Race</span>
            <span className="badge badge-live">UPCOMING</span>
          </div>
          {loadingSchedule ? (
            <LoadingSkeleton rows={1} type="card" />
          ) : nextRace ? (
            <div className="next-race-content">
              <div className="next-race-info">
                <span className="next-race-flag">{getCountryFlag(nextRace.Circuit?.Location?.country)}</span>
                <div>
                  <h2 className="next-race-name">{nextRace.raceName}</h2>
                  <p className="next-race-circuit">{nextRace.Circuit?.circuitName}</p>
                  <p className="next-race-date">{dayjs(nextRace.date).format('D MMMM YYYY')}</p>
                </div>
              </div>
              <CountdownTimer targetDate={nextRace.date + 'T14:00:00'} label="Lights out in" />
            </div>
          ) : (
            <p className="dash-card-empty">Season schedule not available</p>
          )}
        </div>

        {/* Championship Leader */}
        <div className="dash-card glass-card dash-leader" id="champ-leader-card">
          <div className="dash-card-header">
            <span className="dash-card-label">Championship Leader</span>
            <span className="badge">{CURRENT_SEASON}</span>
          </div>
          {loadingStandings ? (
            <LoadingSkeleton rows={1} type="card" />
          ) : leader ? (
            <div className="leader-content">
              <div
                className="leader-color-accent"
                style={{ background: getTeamColour(leader.Constructors?.[0]?.constructorId) }}
              />
              <div className="leader-info">
                <h2 className="leader-name">
                  {leader.Driver?.givenName} <strong>{leader.Driver?.familyName}</strong>
                </h2>
                <p className="leader-team">{leader.Constructors?.[0]?.name}</p>
              </div>
              <div className="leader-stats">
                <div className="leader-stat">
                  <span className="leader-stat-value">{leader.points}</span>
                  <span className="leader-stat-label">PTS</span>
                </div>
                <div className="leader-stat">
                  <span className="leader-stat-value">{leader.wins}</span>
                  <span className="leader-stat-label">WINS</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="dash-card-empty">No standings data</p>
          )}
        </div>
      </div>

      {/* Feature Quick Links */}
      <div className="dash-features stagger-children">
        {FEATURE_CARDS.map(f => (
          <Link key={f.path} to={f.path} className="feature-card glass-card" style={{ '--feature-color': f.color }}>
            <span className="feature-icon">{f.icon}</span>
            <span className="feature-label">{f.label}</span>
            <span className="feature-desc">{f.desc}</span>
          </Link>
        ))}
      </div>

      {/* Info Row — Weather + Race Control + Last Race */}
      <div className="dash-info-row stagger-children">
        {/* Live Session Info */}
        <div className="dash-card glass-card" id="session-info-card">
          <div className="dash-card-header">
            <span className="dash-card-label">Session Conditions</span>
            <Link to="/live" className="dash-card-link">Live Timing →</Link>
          </div>
          {latestWeather ? (
            <div className="dash-weather-row">
              <div className="dash-weather-item">
                <span className="dash-weather-val">{latestWeather.air_temperature}°</span>
                <span className="dash-weather-lbl">Air</span>
              </div>
              <div className="dash-weather-item">
                <span className="dash-weather-val">{latestWeather.track_temperature}°</span>
                <span className="dash-weather-lbl">Track</span>
              </div>
              <div className="dash-weather-item">
                <span className="dash-weather-val">{latestWeather.humidity}%</span>
                <span className="dash-weather-lbl">Humidity</span>
              </div>
              <div className="dash-weather-item">
                <span className="dash-weather-val">{latestWeather.rainfall === 1 ? '🌧️' : '☀️'}</span>
                <span className="dash-weather-lbl">Rain</span>
              </div>
            </div>
          ) : (
            <p className="dash-card-empty">No live session data</p>
          )}
          {latestRC.length > 0 && (
            <div className="dash-rc-preview">
              {latestRC.map((msg, i) => (
                <div key={i} className="dash-rc-msg">
                  <span className="dash-rc-time">{dayjs(msg.date).format('HH:mm')}</span>
                  <span className="dash-rc-text">{msg.message?.slice(0, 60)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Last Race Winner */}
        <div className="dash-card glass-card" id="last-race-card">
          <div className="dash-card-header">
            <span className="dash-card-label">Last Race Winner</span>
            <span className="badge">🏁</span>
          </div>
          {loadingLastRace ? (
            <LoadingSkeleton rows={1} type="card" />
          ) : winner ? (
            <div className="winner-content">
              <div
                className="team-color-bar"
                style={{ background: getTeamColour(winner.Constructor?.constructorId), height: '100%' }}
              />
              <div className="winner-info">
                <p className="winner-race-name">{lastRace?.raceName}</p>
                <h3 className="winner-name">
                  {winner.Driver?.givenName} {winner.Driver?.familyName}
                </h3>
                <p className="winner-team">{winner.Constructor?.name}</p>
                {winner.Time?.time && (
                  <p className="winner-time">{winner.Time.time}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="dash-card-empty">No results available</p>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="dash-grid stagger-children">
        {/* Quick Standings (Top 5) */}
        <div className="dash-card glass-card dash-standings-mini" id="quick-standings-card">
          <div className="dash-card-header">
            <span className="dash-card-label">Driver Standings</span>
            <Link to="/standings/drivers" className="dash-card-link">View All →</Link>
          </div>
          {loadingStandings ? (
            <LoadingSkeleton rows={5} />
          ) : (
            <div className="mini-standings">
              {standings?.slice(0, 5).map((d) => (
                <div key={d.Driver?.driverId} className="mini-standings-row">
                  <span className="mini-pos">{d.position}</span>
                  <div
                    className="team-color-bar"
                    style={{ background: getTeamColour(d.Constructors?.[0]?.constructorId), height: 24 }}
                  />
                  <span className="mini-driver">
                    {d.Driver?.givenName?.charAt(0)}. <strong>{d.Driver?.familyName}</strong>
                  </span>
                  <span className="mini-team">{d.Constructors?.[0]?.name}</span>
                  <span className="mini-points">{d.points}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Races */}
        <div className="dash-card glass-card" id="recent-races-card">
          <div className="dash-card-header">
            <span className="dash-card-label">Season Calendar</span>
            <Link to="/schedule" className="dash-card-link">Full Schedule →</Link>
          </div>
          {loadingSchedule ? (
            <LoadingSkeleton rows={4} />
          ) : (
            <div className="dash-recent-races">
              {schedule?.slice(0, 5).map((race) => {
                const isPast = dayjs(race.date).isBefore(now);
                return (
                  <div key={race.round} className={`dash-race-row ${isPast ? 'race-past' : ''}`}>
                    <span className="dash-race-round">R{race.round}</span>
                    <span className="dash-race-flag">{getCountryFlag(race.Circuit?.Location?.country)}</span>
                    <span className="dash-race-name">{race.raceName?.replace(' Grand Prix', ' GP')}</span>
                    <span className="dash-race-date">{dayjs(race.date).format('D MMM')}</span>
                    {isPast && <span className="dash-race-done">✓</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
