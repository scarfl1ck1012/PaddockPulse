import { useLiveStore } from '../../store/liveStore';
import { dayjs } from '../../utils/formatters';


const RaceControl = () => {
  const { raceControl } = useLiveStore();

  const sortedMessages = [...raceControl].sort((a, b) => new Date(b.date) - new Date(a.date));

  const getMessageCategoryClass = (category) => {
    if (!category) return 'cat-info';
    const cat = category.toLowerCase();
    if (cat.includes('flag')) return 'cat-flag';
    if (cat.includes('safety car')) return 'cat-sc';
    if (cat.includes('penalty')) return 'cat-penalty';
    return 'cat-info';
  };

  return (
    <div className="race-control-panel">
      <div className="panel-header">RACE CONTROL</div>
      <div className="message-feed">
        {sortedMessages.map((msg, idx) => (
          <div key={idx} className={`rc-message animate-slide-in ${getMessageCategoryClass(msg.category)}`}>
            <div className="rc-time">{dayjs(msg.date).format('HH:mm:ss')}</div>
            <div className="rc-text">{msg.message}</div>
          </div>
        ))}
        {sortedMessages.length === 0 && (
          <div className="empty-state">No messages</div>
        )}
      </div>
    </div>
  );
};

export default RaceControl;
