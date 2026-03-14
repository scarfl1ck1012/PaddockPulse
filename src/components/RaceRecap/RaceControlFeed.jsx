import React, { useMemo } from 'react';

export default function RaceControlFeed({ raceControlLogs, currentT }) {
  // Filter messages that happened BEFORE current time
  const visibleMsgs = useMemo(() => {
    if (!raceControlLogs || !currentT) return [];
    
    // Sort oldest first
    const sorted = [...raceControlLogs].sort((a,b) => new Date(a.date) - new Date(b.date));
    
    // Assume first message is race start (T=0)
    if (sorted.length === 0) return [];
    const raceStart = new Date(sorted[0].date).getTime() / 1000;
    
    // Filter to ones before current relative time, reverse to show newest at top
    return sorted
      .filter(m => (new Date(m.date).getTime() / 1000) - raceStart <= currentT)
      .reverse()
      .slice(0, 8); // show max 8
  }, [raceControlLogs, currentT]);

  if (!visibleMsgs || visibleMsgs.length === 0) {
    return <div className="rc-feed glass-panel empty">No Race Control Messages</div>;
  }

  function getFlagClass(msg) {
    const f = (msg.flag || '').toUpperCase();
    const c = (msg.category || '').toUpperCase();
    if (f === 'GREEN') return 'flag-green';
    if (f === 'YELLOW' || f === 'DOUBLE YELLOW') return 'flag-yellow';
    if (f === 'RED') return 'flag-red';
    if (f === 'CHEQUERED') return 'flag-chequered';
    if (c === 'SAFETYCAR' || c === 'VSC') return 'flag-sc';
    if (c === 'DRS') return 'flag-drs';
    return '';
  }

  return (
    <div className="rc-feed glass-panel">
      <h3>Race Control</h3>
      <div className="rc-feed-list">
        {visibleMsgs.map((msg, idx) => (
          <div key={idx} className={`rc-msg ${getFlagClass(msg)}`}>
            {msg.message}
          </div>
        ))}
      </div>
    </div>
  );
}
