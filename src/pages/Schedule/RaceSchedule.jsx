import React, { useEffect, useState } from 'react';
import { fetchSeasonRaces, fetchRaceResults } from '../../api/jolpica';
import RaceCard from '../../components/schedule/RaceCard';
import './RaceSchedule.css';

const RaceSchedule = () => {
  const [races, setRaces] = useState([]);
  const [resultsCache, setResultsCache] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const data = await fetchSeasonRaces(currentYear);
        if (data?.MRData?.RaceTable?.Races) {
            setRaces(data.MRData.RaceTable.Races);
            
            const completed = data.MRData.RaceTable.Races.filter(r => new Date(`${r.date}T${r.time}`) < new Date());
            
            const resultsMap = {};
            // Fetch results for the last 3 completed races to show podiums immediately
            for (const r of completed.slice(-3)) { 
                const res = await fetchRaceResults(currentYear, r.round);
                if (res?.MRData?.RaceTable?.Races[0]?.Results) {
                    resultsMap[r.round] = res.MRData.RaceTable.Races[0].Results;
                }
            }
            setResultsCache(resultsMap);
        }
      } catch (e) {
          console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadSchedule();
  }, [currentYear]);

  if (isLoading) return <div className="schedule-loading">Loading Calendar...</div>;

  return (
    <div className="schedule-page">
      <div className="schedule-header">
        <h1>{currentYear} RACE CALENDAR</h1>
        <p>The complete schedule for the {currentYear} FIA Formula One World Championship.</p>
      </div>

      <div className="schedule-list">
        {races.map(race => (
          <RaceCard 
            key={race.round} 
            race={race} 
            results={resultsCache[race.round]} 
          />
        ))}
      </div>
    </div>
  );
};

export default RaceSchedule;
