import React from 'react';

export default function ReplayControls({ 
  engine, 
  totalFrames,
  showLabels, setShowLabels,
  showDRS, setShowDRS
}) {
  const { 
    isPlaying, togglePlay, 
    playbackSpeed, cycleSpeed, SPEEDS, 
    currentFrameIdx, seek, currentFrame
  } = engine;

  // Format race time mm:ss. The t value is in seconds.
  function formatTime(t) {
    if (!t) return "00:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  const progressPct = totalFrames > 0 ? (currentFrameIdx / totalFrames) * 100 : 0;
  const currentT = currentFrame?.relativeT || 0;

  return (
    <div className="replay-controls glass-panel">
      
      {/* Top Row: Playback Buttons */}
      <div className="rc-buttons-row">
        <button className="rc-btn" onClick={() => seek(0)} title="Restart (R)">
          ⏮
        </button>
        <button className="rc-btn" onClick={() => seek(currentFrameIdx - 25 * 5)} title="-5s (Left Arrow)">
          ⏪ 5s
        </button>
        <button className="rc-btn play-btn" onClick={togglePlay} title="Play/Pause (Space)">
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button className="rc-btn" onClick={() => seek(currentFrameIdx + 25 * 5)} title="+5s (Right Arrow)">
          5s ⏩
        </button>
        
        <div className="rc-speed-control">
          <span>Speed:</span>
          <button className="rc-speed-btn" onClick={() => cycleSpeed(1)} title="Cycle Speed (Up/Down)">
            {playbackSpeed}x
          </button>
        </div>

        <div className="rc-toggles">
          <label className="rc-toggle">
            <input type="checkbox" checked={showLabels} onChange={e => setShowLabels(e.target.checked)} />
            Labels (L)
          </label>
          <label className="rc-toggle">
            <input type="checkbox" checked={showDRS} onChange={e => setShowDRS(e.target.checked)} />
            DRS (D)
          </label>
        </div>
      </div>

      {/* Bottom Row: Scrubber */}
      <div className="rc-scrubber-row">
        <span className="rc-time">{formatTime(currentT)}</span>
        
        <div className="rc-timeline-wrap">
          <input 
            type="range"
            className="rc-slider"
            min="0"
            max={totalFrames || 100}
            value={currentFrameIdx}
            onChange={(e) => seek(Number(e.target.value))}
          />
          <div className="rc-progress-fill" style={{ width: `${progressPct}%` }}></div>
        </div>
        
        <span className="rc-time">{formatTime(totalFrames / 25)}</span>
      </div>

    </div>
  );
}
