import React from 'react';
import useLiveStore from '../../../store/liveStore';
import { getTyreCompound } from '../../../utils/tyrePalette';
import './TyreStrategyStrip.css';

// To calculate bar widths relative to the max laps completed in the race so far
const MAX_LAPS = 50; 

export default function TyreStrategyStrip() {
  const { leaderboard } = useLiveStore();

  if (leaderboard.length === 0) {
    return (
      <div className="tyre-strategy-strip empty">
         <p>Tyre history loading...</p>
      </div>
    );
  }

  return (
    <div className="tyre-strategy-strip">
      <div className="strip-header">
        <h4>Stint History</h4>
      </div>
      <div className="stints-container">
        {/* We map the top 5 or 10 drivers to fit the horizontal strip cleanly, 
            or allow horizontal scroll. Let's show top 5 for glanceability */}
        {leaderboard.slice(0, 5).map(driver => {
          
          // In a real scenario, we'd map over driver.stints array.
          // Since we simulated data, we'll create a dummy stint based on current tyre age
          const currentCompound = getTyreCompound(driver.tyre_compound);
          const currentAge = parseInt(driver.tyre_age) || 0;
          
          return (
            <div key={driver.driver_number} className="stint-row">
              <span className="stint-driver">{driver.name_acronym}</span>
              <div className="stint-track">
                {/* Previous stint placeholder (e.g. if age is 15 but lap is 30, they did 15 laps on something else) */}
                <div 
                  className="stint-bar past" 
                  style={{ 
                    width: '30%', 
                    backgroundColor: getTyreCompound('MEDIUM').color,
                    color: '#000'
                  }}
                >
                  M (15)
                </div>
                
                {/* Current live edge stint */}
                <div 
                  className="stint-bar live" 
                  style={{ 
                    width: `${Math.max(5, (currentAge / MAX_LAPS) * 100)}%`, 
                    backgroundColor: currentCompound.color,
                    color: currentCompound.id === 'HARD' ? '#000' : (currentCompound.id === 'UNKNOWN' ? '#fff' : currentCompound.color),
                    border: currentCompound.id !== 'HARD' ? '1px solid white' : 'none'
                  }}
                >
                  {currentCompound.letter} ({currentAge})
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
