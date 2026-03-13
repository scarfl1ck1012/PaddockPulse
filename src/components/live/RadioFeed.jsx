import { useLiveStore } from '../../store/liveStore';
import { getTeamColour } from '../../utils/teamColours';
import { dayjs } from '../../utils/formatters';


const RadioFeed = () => {
  const { radioClips, drivers } = useLiveStore();

  const sortedClips = [...radioClips].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="radio-feed-panel">
      <div className="panel-header">TEAM RADIO</div>
      <div className="radio-feed">
        {sortedClips.map((clip, idx) => {
          const driver = drivers.find(d => d.driver_number === clip.driver_number);
          const teamCol = driver ? getTeamColour(driver.team_name) : '#888';
          
          return (
            <div key={idx} className="radio-clip animate-slide-in" style={{ borderLeft: `3px solid ${teamCol}` }}>
              <div className="radio-meta">
                <span className="radio-driver">{driver?.name_acronym || clip.driver_number}</span>
                <span className="radio-time">{dayjs(clip.date).format('HH:mm:ss')}</span>
              </div>
              <audio controls src={clip.recording_url || clip.url} className="radio-audio">
                Your browser does not support the audio element.
              </audio>
            </div>
          );
        })}
        {sortedClips.length === 0 && (
          <div className="empty-state">No radio clips available</div>
        )}
      </div>
    </div>
  );
};

export default RadioFeed;
