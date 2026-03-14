import React, { useState } from 'react';
import RaceSelector from './RaceSelector';
import ReplayCanvas from './ReplayCanvas';
import ReplayLeaderboard from './ReplayLeaderboard';
import ReplayControls from './ReplayControls';
import DriverTelemetry from './DriverTelemetry';
import RaceControlFeed from './RaceControlFeed';
import WeatherWidget from './WeatherWidget';

import { getSessionKey, getWeather } from '../../services/openf1Replay';
import { useFrameBuilder } from '../../hooks/useFrameBuilder';
import { useReplayEngine } from '../../hooks/useReplayEngine';

import './RaceRecap.css';

export default function RaceRecap() {
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedRound, setSelectedRound] = useState(null);
  const [sessionKey, setSessionKey] = useState(null);
  
  // Toggles
  const [showLabels, setShowLabels] = useState(true);
  const [showDRS, setShowDRS] = useState(true);
  
  // Weather standalone
  const [weatherData, setWeatherData] = useState([]);

  // Hooks
  const builder = useFrameBuilder();
  const engine = useReplayEngine(builder.frames);

  // Fallback state
  const isFallback = selectedYear < 2018;

  async function handleLoadReplay(year, round) {
    builder.clearFrames(); // reset engine
    
    setSelectedYear(year);
    setSelectedRound(round);
    
    if (year < 2018) {
      // Step 5: Jolpica fallback handler (Not implemented in full frame builder yet, but catches old years)
      alert(`Pre-2018 Jolpica fallback rendering not fully integrated yet, but architecture supports it. Cannot fetch OpenF1 telemetry for ${year}.`);
      return;
    }

    try {
      const key = await getSessionKey(year, round);
      if (!key) throw new Error("Could not find session key for this race.");
      
      setSessionKey(key);
      
      // Fetch weather asynchronously to not block frame builder
      getWeather(key).then(setWeatherData).catch(console.error);
      
      // Start builder
      await builder.buildFrames(key);
    } catch (err) {
      console.error(err);
      // Let builder's error state render the message
    }
  }

  const { isBuilding, loadingProgress, loadingMessage, error, totalLaps, trackPoints } = builder;
  const { currentFrame, currentFrameIdx, selectedDriver, setSelectedDriver } = engine;

  return (
    <div className="recap-page page-container">
      <div className="recap-header">
        <h1>🎬 Race Replay Engine</h1>
      </div>

      <div className="recap-layout">
        <RaceSelector 
          onSelect={handleLoadReplay} 
          isBuilding={isBuilding}
        />

        {error && (
          <div className="glass-panel" style={{ gridColumn: '1 / -1', borderLeft: '4px solid #e10600' }}>
            <h3 style={{color: '#e10600', margin: '0 0 8px 0'}}>Engine Error</h3>
            <p>{error}</p>
          </div>
        )}

        {isBuilding && (
          <div className="loading-overlay glass-panel">
            <h2>Building Replay Cache...</h2>
            <div className="loading-bar">
              <div className="loading-fill" style={{ width: `${loadingProgress}%` }}></div>
            </div>
            <p style={{marginTop: '12px'}}>{loadingMessage}</p>
            <span style={{fontSize: '0.8rem', color: '#888'}}>Extracting 25 FPS telemetry matrix across all drivers</span>
          </div>
        )}

        {/* REPLAY UI */}
        {!isBuilding && builder.frames.length > 0 && !error && (
          <>
            <ReplayLeaderboard 
              frame={currentFrame} 
              totalLaps={totalLaps}
              selectedDriver={selectedDriver}
              onSelectDriver={setSelectedDriver}
            />
            
            <div className="replay-main-view glass-panel">
              <ReplayCanvas 
                frame={currentFrame} 
                trackPoints={trackPoints}
                showLabels={showLabels}
                showDRS={showDRS}
              />
              
              {/* Overlay Lap Counter */}
              <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', padding: '4px 16px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 'bold' }}>
                LAP {currentFrame?.maxLap || 0} / {totalLaps}
              </div>
            </div>

            <div className="replay-right-panel">
              {selectedDriver && (
                <DriverTelemetry 
                  frame={currentFrame} 
                  selectedDriver={selectedDriver}
                />
              )}
              
              <WeatherWidget 
                weatherData={weatherData} 
                currentT={currentFrame?.relativeT || 0} 
              />
              
              <RaceControlFeed 
                raceControlLogs={builder.raceControlLogs} 
                currentT={currentFrame?.relativeT || 0} 
              />
            </div>

            <ReplayControls 
              engine={engine}
              totalFrames={builder.frames.length}
              showLabels={showLabels} setShowLabels={setShowLabels}
              showDRS={showDRS} setShowDRS={setShowDRS}
            />
          </>
        )}
      </div>
    </div>
  );
}
