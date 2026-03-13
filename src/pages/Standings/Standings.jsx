import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getTeamColour } from '../../utils/teamColours';
import './Standings.css';

// Mock Data for structural compliance
const DUMMY_DRIVERS = [
  { pos: 1, name: 'Max Verstappen', acronym: 'VER', team: 'Red Bull Racing', points: 395, wins: 15 },
  { pos: 2, name: 'Lando Norris', acronym: 'NOR', team: 'McLaren', points: 340, wins: 4 },
  { pos: 3, name: 'Charles Leclerc', acronym: 'LEC', team: 'Ferrari', points: 310, wins: 3 },
];

const DUMMY_CONSTRUCTORS = [
  { pos: 1, name: 'McLaren', points: 512, wins: 5 },
  { pos: 2, name: 'Ferrari', points: 490, wins: 5 },
  { pos: 3, name: 'Red Bull Racing', points: 450, wins: 15 },
];

const DUMMY_RACEDATA = [
  { round: 1, race: 'BHR', pos: 1, points: 26 },
  { round: 2, race: 'SAU', pos: 1, points: 25 },
  { round: 3, race: 'AUS', pos: 3, points: 15 },
  { round: 4, race: 'JPN', pos: 1, points: 26 },
];

const DriverRow = ({ driver }) => {
  const [expanded, setExpanded] = useState(false);
  const teamColor = getTeamColour(driver.team);

  return (
    <>
      <div 
        className={`standings-row ${expanded ? 'expanded' : ''}`}
        onClick={() => setExpanded(!expanded)}
        style={{ borderLeft: `4px solid ${teamColor}` }}
      >
        <div className="pos">{driver.pos}</div>
        <div className="driver-info">
          <span className="name">{driver.name}</span>
          <span className="team">{driver.team}</span>
        </div>
        <div className="wins">{driver.wins}</div>
        <div className="points">{driver.points}</div>
        <div className="expand-icon">{expanded ? '▲' : '▼'}</div>
      </div>
      
      {expanded && (
        <div className="standings-expanded-detail glass-card">
          <div className="detail-grid">
            {/* Inline Mini-Table */}
            <div className="mini-table-container">
              <h4>Race by Race Results</h4>
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>Rnd</th>
                    <th>Race</th>
                    <th>Pos</th>
                    <th>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {DUMMY_RACEDATA.map(r => (
                    <tr key={r.round}>
                      <td>{r.round}</td>
                      <td>{r.race}</td>
                      <td>{r.pos}</td>
                      <td className="pts-cell">{r.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="action-button secondary mt-2" style={{width: '100%'}}>
                Watch Driver Replay 🎬
              </button>
            </div>
            
            {/* Recharts BarChart visualizing point accrual */}
            <div className="points-chart-container">
              <h4>Points Accrual</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={DUMMY_RACEDATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="race" stroke="rgba(255,255,255,0.4)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.1)'}} contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '8px' }} />
                  <Bar dataKey="points" fill={teamColor} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const ConstructorRow = ({ team }) => {
  const teamColor = getTeamColour(team.name);
  
  return (
    <div className="standings-row" style={{ borderLeft: `4px solid ${teamColor}` }}>
      <div className="pos">{team.pos}</div>
      <div className="driver-info">
        <span className="name">{team.name}</span>
      </div>
      <div className="wins">{team.wins}</div>
      <div className="points">{team.points}</div>
    </div>
  );
};

export default function Standings() {
  const [activeTab, setActiveTab] = useState('drivers');

  return (
    <div className="standings-page page-container">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">🏆 Championship Standings</h1>
          <p className="page-subtitle">2026 Season</p>
        </div>
        
        {/* Strict Tabs implementation */}
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

      <div className="standings-table-container glass-card">
        <div className="table-header-row">
          <div className="pos">Pos</div>
          <div className="driver-info">Competitor</div>
          <div className="wins">Wins</div>
          <div className="points">Pts</div>
          {activeTab === 'drivers' && <div className="expand-icon"></div>}
        </div>
        
        <div className="table-content">
          {activeTab === 'drivers' ? (
            DUMMY_DRIVERS.map(driver => <DriverRow key={driver.acronym} driver={driver} />)
          ) : (
            DUMMY_CONSTRUCTORS.map(team => <ConstructorRow key={team.name} team={team} />)
          )}
        </div>
      </div>
    </div>
  );
}
