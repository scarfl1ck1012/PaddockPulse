import React, { useState, useEffect } from 'react';
import { fetchSeasonResults } from '../../services/api';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 2017 }, (_, i) => CURRENT_YEAR - i);

export default function RaceSelector({ onSelect, isBuilding }) {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [races, setRaces] = useState([]);
  const [round, setRound] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function getRaces() {
      setLoading(true);
      const controller = new AbortController();
      try {
        const data = await fetchSeasonResults(year, controller.signal);
        if (!active) return;
        
        let raceList = data?.MRData?.RaceTable?.Races || [];
        
        // Filter out future races and limit to 5 per prompt request
        const today = new Date();
        raceList = raceList
           .filter(r => new Date(`${r.date}T${r.time || '00:00:00Z'}`) < today)
           .slice(0, 5);
        
        setRaces(raceList);
        if (raceList.length > 0) {
          setRound(raceList[raceList.length - 1].round);
        } else {
          setRound('');
        }
      } catch (err) {
        console.error("Failed to load races", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    getRaces();
    return () => { active = false; };
  }, [year]);

  return (
    <div className="race-selector glass-panel">
      <div className="sel-group">
        <label>Season</label>
        <select value={year} onChange={e => setYear(Number(e.target.value))} disabled={isBuilding}>
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="sel-group flex-1">
        <label>Race</label>
        <select value={round} onChange={e => setRound(e.target.value)} disabled={loading || races.length === 0 || isBuilding}>
          {races.length === 0 && <option value="">No completed races</option>}
          {races.map(r => (
            <option key={r.round} value={r.round}>
              Round {r.round} - {r.raceName}
            </option>
          ))}
        </select>
      </div>

      <button 
        className="btn-primary load-btn"
        disabled={!round || isBuilding || !year}
        onClick={() => onSelect(year, round)}
      >
        {isBuilding ? 'Loading Replay...' : 'Load Replay'}
      </button>
    </div>
  );
}
