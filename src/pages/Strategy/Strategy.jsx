import { useMemo } from 'react';
import {
  useOpenF1Drivers, useOpenF1Laps, useOpenF1Stints, useOpenF1Positions
} from '../../hooks/useF1Data';
import { LoadingSkeleton } from '../../components/Common/Common';
import { TYRE_COMPOUNDS, getTeamColour } from '../../api/constants';
import MiniChart from '../../components/Charts/MiniChart';
import '../../components/Charts/MiniChart.css';
import './Strategy.css';

function formatLapTime(seconds) {
  if (!seconds) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : `${secs}`;
}

export default function Strategy() {
  const { data: drivers, isLoading: loadingDrivers } = useOpenF1Drivers();
  const { data: allLaps, isLoading: loadingLaps } = useOpenF1Laps();
  const { data: allStints } = useOpenF1Stints();
  const { data: positions } = useOpenF1Positions();

  // Driver map
  const driverMap = useMemo(() => {
    const map = {};
    if (drivers) {
      const seen = new Set();
      drivers.forEach(d => {
        if (!seen.has(d.driver_number)) {
          map[d.driver_number] = d;
          seen.add(d.driver_number);
        }
      });
    }
    return map;
  }, [drivers]);

  // Build stints grouped by driver
  const stintsByDriver = useMemo(() => {
    if (!allStints?.length) return {};
    const map = {};
    allStints.forEach(s => {
      if (!map[s.driver_number]) map[s.driver_number] = [];
      map[s.driver_number].push(s);
    });
    Object.values(map).forEach(arr => arr.sort((a, b) => a.stint_number - b.stint_number));
    return map;
  }, [allStints]);

  // Position timeline — build position-per-lap from positions & laps data
  const positionTimeline = useMemo(() => {
    if (!positions?.length || !allLaps?.length) return { labels: [], series: [] };

    // Get latest position per driver
    const latestPos = {};
    positions.forEach(p => {
      const existing = latestPos[p.driver_number];
      if (!existing || new Date(p.date) > new Date(existing.date)) {
        latestPos[p.driver_number] = p;
      }
    });

    // Pick top 5 drivers by final position
    const top5 = Object.entries(latestPos)
      .filter(([, p]) => p.position != null)
      .sort((a, b) => a[1].position - b[1].position)
      .slice(0, 5)
      .map(([dn]) => Number(dn));

    if (!top5.length) return { labels: [], series: [] };

    // Group laps by driver, sorted by lap number
    const lapsByDriver = {};
    allLaps.forEach(l => {
      if (!lapsByDriver[l.driver_number]) lapsByDriver[l.driver_number] = [];
      lapsByDriver[l.driver_number].push(l);
    });

    // Group positions by driver, sorted by time
    const posByDriver = {};
    positions.forEach(p => {
      if (!posByDriver[p.driver_number]) posByDriver[p.driver_number] = [];
      posByDriver[p.driver_number].push(p);
    });
    Object.values(posByDriver).forEach(arr => arr.sort((a, b) => new Date(a.date) - new Date(b.date)));

    // Find max lap number
    const maxLap = Math.max(...allLaps.map(l => l.lap_number).filter(n => !isNaN(n)));
    if (!maxLap || maxLap <= 0) return { labels: [], series: [] };

    const labels = Array.from({ length: maxLap }, (_, i) => `L${i + 1}`);

    const series = top5.map(dn => {
      const driver = driverMap[dn];
      const driverPositions = posByDriver[dn] || [];

      // For each lap, find the closest position entry
      const driverLaps = (lapsByDriver[dn] || []).sort((a, b) => a.lap_number - b.lap_number);
      const posValues = [];

      for (let lap = 1; lap <= maxLap; lap++) {
        const lapEntry = driverLaps.find(l => l.lap_number === lap);
        if (lapEntry?.date_start) {
          // Find position closest to this lap's time
          const lapTime = new Date(lapEntry.date_start).getTime();
          let closestPos = null;
          let closestDiff = Infinity;
          for (const p of driverPositions) {
            const diff = Math.abs(new Date(p.date).getTime() - lapTime);
            if (diff < closestDiff) {
              closestDiff = diff;
              closestPos = p;
            }
          }
          posValues.push(closestPos?.position || null);
        } else {
          posValues.push(null);
        }
      }

      // Fill gaps with previous value
      for (let i = 1; i < posValues.length; i++) {
        if (posValues[i] === null) posValues[i] = posValues[i - 1];
      }

      const filteredValues = posValues.filter(v => v !== null && !isNaN(v));

      return {
        label: driver?.name_acronym || `#${dn}`,
        values: filteredValues,
        color: driver?.team_colour ? `#${driver.team_colour}` : getTeamColour(driver?.team_name),
        fill: false,
      };
    }).filter(s => s.values.length > 0);

    const minLen = Math.min(...series.map(s => s.values.length));
    return { labels: labels.slice(0, minLen), series };
  }, [allLaps, positions, driverMap]);

  // Tyre degradation — average lap time per compound across all drivers
  const tyreDegradation = useMemo(() => {
    if (!allLaps?.length || !allStints?.length) return [];

    // Build a map of stint compound by driver+lap
    const stintCompoundMap = {};
    allStints.forEach(s => {
      for (let lap = s.lap_start; lap <= (s.lap_end || s.lap_start); lap++) {
        stintCompoundMap[`${s.driver_number}_${lap}`] = s.compound;
      }
    });

    // Group lap times by compound and stint-lap-age
    const compoundData = {};
    allLaps.forEach(l => {
      if (!l.lap_duration || l.is_pit_out_lap || l.lap_duration > 200) return;
      const compound = stintCompoundMap[`${l.driver_number}_${l.lap_number}`];
      if (!compound) return;
      if (!compoundData[compound]) compoundData[compound] = {};

      // Find stint for this driver/lap to compute tyre age
      const driverStints = allStints.filter(s => s.driver_number === l.driver_number);
      const stint = driverStints.find(s => l.lap_number >= s.lap_start && l.lap_number <= (s.lap_end || 999));
      if (!stint) return;
      const tyreLap = l.lap_number - stint.lap_start + 1;
      if (!compoundData[compound][tyreLap]) compoundData[compound][tyreLap] = [];
      compoundData[compound][tyreLap].push(l.lap_duration);
    });

    // Average per tyre-lap
    const result = [];
    ['SOFT', 'MEDIUM', 'HARD'].forEach(compound => {
      const data = compoundData[compound];
      if (!data) return;
      const maxAge = Math.min(30, Math.max(...Object.keys(data).map(Number)));
      const values = [];
      const labels = [];
      for (let age = 1; age <= maxAge; age++) {
        if (data[age]?.length) {
          const avg = data[age].reduce((s, v) => s + v, 0) / data[age].length;
          values.push(avg);
          labels.push(`${age}`);
        }
      }
      if (values.length >= 2) {
        result.push({
          compound,
          series: { label: compound, values, color: TYRE_COMPOUNDS[compound]?.color || '#666', fill: true },
          labels,
        });
      }
    });
    return result;
  }, [allLaps, allStints]);

  // Strategy overview — all drivers' stint bars
  const allDriverStints = useMemo(() => {
    const driverNums = Object.keys(stintsByDriver).map(Number);
    // Sort by final position
    const latestPos = {};
    if (positions?.length) {
      positions.forEach(p => {
        const existing = latestPos[p.driver_number];
        if (!existing || new Date(p.date) > new Date(existing.date)) {
          latestPos[p.driver_number] = p;
        }
      });
    }
    return driverNums
      .map(dn => ({
        driverNumber: dn,
        driver: driverMap[dn],
        stints: stintsByDriver[dn],
        position: latestPos[dn]?.position || 99,
      }))
      .sort((a, b) => a.position - b.position);
  }, [stintsByDriver, driverMap, positions]);

  return (
    <div className="page-container" id="strategy-page">
      <div className="page-header">
        <h1 className="page-title">🧠 Race Strategy</h1>
        <p className="page-subtitle">Tyre degradation, position changes, and stint analysis</p>
      </div>

      {loadingDrivers || loadingLaps ? (
        <LoadingSkeleton rows={10} />
      ) : (
        <>
          {/* Tyre Degradation Charts */}
          <div className="strategy-section">
            <h2 className="section-title">📉 Tyre Degradation</h2>
            <p className="section-desc">Average lap time by tyre age (laps on compound)</p>
            <div className="degradation-grid">
              {tyreDegradation.length > 0 ? (
                tyreDegradation.map((td, i) => (
                  <div key={i} className="glass-card chart-panel">
                    <h3 className="chart-title">
                      <span className="tyre-badge-inline" style={{
                        background: TYRE_COMPOUNDS[td.compound]?.color || '#666',
                        color: td.compound === 'HARD' ? '#111' : '#fff',
                      }}>
                        {TYRE_COMPOUNDS[td.compound]?.letter || '?'}
                      </span>
                      {td.compound}
                    </h3>
                    <MiniChart
                      data={[td.series]}
                      xLabels={td.labels}
                      yLabel="Seconds"
                      height={200}
                    />
                  </div>
                ))
              ) : (
                <div className="glass-card chart-panel" style={{ gridColumn: '1 / -1' }}>
                  <p className="chart-empty">No tyre degradation data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Position Timeline */}
          <div className="strategy-section">
            <h2 className="section-title">📈 Position Changes (Top 5)</h2>
            <div className="glass-card chart-panel">
              {positionTimeline.series.length > 0 ? (
                <>
                  <div className="position-legend">
                    {positionTimeline.series.map((s, i) => (
                      <span key={i} className="pos-legend-item">
                        <span className="legend-dot" style={{ background: s.color }}></span>
                        {s.label}
                      </span>
                    ))}
                  </div>
                  <MiniChart
                    data={positionTimeline.series}
                    xLabels={positionTimeline.labels}
                    yLabel="Position"
                    height={280}
                  />
                </>
              ) : (
                <p className="chart-empty">No position data available</p>
              )}
            </div>
          </div>

          {/* Full Strategy Overview */}
          <div className="strategy-section">
            <h2 className="section-title">🏎️ Strategy Overview</h2>
            <p className="section-desc">Tyre choices and stint lengths for all drivers</p>
            <div className="strategy-overview glass-card">
              {allDriverStints.map((d, i) => {
                const colour = d.driver?.team_colour ? `#${d.driver.team_colour}` : getTeamColour(d.driver?.team_name);
                return (
                  <div key={d.driverNumber} className="strategy-driver-row">
                    <span className="strategy-pos">{d.position !== 99 ? `P${d.position}` : ''}</span>
                    <span className="strategy-code" style={{ color: colour }}>
                      {d.driver?.name_acronym || `#${d.driverNumber}`}
                    </span>
                    <div className="strategy-stints">
                      {d.stints.map((stint, j) => {
                        const compound = TYRE_COMPOUNDS[stint.compound];
                        const lapCount = (stint.lap_end || stint.lap_start) - stint.lap_start + 1;
                        return (
                          <div
                            key={j}
                            className="strategy-stint-bar"
                            style={{
                              flex: lapCount,
                              background: compound?.color ? `${compound.color}20` : 'rgba(255,255,255,0.04)',
                              borderTopColor: compound?.color || '#666',
                            }}
                            title={`${stint.compound || '?'}: L${stint.lap_start}–${stint.lap_end || '?'} (${lapCount}L)`}
                          >
                            <span className="stint-label">
                              {compound?.letter || '?'} · {lapCount}L
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
