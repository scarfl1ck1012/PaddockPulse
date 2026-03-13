import React, { useEffect, useRef } from 'react';
import { getTeamColour } from '../../utils/teamColours';
import './ReplayTrackMap.css';

const ReplayTrackMap = ({ lapData, currentLap, drivers }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render an oval track as a fallback since we don't have SVGs accessible here
    ctx.beginPath();
    ctx.ellipse(400, 300, 300, 150, 0, 0, 2 * Math.PI);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 20;
    ctx.stroke();

    if (!lapData || Object.keys(lapData).length === 0) return;

    // Simulate position around track based on gap
    // This assumes the leader is at currentLap, and others are fractional laps behind based on gap.
    // Roughly 1 lap = ~90 seconds. So gap of 10s = 10/90 laps behind.
    
    const lapTimeEstimateSecs = 90;

    const leaderLapEntry = Object.values(lapData).find(d => d.position === 1 || d.position === "1");
    // If we only have lap-by-lap data from Jolpica, we approximate
    // For now we just position cars evenly around the track based on classification
    
    const sortedDrivers = Object.values(lapData).sort((a,b) => parseInt(a.position) - parseInt(b.position));

    sortedDrivers.forEach(dData => {
        const driver = drivers.find(d => d.driverId === dData.driverId);
        const color = driver ? getTeamColour(driver.constructorId) : '#FFF';
        
        // Very basic positional estimate:
        // Position on oval based on currentLap fraction.
        // Leader is exactly at (currentLap % 1) progress around the track.
        const leaderProgress = (currentLap % 1);
        
        // Other drivers are offset by their gap duration / expected lap duration
        let gapOffset = 0;
        if (dData.position > 1) {
            // If we have actual gap string like "+1.234" we could parse it, 
            // but Ergast only gives lap times, so we might just space them out if gap is missing
            gapOffset = (parseInt(dData.position) * 1.5) / 100; // Fake offset
        }

        const progress = (leaderProgress - gapOffset + 1) % 1; // 0 to 1
        const angle = progress * Math.PI * 2 - Math.PI / 2; // start at top

        const cx = 400 + 300 * Math.cos(angle);
        const cy = 300 + 150 * Math.sin(angle);

        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#FFF';
        ctx.font = '10px Arial';
        ctx.fillText(driver?.code || dData.driverId.slice(0,3).toUpperCase(), cx + 10, cy + 4);
    });

  }, [lapData, currentLap, drivers]);

  return (
    <div className="replay-map-container">
      <div className="disclaimer">⚠ Position data estimated</div>
      <canvas ref={canvasRef} width={800} height={600} className="replay-canvas" />
    </div>
  );
};

export default ReplayTrackMap;
