import { useState } from 'react';
import { useLiveStore } from '../../store/liveStore';
import { getTeamColour } from '../../utils/teamColours';
import { TYRE_PALETTE } from '../../utils/tyrePalette';
import { formatLapTime, formatGap, formatSector } from '../../utils/formatters';
import './Leaderboard.css';

const Leaderboard = () => {
  const { drivers, positions, intervals, laps, stints, sessionType } = useLiveStore();
  const [expandedDriver, setExpandedDriver] = useState(null);

  // Helper to find latest data
  const getLatestInterval = (driverNumber) => {
    // intervals array from store, find latest for this driver
    const dInts = intervals.filter(i => i.driver_number === driverNumber);
    if (dInts.length === 0) return null;
    return dInts[dInts.length - 1]; // latest
  };

  const getLatestLap = (driverNumber) => {
    const dLaps = laps.filter(l => l.driver_number === driverNumber);
    if (dLaps.length === 0) return null;
    return dLaps[dLaps.length - 1];
  };

  const getLatestStint = (driverNumber) => {
    const dStints = stints.filter(s => s.driver_number === driverNumber);
    if (dStints.length === 0) return null;
    return dStints[dStints.length - 1];
  };

  const getPitCount = (driverNumber) => {
    const dStints = stints.filter(s => s.driver_number === driverNumber);
    return Math.max(0, dStints.length - 1);
  };

  // Build rows
  const rows = drivers.map(d => {
    const intData = getLatestInterval(d.driver_number);
    const lapData = getLatestLap(d.driver_number);
    const stintData = getLatestStint(d.driver_number);
    const pos = positions[d.driver_number]; // might be the full position obj or just simple

    // Extract values
    const position = pos?.position || intData?.position || d.position || 0;
    const gap = intData?.gap_to_leader || null;
    const interval = intData?.interval || null;
    const lastLapTime = lapData?.lap_duration || null;
    const tyreCompound = stintData?.compound || 'UNKNOWN';
    const tyreAge = stintData?.tyre_age_at_start || 0; // approximate
    const pitCount = getPitCount(d.driver_number);

    return {
      driver: d,
      position,
      gap,
      interval,
      lastLapTime,
      tyreCompound,
      tyreAge,
      pitCount,
      lapData
    };
  }).sort((a, b) => a.position - b.position);

  const toggleRow = (driverNumber) => {
    setExpandedDriver(expandedDriver === driverNumber ? null : driverNumber);
  };

  return (
    <div className="live-leaderboard">
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>POS</th>
            <th>DRIVER</th>
            <th>TEAM</th>
            <th>LAST LAP</th>
            {sessionType === 'Race' || sessionType === 'Sprint' ? (
              <>
                <th>GAP TO LEADER</th>
                <th>INTERVAL</th>
              </>
            ) : (
              <th>BEST LAP</th>
            )}
            <th>TYRE</th>
            <th>LAPS</th>
            <th>PITS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const teamCol = getTeamColour(row.driver.team_name);
            const isP1 = row.position === 1;
            const isExpanded = expandedDriver === row.driver.driver_number;
            const trClass = `leaderboard-row ${isP1 ? 'p1-row' : ''}`;

            return (
              <React.Fragment key={row.driver.driver_number}>
                <tr 
                  className={trClass} 
                  style={{ borderLeft: `4px solid ${teamCol}` }}
                  onClick={() => toggleRow(row.driver.driver_number)}
                >
                  <td className="pos-cell">{row.position || index + 1}</td>
                  <td className="driver-cell">{row.driver.name_acronym}</td>
                  <td className="team-cell">
                    <span className="team-dot" style={{ backgroundColor: teamCol }}></span>
                  </td>
                  <td className="lap-cell">{formatLapTime(row.lastLapTime) || '-'}</td>
                  
                  {sessionType === 'Race' || sessionType === 'Sprint' ? (
                    <>
                      <td className="gap-cell">{formatGap(row.gap) || '-'}</td>
                      <td className="interval-cell">{formatGap(row.interval) || '-'}</td>
                    </>
                  ) : (
                    <td className="best-lap-cell">-</td> // TODO: Best lap calculation
                  )}
                  
                  <td className="tyre-cell">
                    <span className="tyre-icon" style={{ backgroundColor: TYRE_PALETTE[row.tyreCompound] || '#555' }}>
                      {row.tyreCompound ? row.tyreCompound[0] : '?'}
                    </span>
                  </td>
                  <td className="tyre-age-cell">{row.tyreAge}</td>
                  <td className="pit-cell">{row.pitCount}</td>
                </tr>
                {isExpanded && (
                  <tr className="leaderboard-detail-row">
                    <td colSpan="9">
                      <div className="detail-panel">
                        <div className="sector-times">
                          <div className="sector">
                            <span className="sec-label">S1</span>
                            <span className="sec-val">{formatSector(row.lapData?.duration_sector_1) || '-'}</span>
                          </div>
                          <div className="sector">
                            <span className="sec-label">S2</span>
                            <span className="sec-val">{formatSector(row.lapData?.duration_sector_2) || '-'}</span>
                          </div>
                          <div className="sector">
                            <span className="sec-label">S3</span>
                            <span className="sec-val">{formatSector(row.lapData?.duration_sector_3) || '-'}</span>
                          </div>
                          <div className="sector">
                            <span className="sec-label">SPEED TRAP</span>
                            <span className="sec-val">{row.lapData?.st_speed ? `${row.lapData.st_speed} km/h` : '-'}</span>
                          </div>
                        </div>
                        <button className="compare-btn">Add to Compare</button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
