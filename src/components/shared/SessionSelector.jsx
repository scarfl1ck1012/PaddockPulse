import React, { useState, useEffect } from 'react';
import { fetchSeasonRaces } from '../../api/jolpica';
import { fetchSessionsByCircuit } from '../../api/openf1';
import './SessionSelector.css';

const SessionSelector = ({ onSelectSession }) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [races, setRaces] = useState([]);
  const [selectedRace, setSelectedRace] = useState('');
  const [sessions, setSessions] = useState([]);
  const [selectedSessionKey, setSelectedSessionKey] = useState('');

  const years = Array.from({ length: new Date().getFullYear() - 2017 }, (_, i) => new Date().getFullYear() - i); // OpenF1 mostly reliable 2018+

  // Load races when year changes
  useEffect(() => {
    const loadRaces = async () => {
      const data = await fetchSeasonRaces(year);
      if (data?.MRData?.RaceTable?.Races) {
        setRaces(data.MRData.RaceTable.Races);
        setSelectedRace('');
        setSessions([]);
      }
    };
    loadRaces();
  }, [year]);

  // Load sessions when race changes
  useEffect(() => {
    const loadSessions = async () => {
      if (!selectedRace) return;
      
      const race = races.find(r => r.round === selectedRace);
      if (!race) return;

      const circuitKey = race.Circuit.circuitId; // Not explicitly mapping to OpenF1 circuit_short_name cleanly.
      // But let's try to match by date or name.
      // A safer way: just use Jolpica for historical results, and OpenF1 for the detailed telemetry if we have a matching session key.
      // Actually OpenF1 allows fetchSessionsByYear. Let's just do that and filter.
      // Better strategy: just fetch all sessions for the year from OpenF1 once.
    };
    // Let's implement a simpler flow for OpenF1
  }, [selectedRace, races]);

  // Revised approach for OpenF1:
  const [allOpenF1Sessions, setAllOpenF1Sessions] = useState([]);

  useEffect(() => {
    const loadOpenF1 = async () => {
        try {
            const res = await fetch(`https://api.openf1.org/v1/sessions?year=${year}`);
            const data = await res.json();
            setAllOpenF1Sessions(data || []);
            
            // Extract unique meetings (Races)
            const meetingMap = {};
            (data || []).forEach(s => {
                meetingMap[s.meeting_key] = s;
            });
            const uniqueMeetings = Object.values(meetingMap).sort((a, b) => new Date(a.date_start) - new Date(b.date_start));
            setRaces(uniqueMeetings);
            setSelectedRace('');
            setSessions([]);
        } catch(e) { console.error(e) }
    };
    loadOpenF1();
  }, [year]);

  useEffect(() => {
      if (!selectedRace) {
          setSessions([]);
          return;
      }
      const meetingSessions = allOpenF1Sessions.filter(s => s.meeting_key.toString() === selectedRace);
      setSessions(meetingSessions.sort((a,b) => new Date(a.date_start) - new Date(b.date_start)));
      setSelectedSessionKey('');
  }, [selectedRace, allOpenF1Sessions]);

  const handleApply = () => {
      if (selectedSessionKey) {
          onSelectSession(selectedSessionKey, year);
      }
  };

  return (
    <div className="session-selector">
      <select value={year} onChange={e => setYear(e.target.value)}>
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>

      <select value={selectedRace} onChange={e => setSelectedRace(e.target.value)} disabled={races.length === 0}>
        <option value="">-- Select Grand Prix --</option>
        {races.map(r => (
           <option key={r.meeting_key} value={r.meeting_key}>{r.meeting_name} ({r.location})</option>
        ))}
      </select>

      <select value={selectedSessionKey} onChange={e => setSelectedSessionKey(e.target.value)} disabled={sessions.length === 0}>
        <option value="">-- Select Session --</option>
        {sessions.map(s => (
           <option key={s.session_key} value={s.session_key}>{s.session_name}</option>
        ))}
      </select>

      <button onClick={handleApply} disabled={!selectedSessionKey}>Load Data</button>
    </div>
  );
};

export default SessionSelector;
