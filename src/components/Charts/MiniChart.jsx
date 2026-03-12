import { useRef, useEffect } from 'react';

/**
 * Lightweight Canvas line-chart component.
 * Renders one or more data series on a responsive canvas.
 *
 * Props:
 * - data: Array of { label, values: number[], color, fill? }
 * - xLabels?: string[]          — optional x-axis labels
 * - yLabel?: string             — y-axis title
 * - height?: number             — canvas CSS height (default 220)
 * - gridLines?: number          — horizontal grid lines (default 5)
 * - showDots?: boolean          — show data point dots
 * - animate?: boolean           — entrance animation
 */
export default function MiniChart({
  data = [],
  xLabels = [],
  yLabel = '',
  height = 220,
  gridLines = 5,
  showDots = false,
  animate = true,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || data.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const pad = { top: 16, right: 16, bottom: xLabels.length ? 32 : 16, left: yLabel ? 48 : 40 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;

    // Find global min/max across all series
    let gMin = Infinity, gMax = -Infinity;
    data.forEach(s => {
      s.values.forEach(v => {
        if (v < gMin) gMin = v;
        if (v > gMax) gMax = v;
      });
    });

    // Nice round range
    const range = gMax - gMin || 1;
    const yMin = Math.max(0, gMin - range * 0.05);
    const yMax = gMax + range * 0.05;

    const toX = (i, count) => pad.left + (i / (count - 1)) * chartW;
    const toY = (v) => pad.top + chartH - ((v - yMin) / (yMax - yMin)) * chartH;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridLines; i++) {
      const y = pad.top + (i / gridLines) * chartH;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();

      // Y-axis labels
      const val = yMax - (i / gridLines) * (yMax - yMin);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(val >= 100 ? 0 : 1), pad.left - 6, y + 3);
    }

    // X-axis labels
    if (xLabels.length > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      const step = Math.max(1, Math.floor(xLabels.length / 10));
      xLabels.forEach((label, i) => {
        if (i % step === 0 || i === xLabels.length - 1) {
          ctx.fillText(label, toX(i, xLabels.length), h - pad.bottom + 16);
        }
      });
    }

    // Y-axis title
    if (yLabel) {
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '10px Inter, sans-serif';
      ctx.translate(12, pad.top + chartH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillText(yLabel, 0, 0);
      ctx.restore();
    }

    // Draw series
    data.forEach(series => {
      const { values, color, fill } = series;
      if (values.length < 2) return;

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';

      values.forEach((v, i) => {
        const x = toX(i, values.length);
        const y = toY(v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Fill area
      if (fill) {
        const grad = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
        grad.addColorStop(0, color.replace(')', ', 0.25)').replace('rgb', 'rgba'));
        grad.addColorStop(1, 'transparent');
        ctx.lineTo(toX(values.length - 1, values.length), h - pad.bottom);
        ctx.lineTo(toX(0, values.length), h - pad.bottom);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Dots
      if (showDots && values.length <= 30) {
        values.forEach((v, i) => {
          ctx.beginPath();
          ctx.arc(toX(i, values.length), toY(v), 3, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        });
      }
    });

  }, [data, xLabels, yLabel, height, gridLines, showDots]);

  return (
    <div ref={containerRef} className="mini-chart-container" style={{ width: '100%' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}
