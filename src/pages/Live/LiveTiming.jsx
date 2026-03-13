import { useEffect } from 'react';
import useLiveSession from '../../hooks/useLiveSession';
import useNotifications from '../../hooks/useNotifications';
import useCountdown from '../../hooks/useCountdown';

// Need to build these components
import Leaderboard from './components/Leaderboard';
import TrackMapPanel from './components/TrackMapPanel';
import RaceControlPanel from './components/RaceControlPanel';
import TyreStrategyStrip from './components/TyreStrategyStrip';
import LapComparisonChart from './components/LapComparisonChart';

import './LiveTiming.css';

export default function LiveTiming() {
  const { isLive } = useLiveSession();
  const { requestPermission } = useNotifications();
  
  // Example future session date (hardcoded for the "Not Live" state)
  const nextSessionDate = '2026-03-20T14:00:00+05:30'; 
  const { isExpired, formattedString } = useCountdown(nextSessionDate);

  // Request notification permission on mount
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  if (!isLive) {
    return (
      <div className="page-container" id="live-page-offline">
        <div className="offline-banner glass-card">
          <h2>No Active Session</h2>
          <p>The next session begins in:</p>
          <div className="countdown-display">{formattedString}</div>
        </div>
        {/* We can show previous race results here per prompt reqs later */}
      </div>
    );
  }

  return (
    <div className="live-timing-layout page-container">
      {/* Top 3-Panel Dashboard */}
      <div className="live-panels-row">
        {/* Left: 40% Leaderboard */}
        <div className="live-panel panel-left">
          <Leaderboard />
        </div>
        
        {/* Centre: 35% Track Map & Weather */}
        <div className="live-panel panel-center">
          <TrackMapPanel />
        </div>
        
        {/* Right: 25% Race Control & Radio */}
        <div className="live-panel panel-right">
          <RaceControlPanel />
        </div>
      </div>

      {/* Middle: Full Width Tyre Strategy Strip */}
      <div className="live-tyre-strip-wrapper">
        <TyreStrategyStrip />
      </div>

      {/* Bottom: Lap Comparison Line Chart */}
      <div className="live-comparison-wrapper">
        <LapComparisonChart />
      </div>
    </div>
  );
}
