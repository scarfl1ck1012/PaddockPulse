import React from 'react';
import { useLiveSession } from '../../hooks/useLiveSession';
import Leaderboard from '../../components/live/Leaderboard';
import TrackMap from '../../components/live/TrackMap';
import WeatherPanel from '../../components/live/WeatherPanel';
import RaceControl from '../../components/live/RaceControl';
import RadioFeed from '../../components/live/RadioFeed';
import TyreTracker from '../../components/live/TyreTracker';
import LapComparison from '../../components/live/LapComparison';
import './LiveTiming.css';

const LiveTiming = () => {
  const { isLive, sessionName, isLoading } = useLiveSession();

  if (isLoading) {
    return <div className="live-timing-loading">Loading Live Session...</div>;
  }

  return (
    <div className="live-timing-page">
      <div className="live-top-bar">
        <h1>{sessionName || 'LIVE TIMING'}</h1>
        <div className={`live-indicator ${isLive ? 'active' : ''}`}>
          {isLive ? 'LIVE' : 'WAITING FOR SESSION'}
        </div>
      </div>
      
      {!isLive && (
        <div className="offline-banner">
          <h2>We are currently between sessions. Displaying latest available data.</h2>
          <button className="notify-me-btn">NOTIFY ME for next session</button>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="panel-left">
          <Leaderboard />
        </div>
        
        <div className="panel-center">
          <TrackMap />
          <WeatherPanel />
        </div>
        
        <div className="panel-right">
          <RaceControl />
          <RadioFeed />
        </div>
      </div>
      
      <div className="dashboard-bottom">
        <TyreTracker />
        <LapComparison />
      </div>
    </div>
  );
};

export default LiveTiming;
