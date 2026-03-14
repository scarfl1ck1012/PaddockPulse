import { useState, useRef, useEffect, useCallback } from 'react';

const FPS = 25;

export function useReplayEngine(frames) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 0.5, 1, 2, 4, 8, 16, 30
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [selectedDriver, setSelectedDriver] = useState(null);
  
  const frameIdxRef = useRef(0);
  const isPlayingRef = useRef(false);
  const speedRef = useRef(1);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);

  const SPEEDS = [0.5, 1, 2, 5, 10, 30];

  // The animation loop — mirrors arcade.schedule at FPS
  const loop = useCallback((timestamp) => {
    if (!isPlayingRef.current || frames.length === 0) return;
    
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const elapsed = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;
    
    // Advance frame index by speed * elapsed * FPS
    frameIdxRef.current += speedRef.current * elapsed * FPS;
    
    if (frameIdxRef.current >= frames.length) {
      frameIdxRef.current = frames.length - 1;
      isPlayingRef.current = false;
      setIsPlaying(false);
      setCurrentFrameIdx(Math.floor(frameIdxRef.current));
      return;
    }
    
    setCurrentFrameIdx(Math.floor(frameIdxRef.current));
    rafRef.current = requestAnimationFrame(loop);
  }, [frames.length]);

  useEffect(() => {
    if (isPlaying && frames.length > 0) {
      lastTimeRef.current = null;
      rafRef.current = requestAnimationFrame(loop);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isPlaying, loop, frames.length]);

  // Keyboard controls — mirrors the Arcade keyboard handlers
  useEffect(() => {
    function handleKey(e) {
      // Don't trigger if user is in an input
      if (document.activeElement.tagName === 'INPUT') return;
      
      switch(e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':  // rewind 5 seconds
          e.preventDefault();
          seek(frameIdxRef.current - FPS * 5);
          break;
        case 'ArrowRight': // fast forward 5 seconds
          e.preventDefault();
          seek(frameIdxRef.current + FPS * 5);
          break;
        case 'ArrowUp':    // speed up
          e.preventDefault();
          cycleSpeed(1);
          break;
        case 'ArrowDown':  // speed down
          e.preventDefault();
          cycleSpeed(-1);
          break;
        case 'KeyR':       // restart
          e.preventDefault();
          seek(0);
          break;
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [frames.length]); // need frames.length inside seek

  function togglePlay() {
    const next = !isPlayingRef.current;
    isPlayingRef.current = next;
    setIsPlaying(next);
  }

  function seek(idx) {
    if (frames.length === 0) return;
    const clamped = Math.max(0, Math.min(idx, frames.length - 1));
    frameIdxRef.current = clamped;
    setCurrentFrameIdx(Math.floor(clamped));
    // If we're at the very end and want to seek back, we might be paused. Leave paused, just update view.
  }

  function cycleSpeed(dir) {
    const currentIdx = SPEEDS.indexOf(speedRef.current);
    if (currentIdx === -1) return;
    const nextIdx = Math.max(0, Math.min(SPEEDS.length - 1, currentIdx + dir));
    speedRef.current = SPEEDS[nextIdx];
    setPlaybackSpeed(SPEEDS[nextIdx]);
  }

  function setSpeed(s) {
    speedRef.current = s;
    setPlaybackSpeed(s);
  }
  
  // Expose current frame directly for convenience
  const currentFrame = frames.length > 0 ? frames[currentFrameIdx] : null;

  return { isPlaying, togglePlay, playbackSpeed, setSpeed, SPEEDS, cycleSpeed,
           currentFrameIdx, currentFrame, seek, selectedDriver, setSelectedDriver };
}
