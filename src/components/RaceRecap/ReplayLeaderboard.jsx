import { useMemo } from 'react';
import { TYRE_COLORS, TYRE_ABBREVIATIONS } from '../../data/tyres';

export default function ReplayLeaderboard({ frame, totalLaps, selectedDriver, onSelectDriver }) {
  const sortedDrivers = useMemo(() => {
    if (!frame?.drivers) return [];
    
    // Convert to array and sort by distPct descending
    return Object.entries(frame.drivers)
      .map(([num, data]) => ({ num, ...data }))
      .sort((a, b) => {
        // Push retired to bottom
        if (a.retired && !b.retired) return 1;
        if (!a.retired && b.retired) return -1;
        return (b.distPct || 0) - (a.distPct || 0);
      });
  }, [frame]);

  if (!frame) return <div className="replay-leaderboard glass-panel">Waiting for frame...</div>;

  const leaderDist = sortedDrivers[0]?.distPct || 0;
  // Approximation: a complete lap takes roughly 90 seconds on average
  // So gap in distance = (leader_dist - driver_dist) * totalLaps * 90 seconds
  function formatGap(d) {
    if (d.retired) return 'OUT';
    const diff = leaderDist - d.distPct;
    if (diff <= 0.0001) return 'LEADER';
    
    // Very coarse approximation since we don't have true gap metadata per frame seamlessly
    const gapSeconds = diff * totalLaps * 90;
    
    if (gapSeconds > 90) {
      const lapsDown = Math.floor(gapSeconds / 90);
      return `+${lapsDown} LAP${lapsDown > 1 ? 'S' : ''}`;
    }
    return `+${gapSeconds.toFixed(1)}s`;
  }

  return (
    <div className="replay-leaderboard glass-panel">
      <div className="lb-header">
        <span>POS</span>
        <span>DRIVER</span>
        <span className="text-right">GAP</span>
      </div>
      
      <div className="lb-rows">
        {sortedDrivers.map((d, i) => {
          const isSelected = selectedDriver === d.code;
          const tyreColor = TYRE_COLORS[d.tyre] || TYRE_COLORS.UNKNOWN;
          const tyreAbbr = TYRE_ABBREVIATIONS[d.tyre] || '?';

          return (
            <div 
              key={d.num} 
              className={`lb-row ${d.retired ? 'is-retired' : ''} ${isSelected ? 'is-selected' : ''}`}
              onClick={() => onSelectDriver(isSelected ? null : d.code)}
            >
              <div className="lb-pos">{i + 1}</div>
              <div className="lb-color-strip" style={{ backgroundColor: d.teamColor }}></div>
              <div className="lb-name">{d.code}</div>
              
              <div className="lb-tyre-badge" style={{ borderColor: tyreColor, color: tyreColor }}>
                {tyreAbbr}
              </div>
              
              <div className="lb-gap text-right">
                {formatGap(d)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
