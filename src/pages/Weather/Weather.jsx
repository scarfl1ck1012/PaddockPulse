import { useMemo } from 'react';
import { useOpenF1Weather } from '../../hooks/useF1Data';
import { LoadingSkeleton } from '../../components/Common/Common';
import MiniChart from '../../components/Charts/MiniChart';
import '../../components/Charts/MiniChart.css';
import dayjs from 'dayjs';
import './Weather.css';

export default function Weather() {
  const { data: weatherData, isLoading } = useOpenF1Weather();

  const latest = weatherData?.[weatherData.length - 1];

  // Build time-series charts from weather data
  const tempChart = useMemo(() => {
    if (!weatherData?.length) return null;
    // Sample every 5th entry for performance
    const sampled = weatherData.filter((_, i) => i % 5 === 0 || i === weatherData.length - 1);
    const labels = sampled.map(w => dayjs(w.date).format('HH:mm'));
    return {
      series: [
        { label: 'Air Temp', values: sampled.map(w => w.air_temperature), color: '#3b82f6', fill: false },
        { label: 'Track Temp', values: sampled.map(w => w.track_temperature), color: '#ef4444', fill: false },
      ],
      labels,
    };
  }, [weatherData]);

  const humidityChart = useMemo(() => {
    if (!weatherData?.length) return null;
    const sampled = weatherData.filter((_, i) => i % 5 === 0 || i === weatherData.length - 1);
    return {
      series: [{ label: 'Humidity', values: sampled.map(w => w.humidity), color: '#06b6d4', fill: true }],
      labels: sampled.map(w => dayjs(w.date).format('HH:mm')),
    };
  }, [weatherData]);

  const windChart = useMemo(() => {
    if (!weatherData?.length) return null;
    const sampled = weatherData.filter((_, i) => i % 5 === 0 || i === weatherData.length - 1);
    return {
      series: [{ label: 'Wind Speed', values: sampled.map(w => w.wind_speed), color: '#a855f7', fill: true }],
      labels: sampled.map(w => dayjs(w.date).format('HH:mm')),
    };
  }, [weatherData]);

  const pressureChart = useMemo(() => {
    if (!weatherData?.length) return null;
    const sampled = weatherData.filter((_, i) => i % 5 === 0 || i === weatherData.length - 1);
    return {
      series: [{ label: 'Pressure', values: sampled.map(w => w.pressure), color: '#eab308', fill: true }],
      labels: sampled.map(w => dayjs(w.date).format('HH:mm')),
    };
  }, [weatherData]);

  // Rain history
  const rainPeriods = useMemo(() => {
    if (!weatherData?.length) return [];
    const periods = [];
    let inRain = false;
    let start = null;
    weatherData.forEach(w => {
      if (w.rainfall === 1 && !inRain) {
        inRain = true;
        start = w.date;
      } else if (w.rainfall !== 1 && inRain) {
        inRain = false;
        periods.push({ start, end: w.date });
      }
    });
    if (inRain) periods.push({ start, end: 'Ongoing' });
    return periods;
  }, [weatherData]);

  return (
    <div className="page-container" id="weather-page">
      <div className="page-header">
        <h1 className="page-title">🌤️ Weather</h1>
        <p className="page-subtitle">Session weather conditions and history</p>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={8} />
      ) : !latest ? (
        <div className="weather-empty glass-card">
          <div className="weather-empty-icon">🌤️</div>
          <h3>No Weather Data</h3>
          <p>Weather data will appear here during active sessions.</p>
        </div>
      ) : (
        <>
          {/* Current Conditions */}
          <div className="weather-current stagger-children">
            <div className="weather-stat-card glass-card">
              <div className="weather-stat-icon">🌡️</div>
              <div className="weather-stat-value">{latest.air_temperature}°C</div>
              <div className="weather-stat-label">Air Temperature</div>
            </div>
            <div className="weather-stat-card glass-card">
              <div className="weather-stat-icon">🛤️</div>
              <div className="weather-stat-value">{latest.track_temperature}°C</div>
              <div className="weather-stat-label">Track Temperature</div>
            </div>
            <div className="weather-stat-card glass-card">
              <div className="weather-stat-icon">💧</div>
              <div className="weather-stat-value">{latest.humidity}%</div>
              <div className="weather-stat-label">Humidity</div>
            </div>
            <div className="weather-stat-card glass-card">
              <div className="weather-stat-icon">💨</div>
              <div className="weather-stat-value">{latest.wind_speed} m/s</div>
              <div className="weather-stat-label">Wind Speed</div>
            </div>
            <div className="weather-stat-card glass-card">
              <div className="weather-stat-icon">🧭</div>
              <div className="weather-stat-value">{latest.wind_direction}°</div>
              <div className="weather-stat-label">Wind Direction</div>
            </div>
            <div className="weather-stat-card glass-card">
              <div className="weather-stat-icon">{latest.rainfall === 1 ? '🌧️' : '☀️'}</div>
              <div className="weather-stat-value">{latest.rainfall === 1 ? 'Yes' : 'No'}</div>
              <div className="weather-stat-label">Rainfall</div>
            </div>
          </div>

          {/* Charts */}
          <div className="weather-charts-grid">
            {tempChart && (
              <div className="glass-card chart-panel">
                <h3 className="chart-title">🌡️ Temperature Timeline</h3>
                <div className="chart-legend-row">
                  <span className="chart-legend-item"><span className="legend-dot" style={{background:'#3b82f6'}}></span> Air</span>
                  <span className="chart-legend-item"><span className="legend-dot" style={{background:'#ef4444'}}></span> Track</span>
                </div>
                <MiniChart data={tempChart.series} xLabels={tempChart.labels} yLabel="°C" height={220} />
              </div>
            )}
            {humidityChart && (
              <div className="glass-card chart-panel">
                <h3 className="chart-title">💧 Humidity</h3>
                <MiniChart data={humidityChart.series} xLabels={humidityChart.labels} yLabel="%" height={220} />
              </div>
            )}
            {windChart && (
              <div className="glass-card chart-panel">
                <h3 className="chart-title">💨 Wind Speed</h3>
                <MiniChart data={windChart.series} xLabels={windChart.labels} yLabel="m/s" height={220} />
              </div>
            )}
            {pressureChart && (
              <div className="glass-card chart-panel">
                <h3 className="chart-title">📊 Pressure</h3>
                <MiniChart data={pressureChart.series} xLabels={pressureChart.labels} yLabel="mbar" height={220} />
              </div>
            )}
          </div>

          {/* Rain Timeline */}
          <div className="weather-section">
            <h3 className="section-title">🌧️ Rain Periods</h3>
            {rainPeriods.length > 0 ? (
              <div className="rain-timeline glass-card">
                {rainPeriods.map((p, i) => (
                  <div key={i} className="rain-period">
                    <span className="rain-icon">🌧️</span>
                    <span className="rain-time">{dayjs(p.start).format('HH:mm')}</span>
                    <span className="rain-dash">→</span>
                    <span className="rain-time">{p.end === 'Ongoing' ? 'Ongoing' : dayjs(p.end).format('HH:mm')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card rain-none">
                <span>☀️</span> No rain recorded during this session
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
