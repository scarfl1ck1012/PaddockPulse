import React, { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import { getTeamColour } from '../../utils/teamColours';
import { getTyreCompound } from '../../utils/tyrePalette';
import { formatLapTime } from '../../utils/formatters';
import './Compare.css';

// DUMMY DATA FOR COMPLIANCE
const mockDrivers = [
  { id: 1, name: 'Max Verstappen', acronym: 'VER', team: 'Red Bull Racing' },
  { id: 4, name: 'Lando Norris', acronym: 'NOR', team: 'McLaren' }
];

const mockLapData = Array.from({ length: 20 }, (_, i) => ({
  lap: i + 1,
  VER: 82.5 + Math.random() * 2,
  NOR: 82.3 + Math.random() * 2.2
}));

const mockSectorData = [
  { subject: 'Sector 1', VER: 28.1, NOR: 28.3, fullMark: 30 },
  { subject: 'Sector 2', VER: 34.5, NOR: 34.2, fullMark: 40 },
  { subject: 'Sector 3', VER: 19.9, NOR: 19.8, fullMark: 25 },
];

const mockStints = {
  VER: [
    { compound: 'MEDIUM', laps: 18 },
    { compound: 'HARD', laps: 32 }
  ],
  NOR: [
    { compound: 'MEDIUM', laps: 22 },
    { compound: 'HARD', laps: 28 }
  ]
};

export default function Compare() {
  // 3-Step Selection State
  const [year, setYear] = useState('2026');
  const [gp, setGp] = useState('Australian Grand Prix');
  const [session, setSession] = useState('Race');
  
  const [d1, setD1] = useState(mockDrivers[0]);
  const [d2, setD2] = useState(mockDrivers[1]);
  
  const c1 = getTeamColour(d1.team);
  const c2 = getTeamColour(d2.team);

  return (
    <div className="compare-page page-container">
      <div className="page-header">
        <h1 className="page-title">⚔️ Head-to-Head Compare</h1>
        <p className="page-subtitle">Analyze lap pace, sectors, and strategies</p>
      </div>

      {/* Strict 3-Step Session Selector */}
      <div className="session-selector-panel glass-card">
        <div className="selector-group">
          <label>1. Year</label>
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            <option>2026</option>
            <option>2025</option>
            <option>2024</option>
          </select>
        </div>
        <div className="selector-group">
          <label>2. Grand Prix</label>
          <select value={gp} onChange={(e) => setGp(e.target.value)}>
            <option>Australian Grand Prix</option>
            <option>Japanese Grand Prix</option>
          </select>
        </div>
        <div className="selector-group">
          <label>3. Session</label>
          <select value={session} onChange={(e) => setSession(e.target.value)}>
            <option>Race</option>
            <option>Qualifying</option>
            <option>Sprint</option>
          </select>
        </div>
        <button className="action-button primary" style={{marginTop: 'auto'}}>Load Data</button>
      </div>

      {/* Driver Selectors */}
      <div className="compare-drivers-header">
        <div className="driver-picker glass-card" style={{ borderTop: `4px solid ${c1}` }}>
           <h3>{d1.name}</h3>
           <span className="driver-team">{d1.team}</span>
        </div>
        <div className="vs-badge">VS</div>
        <div className="driver-picker glass-card" style={{ borderTop: `4px solid ${c2}` }}>
           <h3>{d2.name}</h3>
           <span className="driver-team">{d2.team}</span>
        </div>
      </div>

      <div className="compare-charts-grid">
        
        {/* 1. Recharts LineChart for Lap Times */}
        <div className="chart-wrapper lap-times glass-card stagger-children">
          <h4>Lap Time Comparison</h4>
          <div className="recharts-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockLapData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="lap" stroke="rgba(255,255,255,0.4)" tickLine={false} />
                <YAxis 
                   domain={['auto', 'auto']} 
                   tickFormatter={(val) => formatLapTime(val)} 
                   stroke="rgba(255,255,255,0.4)" 
                   tickLine={false} 
                   axisLine={false}
                   width={60}
                />
                <RechartsTooltip 
                  contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px' }}
                  formatter={(val) => [formatLapTime(val), undefined]}
                />
                <Legend />
                <Line type="monotone" dataKey={d1.acronym} stroke={c1} strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey={d2.acronym} stroke={c2} strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Recharts RadarChart for Sectors */}
        <div className="chart-wrapper sectors glass-card stagger-children">
          <h4>Average Sector Times</h4>
          <div className="recharts-container">
             <ResponsiveContainer width="100%" height="100%">
               <RadarChart cx="50%" cy="50%" outerRadius="70%" data={mockSectorData}>
                 <PolarGrid stroke="rgba(255,255,255,0.1)" />
                 <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                 <PolarRadiusAxis angle={30} domain={['auto', 'auto']} tick={false} axisLine={false} />
                 <Radar name={d1.acronym} dataKey={d1.acronym} stroke={c1} fill={c1} fillOpacity={0.4} />
                 <Radar name={d2.acronym} dataKey={d2.acronym} stroke={c2} fill={c2} fillOpacity={0.4} />
                 <Legend />
                 <RechartsTooltip contentStyle={{ background: '#111', border: 'none', borderRadius: '8px' }} />
               </RadarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Stint Timeline Visualization */}
        <div className="chart-wrapper strategy glass-card stagger-children">
          <h4>Tyre Strategy Timeline</h4>
          <div className="strategy-timeline-container">
             
             <div className="stint-row">
               <span className="driver-label" style={{color: c1}}>{d1.acronym}</span>
               <div className="stint-bars">
                 {mockStints.VER.map((stint, i) => {
                   const compound = getTyreCompound(stint.compound);
                   return (
                     <div 
                       key={i} 
                       className="stint" 
                       style={{ 
                         flex: stint.laps, 
                         backgroundColor: compound.color,
                         color: compound.id === 'HARD' ? '#000' : '#fff',
                         border: compound.id !== 'HARD' ? '1px solid white' : 'none'
                       }}
                     >
                       {compound.letter} ({stint.laps}L)
                     </div>
                   )
                 })}
               </div>
             </div>

             <div className="stint-row mt-4">
               <span className="driver-label" style={{color: c2}}>{d2.acronym}</span>
               <div className="stint-bars">
                 {mockStints.NOR.map((stint, i) => {
                   const compound = getTyreCompound(stint.compound);
                   return (
                     <div 
                       key={i} 
                       className="stint" 
                       style={{ 
                         flex: stint.laps, 
                         backgroundColor: compound.color,
                         color: compound.id === 'HARD' ? '#000' : '#fff',
                         border: compound.id !== 'HARD' ? '1px solid white' : 'none'
                       }}
                     >
                       {compound.letter} ({stint.laps}L)
                     </div>
                   )
                 })}
               </div>
             </div>

          </div>
        </div>

      </div>
    </div>
  );
}
