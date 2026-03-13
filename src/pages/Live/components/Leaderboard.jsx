import React, { useState } from 'react';
import useLiveStore from '../../../store/liveStore';
import { getTeamColour } from '../../../utils/teamColours';
import { getTyreCompound } from '../../../utils/tyrePalette';
import { formatLapTime, formatGap } from '../../../utils/formatters';
import './Leaderboard.css';

const DriverRow = ({ driver, position }) => {
  const [expanded, setExpanded] = useState(false);
  
  // These properties will come from the OpenF1 APIs (locations, intervals, stints, etc.)
  // Providing fallbacks if the data is building up.
  const teamColour = getTeamColour(driver.team_name, driver.team_colour);
  const tyre = getTyreCompound(driver.tyre_compound);
  
  return (
    <>
      <div 
        className={`driver-row ${expanded ? 'expanded' : ''}`} 
        onClick={() => setExpanded(!expanded)}
        style={{ borderLeft: `4px solid ${teamColour}` }}
      >
        <div className="pos-col">{position}</div>
        <div className="name-col">
          <span className="driver-tla">{driver.name_acronym || 'TBA'}</span>
        </div>
        
        <div className="tyre-col">
          <span 
            className="tyre-badge" 
            style={{ 
              borderColor: tyre.color, 
              color: tyre.id === 'HARD' ? '#000' : (tyre.id === 'UNKNOWN' ? '#fff' : tyre.color),
              backgroundColor: tyre.id === 'HARD' ? '#fff' : 'transparent'
            }}
          >
            {tyre.letter}
          </span>
          <span className="tyre-age">{driver.tyre_age || 0}L</span>
        </div>
        
        <div className="time-col gap-col">
          {position === 1 ? 'LEADER' : formatGap(driver.gap_to_leader) || '--'}
        </div>
        
        <div className="time-col interval-col">
          {position === 1 ? '' : formatGap(driver.interval) || '--'}
        </div>
        
        <div className={`time-col lap-time-col ${driver.personal_best ? 'pb' : ''} ${driver.overall_fastest ? 'purple' : ''}`}>
          {formatLapTime(driver.last_lap_time) || 'NO TIME'}
        </div>
      </div>
      
      {/* Expanded details: Sectors & Actions */}
      {expanded && (
        <div className="driver-details-panel" style={{ borderLeft: `4px solid ${teamColour}` }}>
          <div className="sectors-grid">
            <div className={`sector-box ${driver.s1_pb ? 'pb' : ''} ${driver.s1_purple ? 'purple' : ''}`}>
              <span className="label">S1</span>
              <span className="value">{driver.sector_1 ? driver.sector_1.toFixed(3) : '--'}</span>
            </div>
            <div className={`sector-box ${driver.s2_pb ? 'pb' : ''} ${driver.s2_purple ? 'purple' : ''}`}>
              <span className="label">S2</span>
              <span className="value">{driver.sector_2 ? driver.sector_2.toFixed(3) : '--'}</span>
            </div>
            <div className={`sector-box ${driver.s3_pb ? 'pb' : ''} ${driver.s3_purple ? 'purple' : ''}`}>
              <span className="label">S3</span>
              <span className="value">{driver.sector_3 ? driver.sector_3.toFixed(3) : '--'}</span>
            </div>
          </div>
          <div className="action-row">
            <span className="pit-count">Pits: {driver.pit_count || 0}</span>
            <a href={`/compare?d1=${driver.driver_number}`} className="compare-btn">Compare</a>
          </div>
        </div>
      )}
    </>
  );
};

export default function Leaderboard() {
  const { leaderboard } = useLiveStore();

  return (
    <div className="live-leaderboard">
      <div className="panel-header">
        <h3>Timing Tower</h3>
        <span className="badge badge-live">LIVE</span>
      </div>
      
      <div className="leaderboard-header-row">
        <div className="pos-col">P</div>
        <div className="name-col">DRIVER</div>
        <div className="tyre-col">TYRE</div>
        <div className="time-col gap-col">GAP</div>
        <div className="time-col interval-col">INT</div>
        <div className="time-col lap-time-col">LAST LAP</div>
      </div>
      
      <div className="leaderboard-content">
        {leaderboard.length === 0 ? (
          <div className="empty-state">
            <p>Waiting for timing data...</p>
            <span className="loading-spinner"></span>
          </div>
        ) : (
          <div className="driver-list">
            {leaderboard.map((driver, idx) => (
              <DriverRow key={driver.driver_number || idx} driver={driver} position={idx + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
