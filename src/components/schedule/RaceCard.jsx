import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCountdown } from '../../hooks/useCountdown';
import { useNotifications } from '../../hooks/useNotifications';
import { dayjs, toIST } from '../../utils/formatters';
import PodiumResult from './PodiumResult';
import './RaceCard.css';

const SessionRow = ({ name, dateString, onRemind }) => {
  const timeLeft = useCountdown(dateString);
  const istTime = toIST(dateString);
  
  // Starting soon (within 30 mins)
  const isStartingSoon = !timeLeft.isExpired && timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes <= 30;

  return (
    <div className={`session-row ${isStartingSoon ? 'starting-soon' : ''}`}>
      <span className="session-name">{name}</span>
      <span className="session-date">{istTime.format('ddd D MMM')}</span>
      <span className="session-time">{istTime.format('HH:mm z')}</span>
      <div className="session-countdown">
        {!timeLeft.isExpired ? (
          <>
            <span>In {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m</span>
            <button className="reminder-btn" onClick={() => onRemind(name, dateString)}>🔔 Set Reminder</button>
          </>
        ) : (
          <span className="completed-text">Completed</span>
        )}
      </div>
    </div>
  );
};

const RaceCard = ({ race, results }) => {
  const { scheduleNotification, requestPermission, permission } = useNotifications();
  const [showResults, setShowResults] = useState(false);

  // Ergast provides FirstPractice, SecondPractice, ThirdPractice, Qualifying, Sprint
  // Format them into an array of sessions
  const sessions = [];
  if (race.FirstPractice) sessions.push({ name: 'FP1', date: `${race.FirstPractice.date}T${race.FirstPractice.time}` });
  if (race.SecondPractice) sessions.push({ name: 'FP2', date: `${race.SecondPractice.date}T${race.SecondPractice.time}` });
  if (race.ThirdPractice) sessions.push({ name: 'FP3', date: `${race.ThirdPractice.date}T${race.ThirdPractice.time}` });
  if (race.Sprint) sessions.push({ name: 'SPRINT', date: `${race.Sprint.date}T${race.Sprint.time}` });
  if (race.Qualifying) sessions.push({ name: 'QUALIFYING', date: `${race.Qualifying.date}T${race.Qualifying.time}` });
  sessions.push({ name: 'RACE', date: `${race.date}T${race.time}` });

  // Sort chronologically
  sessions.sort((a, b) => new Date(a.date) - new Date(b.date));

  const handleRemind = async (sessionName, dateString) => {
    if (permission !== 'granted') {
      await requestPermission();
    }
    scheduleNotification(`${race.raceName} - ${sessionName}`, dateString);
  };

  const isCompleted = new Date(`${race.date}T${race.time}`) < new Date();
  
  const raceDate = dayjs(`${race.date}T${race.time}`);
  const now = dayjs();
  const diffDays = raceDate.diff(now, 'day');
  const isNextRace = !isCompleted && diffDays <= 7 && diffDays >= 0;

  return (
    <div className="race-card">
      {isNextRace && <div className="next-race-ribbon">NEXT RACE</div>}
      
      <div className="race-card-header">
        <div className="race-info">
          <h2>{race.raceName} 🏁</h2>
          <span className="round-badge">ROUND {race.round}</span>
        </div>
        <div className="circuit-name">{race.Circuit.circuitName}</div>
      </div>

      {!isCompleted ? (
        <div className="session-schedule">
          {sessions.map((s, idx) => (
            <SessionRow 
              key={idx} 
              name={s.name} 
              dateString={s.date} 
              onRemind={handleRemind} 
            />
          ))}
        </div>
      ) : (
        <div className="completed-section">
          <PodiumResult results={results} />
          
          <div className="completed-actions">
            <button className="toggle-btn" onClick={() => setShowResults(!showResults)}>
              {showResults ? 'Hide Results' : 'FULL RESULTS'}
            </button>
            <Link to={`/recap?year=${race.season}&round=${race.round}`} className="replay-btn">
              ▶ Watch Replay
            </Link>
          </div>

          {showResults && results && (
            <div className="full-results-table">
              {/* Simple rendered list for layout */}
              {results.slice(3).map((res, idx) => (
                <div key={idx} className="result-row">
                  <span>{res.position}. {res.Driver.familyName}</span>
                  <span>{res.Constructor.name}</span>
                  <span>{res.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RaceCard;
