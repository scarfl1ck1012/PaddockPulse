import { useRef, useEffect, useMemo } from 'react';
import './TrackMap.css';

/**
 * TrackMap — Canvas-based circuit visualization
 *
 * Uses x,y coordinates from OpenF1 location data to render:
 * 1. Track outline from a reference driver's location trail
 * 2. Coloured dots for each driver's latest position
 *
 * Props:
 * - locationData: Array of { driver_number, x, y, date }
 * - drivers: Array of { driver_number, name_acronym, team_colour }
 * - width, height: canvas dimensions (default 500x400)
 */
export default function TrackMap({ locationData = [], drivers = [], width = 500, height = 400 }) {
  const canvasRef = useRef(null);

  // Build driver info map
  const driverMap = useMemo(() => {
    const map = {};
    drivers.forEach(d => { map[d.driver_number] = d; });
    return map;
  }, [drivers]);

  // Get latest position per driver and build track outline from the driver with most points
  const { trackPoints, latestPositions, bounds } = useMemo(() => {
    if (!locationData?.length) return { trackPoints: [], latestPositions: {}, bounds: null };

    // Group by driver
    const byDriver = {};
    const latestPos = {};

    locationData.forEach(pt => {
      if (pt.x == null || pt.y == null) return;
      if (!byDriver[pt.driver_number]) byDriver[pt.driver_number] = [];
      byDriver[pt.driver_number].push(pt);

      const existing = latestPos[pt.driver_number];
      if (!existing || new Date(pt.date) > new Date(existing.date)) {
        latestPos[pt.driver_number] = pt;
      }
    });

    // Use driver with most location points for track outline
    let maxDriver = null;
    let maxCount = 0;
    Object.keys(byDriver).forEach(dn => {
      if (byDriver[dn].length > maxCount) {
        maxCount = byDriver[dn].length;
        maxDriver = dn;
      }
    });

    const track = maxDriver ? byDriver[maxDriver].sort((a, b) => new Date(a.date) - new Date(b.date)) : [];

    // Sample the track to avoid overdraw (take every Nth point)
    const sampleRate = Math.max(1, Math.floor(track.length / 600));
    const sampled = track.filter((_, i) => i % sampleRate === 0);

    // Calculate bounds
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    sampled.forEach(pt => {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    });

    return {
      trackPoints: sampled,
      latestPositions: latestPos,
      bounds: sampled.length > 0 ? { minX, maxX, minY, maxY } : null,
    };
  }, [locationData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bounds) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const pad = 24;
    const cw = width - 2 * pad;
    const ch = height - 2 * pad;
    const rangeX = bounds.maxX - bounds.minX || 1;
    const rangeY = bounds.maxY - bounds.minY || 1;

    // Scale to fit while preserving aspect ratio
    const scaleX = cw / rangeX;
    const scaleY = ch / rangeY;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = pad + (cw - rangeX * scale) / 2;
    const offsetY = pad + (ch - rangeY * scale) / 2;

    const toCanvas = (x, y) => ({
      cx: offsetX + (x - bounds.minX) * scale,
      cy: offsetY + (bounds.maxY - y) * scale, // flip Y
    });

    // Draw track outline
    if (trackPoints.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 8;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      const first = toCanvas(trackPoints[0].x, trackPoints[0].y);
      ctx.moveTo(first.cx, first.cy);
      trackPoints.slice(1).forEach(pt => {
        const { cx, cy } = toCanvas(pt.x, pt.y);
        ctx.lineTo(cx, cy);
      });
      ctx.stroke();

      // Thinner white center line
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      ctx.moveTo(first.cx, first.cy);
      trackPoints.slice(1).forEach(pt => {
        const { cx, cy } = toCanvas(pt.x, pt.y);
        ctx.lineTo(cx, cy);
      });
      ctx.stroke();
    }

    // Draw driver dots
    Object.entries(latestPositions).forEach(([dn, pt]) => {
      const driver = driverMap[Number(dn)];
      const colour = driver?.team_colour ? `#${driver.team_colour}` : '#666';
      const { cx, cy } = toCanvas(pt.x, pt.y);

      // Outer glow
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fillStyle = colour.replace(')', ', 0.3)').replace('#', 'rgba(').replace(
        /rgba\(([0-9a-fA-F]{6})/,
        (_, hex) => `rgba(${parseInt(hex.slice(0, 2), 16)}, ${parseInt(hex.slice(2, 4), 16)}, ${parseInt(hex.slice(4, 6), 16)}`
      );
      ctx.fill();

      // Inner dot
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = colour;
      ctx.fill();

      // Driver label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 8px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(driver?.name_acronym || dn, cx, cy - 10);
    });

  }, [trackPoints, latestPositions, bounds, driverMap, width, height]);

  if (!locationData?.length) {
    return (
      <div className="track-map-empty">
        <p>No track location data available</p>
      </div>
    );
  }

  return (
    <div className="track-map-container">
      <canvas ref={canvasRef} />
    </div>
  );
}
