import { useState, useMemo, useRef } from 'react';
import {
  useOpenF1Drivers, useOpenF1TeamRadio
} from '../../hooks/useF1Data';
import { LoadingSkeleton } from '../../components/Common/Common';
import { getTeamColour } from '../../api/constants';
import dayjs from 'dayjs';
import './TeamRadio.css';

export default function TeamRadio() {
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [playingUrl, setPlayingUrl] = useState(null);
  const audioRef = useRef(null);

  const { data: drivers, isLoading: loadingDrivers } = useOpenF1Drivers();
  const { data: radioMessages, isLoading: loadingRadio } = useOpenF1TeamRadio(
    'latest',
    selectedDriver || undefined
  );

  // Deduplicated drivers
  const driverOptions = useMemo(() => {
    if (!drivers?.length) return [];
    const seen = new Set();
    return drivers.filter(d => {
      if (seen.has(d.driver_number)) return false;
      seen.add(d.driver_number);
      return true;
    }).sort((a, b) => (a.name_acronym || '').localeCompare(b.name_acronym || ''));
  }, [drivers]);

  // Driver map
  const driverMap = useMemo(() => {
    const map = {};
    if (drivers) drivers.forEach(d => { map[d.driver_number] = d; });
    return map;
  }, [drivers]);

  // Sorted messages (newest first)
  const messages = useMemo(() => {
    if (!radioMessages?.length) return [];
    return [...radioMessages].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [radioMessages]);

  const handlePlay = (url) => {
    if (playingUrl === url) {
      audioRef.current?.pause();
      setPlayingUrl(null);
    } else {
      setPlayingUrl(url);
      setTimeout(() => {
        audioRef.current?.play();
      }, 100);
    }
  };

  return (
    <div className="page-container" id="team-radio-page">
      <div className="page-header">
        <h1 className="page-title">📻 Team Radio</h1>
        <p className="page-subtitle">Listen to team radio communications from the latest session</p>
      </div>

      {/* Driver Filter */}
      <div className="radio-filters">
        <button
          className={`radio-filter-btn ${selectedDriver === null ? 'active' : ''}`}
          onClick={() => setSelectedDriver(null)}
        >
          All Drivers
        </button>
        {driverOptions.map(d => {
          const colour = d.team_colour ? `#${d.team_colour}` : getTeamColour(d.team_name);
          return (
            <button
              key={d.driver_number}
              className={`radio-filter-btn ${selectedDriver === d.driver_number ? 'active' : ''}`}
              onClick={() => setSelectedDriver(d.driver_number)}
              style={selectedDriver === d.driver_number ? { borderColor: colour, color: colour } : {}}
            >
              {d.name_acronym}
            </button>
          );
        })}
      </div>

      {/* Audio element (hidden) */}
      {playingUrl && (
        <audio
          ref={audioRef}
          src={playingUrl}
          onEnded={() => setPlayingUrl(null)}
          onError={() => setPlayingUrl(null)}
        />
      )}

      {/* Radio Messages */}
      <div className="radio-messages">
        {loadingDrivers || loadingRadio ? (
          <LoadingSkeleton rows={8} />
        ) : messages.length > 0 ? (
          <div className="radio-list stagger-children">
            {messages.map((msg, i) => {
              const driver = driverMap[msg.driver_number];
              const colour = driver?.team_colour ? `#${driver.team_colour}` : getTeamColour(driver?.team_name);
              const isPlaying = playingUrl === msg.recording_url;

              return (
                <div key={i} className="radio-card glass-card" style={{ borderLeftColor: colour }}>
                  <div className="radio-card-header">
                    {driver?.headshot_url && (
                      <img src={driver.headshot_url} alt="" className="radio-headshot" />
                    )}
                    <div className="radio-driver-info">
                      <span className="radio-driver-name">{driver?.full_name || `#${msg.driver_number}`}</span>
                      <span className="radio-team">{driver?.team_name || ''}</span>
                    </div>
                    <div className="radio-meta">
                      <span className="radio-time">{dayjs(msg.date).format('HH:mm:ss')}</span>
                    </div>
                  </div>

                  {msg.recording_url && (
                    <button
                      className={`radio-play-btn ${isPlaying ? 'playing' : ''}`}
                      onClick={() => handlePlay(msg.recording_url)}
                    >
                      <span className="play-icon">{isPlaying ? '⏸' : '▶'}</span>
                      <span className="play-label">{isPlaying ? 'Pause' : 'Play Radio'}</span>
                      <div className="play-waveform">
                        {[...Array(12)].map((_, j) => (
                          <div
                            key={j}
                            className={`wave-bar ${isPlaying ? 'wave-animate' : ''}`}
                            style={{ animationDelay: `${j * 0.08}s`, height: `${8 + Math.random() * 16}px` }}
                          />
                        ))}
                      </div>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="radio-empty glass-card">
            <div className="radio-empty-icon">📻</div>
            <h3>No Radio Messages</h3>
            <p>No team radio recordings available for the selected session/driver.</p>
          </div>
        )}
      </div>
    </div>
  );
}
