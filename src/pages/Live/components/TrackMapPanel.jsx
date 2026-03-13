import React, { useRef, useEffect } from 'react';
import useLiveStore from '../../../store/liveStore';
import { getTeamColour } from '../../../utils/teamColours';
import './TrackMapPanel.css';

export default function TrackMapPanel() {
  const { weather, positions } = useLiveStore();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Setup canvas resolution mapping
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // We keep an animation frame loop to smoothly render positions
    let animationFrameId;

    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw simplified track outline approximation (gray oval)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 15;
      ctx.beginPath();
      ctx.roundRect(40, 40, canvas.width - 80, canvas.height - 80, 50);
      ctx.stroke();

      // Draw drivers
      const drivers = Object.values(positions || {});
      
      // We need to map real-world X/Y to the canvas coords. 
      // OpenF1 location coords can vary wildly depending on the track.
      // This is a placeholder standard deviation mapping.
      const scaleX = canvas.width / 10000;
      const scaleY = canvas.height / 10000;

      drivers.forEach(driver => {
        if (!driver.x || !driver.y) return;
        
        // Very basic coordinate projection to keep them on screen
        const posX = (driver.x % 10000) * scaleX; 
        const posY = (driver.y % 10000) * scaleY;
        
        // Find team colour (we might need driver.driver_number mappings for real app, default to RedBull for shape demo)
        const color = getTeamColour('RedBull'); // Simplification for demo

        // Draw dot
        ctx.beginPath();
        ctx.arc(posX, posY, 6, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw number
        ctx.fillStyle = 'white';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(driver.driver_number, posX, posY);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [positions]);

  return (
    <div className="track-map-panel">
      {/* Weather Overlay */}
      {weather && (
        <div className="weather-overlay glass-card">
          <div className="weather-item">
            <span className="weather-icon">🌡️</span>
            <div className="weather-val">
              <div className="track-temp">{weather.track_temperature}°C Track</div>
              <div className="air-temp">{weather.air_temperature}°C Air</div>
            </div>
          </div>
          <div className="weather-item">
            <span className="weather-icon">💧</span>
            <span className="weather-val">{weather.humidity}%</span>
          </div>
          <div className="weather-item">
            <span className="weather-icon">💨</span>
            <span className="weather-val">{weather.wind_speed} m/s</span>
          </div>
          {weather.rainfall === 1 && (
            <div className="weather-warning">RAIN DETECTED</div>
          )}
        </div>
      )}
      
      {/* HTML5 Canvas Track Map */}
      <div className="canvas-container">
        <canvas ref={canvasRef} id="live-track-canvas"></canvas>
      </div>
      
      {!positions || Object.keys(positions).length === 0 && (
        <div className="map-empty-state">
           <p>Awaiting Telemetry...</p>
        </div>
      )}
    </div>
  );
}
