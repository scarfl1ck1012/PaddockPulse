import './Common.css';

export function LoadingSkeleton({ rows = 5, type = 'table' }) {
  if (type === 'card') {
    return (
      <div className="skeleton-grid">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="skeleton-card glass-card-static">
            <div className="skeleton-line skeleton-line-lg" />
            <div className="skeleton-line skeleton-line-md" />
            <div className="skeleton-line skeleton-line-sm" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="skeleton-table">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-row" style={{ animationDelay: `${i * 0.05}s` }}>
          <div className="skeleton-line skeleton-line-xs" />
          <div className="skeleton-line skeleton-line-md" />
          <div className="skeleton-line skeleton-line-lg" />
          <div className="skeleton-line skeleton-line-sm" />
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="error-state glass-card-static" id="error-state">
      <div className="error-icon">⚠️</div>
      <h3>Oops!</h3>
      <p>{message}</p>
      {onRetry && (
        <button className="btn btn-primary" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}

export function SeasonSelector({ value, onChange, minYear = 1950 }) {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear; y >= minYear; y--) {
    years.push(y);
  }

  return (
    <select
      className="season-selector"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      id="season-selector"
    >
      {years.map((y) => (
        <option key={y} value={y}>{y}</option>
      ))}
    </select>
  );
}

export function CountdownTimer({ targetDate, label }) {
  const { days, hours, minutes, seconds, isPast } = useCountdown(targetDate);

  if (isPast) {
    return (
      <div className="countdown">
        <span className="countdown-label">{label}</span>
        <span className="countdown-past">Session started</span>
      </div>
    );
  }

  return (
    <div className="countdown" id="countdown-timer">
      {label && <span className="countdown-label">{label}</span>}
      <div className="countdown-units">
        <div className="countdown-unit">
          <span className="countdown-value">{days}</span>
          <span className="countdown-unit-label">DAYS</span>
        </div>
        <span className="countdown-sep">:</span>
        <div className="countdown-unit">
          <span className="countdown-value">{String(hours).padStart(2, '0')}</span>
          <span className="countdown-unit-label">HRS</span>
        </div>
        <span className="countdown-sep">:</span>
        <div className="countdown-unit">
          <span className="countdown-value">{String(minutes).padStart(2, '0')}</span>
          <span className="countdown-unit-label">MIN</span>
        </div>
        <span className="countdown-sep">:</span>
        <div className="countdown-unit">
          <span className="countdown-value">{String(seconds).padStart(2, '0')}</span>
          <span className="countdown-unit-label">SEC</span>
        </div>
      </div>
    </div>
  );
}

// Countdown hook
import { useState, useEffect } from 'react';

function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState(calcTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calcTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
}

function calcTimeLeft(targetDate) {
  const diff = new Date(targetDate) - new Date();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isPast: false,
  };
}
