import { useRef, useEffect, useCallback } from 'react';

const CANVAS_W = 1200;
const CANVAS_H = 800;
// We leave a wide margin to ensure the track outline doesn't hit the absolute edge
const MARGIN = 100;

const DRAW_W = CANVAS_W - MARGIN * 2;
const DRAW_H = CANVAS_H - MARGIN * 2;

export default function ReplayCanvas({ frame, trackPoints, showLabels, showDRS }) {
  const canvasRef = useRef(null);

  // Converts normalized 0-1 coordinate to canvas pixel
  // Mirrors the normalization done in useFrameBuilder + Arcade window scaling
  function toCanvas(nx, ny) {
    return {
      cx: nx * DRAW_W + MARGIN,
      cy: (1 - ny) * DRAW_H + MARGIN, // flip Y (canvas Y increases downward)
    };
  }

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // --- Clear ---
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // --- Background ---
    ctx.fillStyle = '#0a0a14'; // Very dark F1 style bg
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // --- Draw track outline (mirrors arcade polyline draw) ---
    if (trackPoints && trackPoints.length > 1) {
      // Track shadow/border (wider, darker)
      ctx.beginPath();
      const first = toCanvas(trackPoints[0].x, trackPoints[0].y);
      ctx.moveTo(first.cx, first.cy);
      trackPoints.forEach(p => {
        const { cx, cy } = toCanvas(p.x, p.y);
        ctx.lineTo(cx, cy);
      });
      ctx.closePath();
      ctx.strokeStyle = '#12121a';
      ctx.lineWidth = 24;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();

      // Track surface (lighter inner line)
      ctx.beginPath();
      ctx.moveTo(first.cx, first.cy);
      trackPoints.forEach(p => {
        const { cx, cy } = toCanvas(p.x, p.y);
        ctx.lineTo(cx, cy);
      });
      ctx.closePath();
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 14;
      ctx.stroke();

      // Track white line (center line)
      ctx.beginPath();
      ctx.moveTo(first.cx, first.cy);
      trackPoints.forEach(p => {
        const { cx, cy } = toCanvas(p.x, p.y);
        ctx.lineTo(cx, cy);
      });
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // --- Draw cars (mirrors _draw_drivers in arcade_replay.py) ---
    if (frame?.drivers) {
      // Sort by position so leader is drawn last (on top)
      const driverEntries = Object.entries(frame.drivers)
        .sort((a, b) => (a[1].distPct || 0) - (b[1].distPct || 0));

      driverEntries.forEach(([num, data]) => {
        const { cx, cy } = toCanvas(data.x, data.y);
        const color = data.teamColor || '#FFFFFF';

        if (data.retired) {
          // Retired: draw X marker
          ctx.globalAlpha = 0.4;
          ctx.fillStyle = '#666';
          ctx.beginPath();
          ctx.arc(cx, cy, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          return;
        }

        // Outer glow (mirrors arcade transparent circle)
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Main car dot
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, 9, 0, Math.PI * 2);
        ctx.fill();

        // White border
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // DRS indicator (green halo when DRS open, if showDRS)
        if (showDRS && data.drs) {
          ctx.strokeStyle = '#00FF88';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(cx, cy, 13, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Driver code label (mirrors arcade.draw_text per driver)
        if (showLabels) {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 11px Inter, "SF Pro Display", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(data.code, cx, cy - 18);
        }
      });
    }
  }, [frame, trackPoints, showLabels, showDRS]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      className="replay-canvas"
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        display: 'block'
      }}
    />
  );
}
