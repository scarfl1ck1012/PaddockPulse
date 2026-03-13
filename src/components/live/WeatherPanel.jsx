import { useLiveStore } from '../../store/liveStore';
import { useNotifications } from '../../hooks/useNotifications';

import { useEffect } from 'react';

const WeatherPanel = () => {
  const { weather, circuitName } = useLiveStore();
  const { sendImmediateNotification } = useNotifications();

  useEffect(() => {
    if (weather && weather.rainfall > 0) {
      sendImmediateNotification(
        "Rain Detected",
        `Rain reported at ${circuitName || 'the circuit'}!`
      );
    }
  }, [weather?.rainfall, circuitName, sendImmediateNotification]);

  if (!weather) return <div className="weather-panel skeleton">Loading Weather...</div>;

  return (
    <div className="weather-panel">
      <div className="weather-header">
        <h3>WEATHER</h3>
        <span className="weather-time">{new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date(weather.date))}</span>
      </div>
      <div className="weather-grid">
        <div className="weather-item">
          <span className="weather-label">TRACK</span>
          <span className="weather-value">{weather.track_temperature}°C</span>
        </div>
        <div className="weather-item">
          <span className="weather-label">AIR</span>
          <span className="weather-value">{weather.air_temperature}°C</span>
        </div>
        <div className="weather-item">
          <span className="weather-label">HUMIDITY</span>
          <span className="weather-value">{weather.humidity}%</span>
        </div>
        <div className="weather-item">
          <span className="weather-label">WIND</span>
          <span className="weather-value">{weather.wind_speed} km/h</span>
          <span className="wind-dir" style={{ transform: `rotate(${weather.wind_direction}deg)` }}>↑</span>
        </div>
        <div className="weather-item rain-item">
          <span className="weather-label">RAIN</span>
          <span className={`weather-value ${weather.rainfall > 0 ? 'is-raining' : ''}`}>
            {weather.rainfall > 0 ? 'YES' : 'NO'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WeatherPanel;
