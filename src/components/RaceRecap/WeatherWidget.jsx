import React, { useMemo } from 'react';

// Fades between weather records based on current time
export default function WeatherWidget({ weatherData, currentT }) {
  
  const currentWx = useMemo(() => {
    if (!weatherData || weatherData.length === 0) return null;
    
    // Find closest weather reading
    const sorted = [...weatherData].sort((a,b) => new Date(a.date) - new Date(b.date));
    const raceStart = new Date(sorted[0].date).getTime() / 1000;
    
    let closest = sorted[0];
    for (let i = 0; i < sorted.length; i++) {
       const wT = (new Date(sorted[i].date).getTime() / 1000) - raceStart;
       if (wT > currentT) break;
       closest = sorted[i];
    }
    return closest;
  }, [weatherData, currentT]);

  if (!currentWx) return null;

  return (
    <div className="weather-widget glass-panel">
      <h3>Live Weather</h3>
      <div className="wx-grid">
        <div className="wx-item">
          <span>Track</span>
          <strong>{currentWx.track_temperature?.toFixed(1) || '--'}°C</strong>
        </div>
        <div className="wx-item">
          <span>Air</span>
          <strong>{currentWx.air_temperature?.toFixed(1) || '--'}°C</strong>
        </div>
        <div className="wx-item">
          <span>Wind</span>
          <strong>{currentWx.wind_speed?.toFixed(1) || '--'} m/s</strong>
        </div>
        <div className="wx-item">
          <span>Humid</span>
          <strong>{currentWx.humidity?.toFixed(0) || '--'}%</strong>
        </div>
      </div>
    </div>
  );
}
