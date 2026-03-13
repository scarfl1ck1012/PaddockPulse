import React from 'react';
import './ReplayControls.css';

const ReplayControls = ({ isPlaying, onTogglePlay, progress, onSeek, speed, onChangeSpeed, currentLap, totalLaps, onRestart }) => {
  return (
    <div className="replay-controls">
      <div className="playback-buttons">
        <button onClick={onRestart} className="ctrl-btn" title="Restart">
          ⏮
        </button>
        <button onClick={onTogglePlay} className="ctrl-btn play-btn" title={isPlaying ? "Pause" : "Play"}>
          {isPlaying ? "⏸" : "▶"}
        </button>
      </div>

      <div className="scrubber-container">
        <div className="lap-counter">LAP {Math.floor(currentLap)} / {totalLaps}</div>
        <input 
          type="range" 
          min="1" 
          max={totalLaps || 100} 
          step="0.1"
          value={progress || 1} 
          onChange={(e) => onSeek(Number(e.target.value))}
          className="scrubber"
        />
      </div>

      <div className="speed-controls">
        {[1, 2, 4, 8].map(s => (
          <button 
            key={s} 
            className={`speed-btn ${speed === s ? 'active' : ''}`}
            onClick={() => onChangeSpeed(s)}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReplayControls;
