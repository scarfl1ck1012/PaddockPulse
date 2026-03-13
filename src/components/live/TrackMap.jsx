import React, { useEffect, useRef, useState } from 'react';
import { useLiveStore } from '../../store/liveStore';
import { getTeamColour } from '../../utils/teamColours';


const TrackMap = () => {
  const { positions, drivers } = useLiveStore();
  const canvasRef = useRef(null);
  const [hoveredDriver, setHoveredDriver] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get track boundaries to scale points
    // positions is a map of driver_number -> { x, y, z }
    const allPos = Object.values(positions);
    if (!allPos.length) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    // Using historically collected points to find map bounds would be better,
    // but for now let's just scale around a fixed coordinate system assuming OpenF1 provides relative meters
    // Actually, OpenF1 provides x,y,z in meters from a reference point.
    // Let's assume a rough bounding box or dynamically update it.
    allPos.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    });

    // Add padding
    const padding = 500; // meters
    minX -= padding; maxX += padding;
    minY -= padding; maxY += padding;

    const width = maxX - minX;
    const height = maxY - minY;

    if (width <= 0 || height <= 0) return;

    // Draw drivers
    allPos.forEach(p => {
        const driver = drivers.find(d => d.driver_number === p.driver_number);
        const color = driver ? getTeamColour(driver.team_name) : '#FFFFFF';

        // Scale x,y to canvas (800x600 for example)
        const scaleX = canvas.width / width;
        const scaleY = canvas.height / height;
        
        const cx = (p.x - minX) * scaleX;
        const cy = canvas.height - ((p.y - minY) * scaleY); // y is usually flipped in canvas

        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#FFF';
        ctx.font = '10px Arial';
        ctx.fillText(driver?.name_acronym || p.driver_number, cx + 8, cy + 4);
    });

  }, [positions, drivers]);

  return (
    <div className="track-map-container">
      {/* Background SVG would go here */}
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={600} 
        className="track-canvas"
      />
      {hoveredDriver && (
        <div className="track-tooltip">
          {/* Tooltip content */}
        </div>
      )}
    </div>
  );
};

export default TrackMap;
