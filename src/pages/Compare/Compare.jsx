import { useState, useMemo } from 'react';
import {
  useOpenF1Drivers, useOpenF1Laps, useOpenF1Stints, useOpenF1PitStops
} from '../../hooks/useF1Data';
import { LoadingSkeleton } from '../../components/Common/Common';
import { TYRE_COMPOUNDS, getTeamColour } from '../../api/constants';
import MiniChart from '../../components/Charts/MiniChart';
import '../../components/Charts/MiniChart.css';
import './Compare.css';

function formatLapTime(seconds) {
  if (!seconds) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : `${secs}`;
}

export default function Compare() {
  const [driver1Num, setDriver1Num] = useState(null);
  const [driver2Num, setDriver2Num] = useState(null);

  const { data: drivers, isLoading: loadingDrivers } = useOpenF1Drivers();
  const { data: allLaps, isLoading: loadingLaps } = useOpenF1Laps();
  const { data: allStints } = useOpenF1Stints();
  const { data: allPitStops } = useOpenF1PitStops();

  // Deduplicated driver list for selectors
  const driverOptions = useMemo(() => {
    if (!drivers?.length) return [];
    const seen = new Set();
    return drivers.filter(d => {
      if (seen.has(d.driver_number)) return false;
      seen.add(d.driver_number);
      return true;
    }).sort((a, b) => (a.name_acronym || '').localeCompare(b.name_acronym || ''));
  }, [drivers]);

  // Auto-select first two drivers
  useMemo(() => {
    if (driverOptions.length >= 2 && driver1Num === null && driver2Num === null) {
      setDriver1Num(driverOptions[0].driver_number);
      setDriver2Num(driverOptions[1].driver_number);
    }
  }, [driverOptions]);

  const d1 = useMemo(() => driverOptions.find(d => d.driver_number === driver1Num), [driverOptions, driver1Num]);
  const d2 = useMemo(() => driverOptions.find(d => d.driver_number === driver2Num), [driverOptions, driver2Num]);

  const d1Colour = d1?.team_colour ? `#${d1.team_colour}` : getTeamColour(d1?.team_name);
  const d2Colour = d2?.team_colour ? `#${d2.team_colour}` : getTeamColour(d2?.team_name);

  // Laps per driver
  const getLaps = (num) => {
    if (!allLaps?.length || !num) return [];
    return allLaps.filter(l => l.driver_number === num).sort((a, b) => a.lap_number - b.lap_number);
  };
  const d1Laps = useMemo(() => getLaps(driver1Num), [allLaps, driver1Num]);
  const d2Laps = useMemo(() => getLaps(driver2Num), [allLaps, driver2Num]);

  // Stints per driver
  const getStints = (num) => {
    if (!allStints?.length || !num) return [];
    return allStints.filter(s => s.driver_number === num).sort((a, b) => a.stint_number - b.stint_number);
  };
  const d1Stints = useMemo(() => getStints(driver1Num), [allStints, driver1Num]);
  const d2Stints = useMemo(() => getStints(driver2Num), [allStints, driver2Num]);

  // Pit stops per driver
  const getPits = (num) => {
    if (!allPitStops?.length || !num) return [];
    return allPitStops.filter(p => p.driver_number === num).sort((a, b) => a.lap_number - b.lap_number);
  };
  const d1Pits = useMemo(() => getPits(driver1Num), [allPitStops, driver1Num]);
  const d2Pits = useMemo(() => getPits(driver2Num), [allPitStops, driver2Num]);

  // Stats for a driver
  const getStats = (laps, pits) => {
    const valid = laps.filter(l => l.lap_duration && !l.is_pit_out_lap && l.lap_duration < 200);
    const best = valid.length ? Math.min(...valid.map(l => l.lap_duration)) : null;
    const avg = valid.length ? valid.reduce((s, l) => s + l.lap_duration, 0) / valid.length : null;
    const topSpeed = laps.filter(l => l.st_speed).reduce((max, l) => Math.max(max, l.st_speed), 0);
    return { best, avg, totalLaps: laps.length, pitStops: pits.length, topSpeed: topSpeed || null };
  };

  const d1Stats = useMemo(() => getStats(d1Laps, d1Pits), [d1Laps, d1Pits]);
  const d2Stats = useMemo(() => getStats(d2Laps, d2Pits), [d2Laps, d2Pits]);

  // Overlay lap time chart
  const lapTimeOverlay = useMemo(() => {
    const v1 = d1Laps.filter(l => l.lap_duration && !l.is_pit_out_lap && l.lap_duration < 200);
    const v2 = d2Laps.filter(l => l.lap_duration && !l.is_pit_out_lap && l.lap_duration < 200);
    const maxLen = Math.max(v1.length, v2.length);
    const labels = Array.from({ length: maxLen }, (_, i) => `L${i + 1}`);
    const series = [];
    if (v1.length) series.push({ label: d1?.name_acronym || '', values: v1.map(l => l.lap_duration), color: d1Colour, fill: false });
    if (v2.length) series.push({ label: d2?.name_acronym || '', values: v2.map(l => l.lap_duration), color: d2Colour, fill: false });
    return { series, labels };
  }, [d1Laps, d2Laps, d1, d2, d1Colour, d2Colour]);

  // Delta chart (d1 lap time - d2 lap time per lap)
  const deltaChart = useMemo(() => {
    const v1Map = {};
    const v2Map = {};
    d1Laps.filter(l => l.lap_duration && !l.is_pit_out_lap && l.lap_duration < 200)
      .forEach(l => { v1Map[l.lap_number] = l.lap_duration; });
    d2Laps.filter(l => l.lap_duration && !l.is_pit_out_lap && l.lap_duration < 200)
      .forEach(l => { v2Map[l.lap_number] = l.lap_duration; });

    const commonLaps = Object.keys(v1Map)
      .filter(n => v2Map[n])
      .map(Number)
      .sort((a, b) => a - b);

    if (!commonLaps.length) return { series: [], labels: [] };

    let cumDelta = 0;
    const deltas = commonLaps.map(n => {
      cumDelta += v1Map[n] - v2Map[n];
      return cumDelta;
    });

    return {
      series: [{ label: 'Delta', values: deltas, color: '#f5a623', fill: true }],
      labels: commonLaps.map(n => `L${n}`),
    };
  }, [d1Laps, d2Laps]);

  // Speed overlay
  const speedOverlay = useMemo(() => {
    const v1 = d1Laps.filter(l => l.st_speed);
    const v2 = d2Laps.filter(l => l.st_speed);
    const series = [];
    if (v1.length) series.push({ label: d1?.name_acronym || '', values: v1.map(l => l.st_speed), color: d1Colour, fill: false });
    if (v2.length) series.push({ label: d2?.name_acronym || '', values: v2.map(l => l.st_speed), color: d2Colour, fill: false });
    const maxLen = Math.max(v1.length, v2.length);
    return { series, labels: Array.from({ length: maxLen }, (_, i) => `L${i + 1}`) };
  }, [d1Laps, d2Laps, d1, d2, d1Colour, d2Colour]);

  const isBetter = (a, b, lower = true) => {
    if (a == null || b == null) return 'neutral';
    return lower ? (a < b ? 'better' : a > b ? 'worse' : 'neutral') : (a > b ? 'better' : a < b ? 'worse' : 'neutral');
  };

  return (
    <div className="page-container" id="compare-page">
      <div className="page-header">
        <h1 className="page-title">⚔️ Head-to-Head</h1>
        <p className="page-subtitle">Compare two drivers from the latest session</p>
      </div>

      {/* Driver Selectors */}
      <div className="compare-selectors">
        <div className="selector-card glass-card" style={{ borderTopColor: d1Colour }}>
          <select
            className="driver-select"
            value={driver1Num || ''}
            onChange={e => setDriver1Num(Number(e.target.value))}
          >
            <option value="">Select Driver 1</option>
            {driverOptions.map(d => (
              <option key={d.driver_number} value={d.driver_number}>
                {d.name_acronym} — {d.full_name}
              </option>
            ))}
          </select>
          {d1 && (
            <div className="selector-info">
              {d1.headshot_url && <img src={d1.headshot_url} alt={d1.full_name} className="selector-headshot" />}
              <div>
                <div className="selector-name">{d1.full_name}</div>
                <div className="selector-team">{d1.team_name}</div>
              </div>
            </div>
          )}
        </div>

        <div className="vs-badge">VS</div>

        <div className="selector-card glass-card" style={{ borderTopColor: d2Colour }}>
          <select
            className="driver-select"
            value={driver2Num || ''}
            onChange={e => setDriver2Num(Number(e.target.value))}
          >
            <option value="">Select Driver 2</option>
            {driverOptions.map(d => (
              <option key={d.driver_number} value={d.driver_number}>
                {d.name_acronym} — {d.full_name}
              </option>
            ))}
          </select>
          {d2 && (
            <div className="selector-info">
              {d2.headshot_url && <img src={d2.headshot_url} alt={d2.full_name} className="selector-headshot" />}
              <div>
                <div className="selector-name">{d2.full_name}</div>
                <div className="selector-team">{d2.team_name}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {loadingDrivers || loadingLaps ? (
        <LoadingSkeleton rows={8} />
      ) : driver1Num && driver2Num ? (
        <>
          {/* Stats Comparison */}
          <div className="stats-comparison glass-card">
            <h3 className="compare-section-title">📊 Session Stats</h3>
            <div className="stats-grid">
              <StatRow
                label="Best Lap"
                v1={formatLapTime(d1Stats.best)}
                v2={formatLapTime(d2Stats.best)}
                highlight={isBetter(d1Stats.best, d2Stats.best)}
                color1={d1Colour} color2={d2Colour}
              />
              <StatRow
                label="Avg Lap"
                v1={formatLapTime(d1Stats.avg)}
                v2={formatLapTime(d2Stats.avg)}
                highlight={isBetter(d1Stats.avg, d2Stats.avg)}
                color1={d1Colour} color2={d2Colour}
              />
              <StatRow
                label="Top Speed"
                v1={d1Stats.topSpeed ? `${d1Stats.topSpeed} km/h` : '—'}
                v2={d2Stats.topSpeed ? `${d2Stats.topSpeed} km/h` : '—'}
                highlight={isBetter(d1Stats.topSpeed, d2Stats.topSpeed, false)}
                color1={d1Colour} color2={d2Colour}
              />
              <StatRow
                label="Laps"
                v1={d1Stats.totalLaps}
                v2={d2Stats.totalLaps}
                highlight="neutral"
                color1={d1Colour} color2={d2Colour}
              />
              <StatRow
                label="Pit Stops"
                v1={d1Stats.pitStops}
                v2={d2Stats.pitStops}
                highlight="neutral"
                color1={d1Colour} color2={d2Colour}
              />
            </div>
          </div>

          {/* Charts */}
          <div className="compare-charts">
            {/* Lap Time Overlay */}
            <div className="glass-card chart-panel compare-chart-wide">
              <h3 className="chart-title">
                ⏱️ Lap Times
                <span className="chart-legend">
                  <span className="legend-dot" style={{ background: d1Colour }}></span>{d1?.name_acronym}
                  <span className="legend-dot" style={{ background: d2Colour }}></span>{d2?.name_acronym}
                </span>
              </h3>
              {lapTimeOverlay.series.length > 0 ? (
                <MiniChart data={lapTimeOverlay.series} xLabels={lapTimeOverlay.labels} yLabel="Seconds" height={260} />
              ) : (
                <p className="chart-empty">No comparable lap data</p>
              )}
            </div>

            {/* Cumulative Delta */}
            <div className="glass-card chart-panel compare-chart-wide">
              <h3 className="chart-title">
                📐 Cumulative Gap
                <span className="chart-legend-hint">
                  Positive = {d1?.name_acronym} behind · Negative = {d1?.name_acronym} ahead
                </span>
              </h3>
              {deltaChart.series.length > 0 ? (
                <MiniChart data={deltaChart.series} xLabels={deltaChart.labels} yLabel="Δ Seconds" height={220} />
              ) : (
                <p className="chart-empty">No common laps to compare</p>
              )}
            </div>

            {/* Speed Overlay */}
            <div className="glass-card chart-panel compare-chart-wide">
              <h3 className="chart-title">
                🏁 Speed Trap
                <span className="chart-legend">
                  <span className="legend-dot" style={{ background: d1Colour }}></span>{d1?.name_acronym}
                  <span className="legend-dot" style={{ background: d2Colour }}></span>{d2?.name_acronym}
                </span>
              </h3>
              {speedOverlay.series.length > 0 ? (
                <MiniChart data={speedOverlay.series} xLabels={speedOverlay.labels} yLabel="km/h" height={220} />
              ) : (
                <p className="chart-empty">No speed data</p>
              )}
            </div>
          </div>

          {/* Stint Comparison */}
          <div className="glass-card stint-compare-panel">
            <h3 className="compare-section-title">🏎️ Strategy Comparison</h3>
            <StintRow label={d1?.name_acronym} stints={d1Stints} colour={d1Colour} />
            <StintRow label={d2?.name_acronym} stints={d2Stints} colour={d2Colour} />
          </div>
        </>
      ) : (
        <div className="compare-empty glass-card">
          <p>Select two drivers above to begin comparison</p>
        </div>
      )}
    </div>
  );
}

function StatRow({ label, v1, v2, highlight, color1, color2 }) {
  return (
    <div className="stat-row">
      <span className={`stat-cell stat-left ${highlight === 'better' ? 'stat-winner' : ''}`} style={highlight === 'better' ? { color: color1 } : {}}>
        {v1}
      </span>
      <span className="stat-label">{label}</span>
      <span className={`stat-cell stat-right ${highlight === 'worse' ? 'stat-winner' : ''}`} style={highlight === 'worse' ? { color: color2 } : {}}>
        {v2}
      </span>
    </div>
  );
}

function StintRow({ label, stints, colour }) {
  return (
    <div className="stint-compare-row">
      <span className="stint-driver-label" style={{ color: colour }}>{label}</span>
      <div className="stint-bar-row">
        {stints.map((stint, i) => {
          const compound = TYRE_COMPOUNDS[stint.compound];
          const lapCount = (stint.lap_end || stint.lap_start) - stint.lap_start + 1;
          return (
            <div
              key={i}
              className="stint-bar-block"
              style={{ flex: lapCount, borderTopColor: compound?.color || '#666' }}
              title={`${stint.compound || '?'}: L${stint.lap_start}–${stint.lap_end || '?'} (${lapCount} laps)`}
            >
              <span className="stint-bar-letter" style={{
                background: compound?.color || '#666',
                color: stint.compound === 'HARD' ? '#111' : '#fff',
              }}>
                {compound?.letter || '?'}
              </span>
              <span className="stint-bar-laps">{lapCount}L</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
