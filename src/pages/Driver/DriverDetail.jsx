import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useOpenF1Drivers, useOpenF1Laps, useOpenF1Stints, useOpenF1PitStops
} from '../../hooks/useF1Data';
import { LoadingSkeleton } from '../../components/Common/Common';
import { TYRE_COMPOUNDS, getTeamColour } from '../../api/constants';
import MiniChart from '../../components/Charts/MiniChart';
import '../../components/Charts/MiniChart.css';
import './DriverDetail.css';

function formatLapTime(seconds) {
  if (!seconds) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : `${secs}`;
}

export default function DriverDetail() {
  const { driverNumber } = useParams();
  const num = Number(driverNumber);

  const { data: drivers, isLoading: loadingDrivers } = useOpenF1Drivers();
  const { data: allLaps, isLoading: loadingLaps } = useOpenF1Laps('latest', num);
  const { data: allStints } = useOpenF1Stints();
  const { data: allPitStops } = useOpenF1PitStops();

  // Find this driver
  const driver = useMemo(() => {
    if (!drivers?.length) return null;
    return drivers.find(d => d.driver_number === num);
  }, [drivers, num]);

  // Driver stints
  const driverStints = useMemo(() => {
    if (!allStints?.length) return [];
    return allStints
      .filter(s => s.driver_number === num)
      .sort((a, b) => a.stint_number - b.stint_number);
  }, [allStints, num]);

  // Driver pit stops
  const driverPits = useMemo(() => {
    if (!allPitStops?.length) return [];
    return allPitStops.filter(p => p.driver_number === num).sort((a, b) => a.lap_number - b.lap_number);
  }, [allPitStops, num]);

  // Sorted laps
  const laps = useMemo(() => {
    if (!allLaps?.length) return [];
    return [...allLaps].sort((a, b) => a.lap_number - b.lap_number);
  }, [allLaps]);

  // Lap time chart data
  const lapChartData = useMemo(() => {
    if (!laps.length) return { series: [], labels: [] };
    const valid = laps.filter(l => l.lap_duration && !l.is_pit_out_lap && l.lap_duration < 200);
    const teamColour = driver?.team_colour ? `#${driver.team_colour}` : getTeamColour(driver?.team_name);
    return {
      series: [{ label: 'Lap Time', values: valid.map(l => l.lap_duration), color: teamColour, fill: true }],
      labels: valid.map(l => `L${l.lap_number}`),
    };
  }, [laps, driver]);

  // Speed trap chart data
  const speedChartData = useMemo(() => {
    if (!laps.length) return { series: [], labels: [] };
    const valid = laps.filter(l => l.st_speed);
    return {
      series: [{ label: 'Speed Trap', values: valid.map(l => l.st_speed), color: '#3b82f6', fill: true }],
      labels: valid.map(l => `L${l.lap_number}`),
    };
  }, [laps]);

  // Sector time charts
  const sectorChartData = useMemo(() => {
    if (!laps.length) return [];
    return [1, 2, 3].map(sec => {
      const key = `duration_sector_${sec}`;
      const valid = laps.filter(l => l[key]);
      const colors = ['#00d97e', '#f5a623', '#a855f7'];
      return {
        series: [{ label: `S${sec}`, values: valid.map(l => l[key]), color: colors[sec - 1], fill: true }],
        labels: valid.map(l => `L${l.lap_number}`),
      };
    });
  }, [laps]);

  // Best lap
  const bestLap = useMemo(() => {
    if (!laps.length) return null;
    const valid = laps.filter(l => l.lap_duration && !l.is_pit_out_lap);
    if (!valid.length) return null;
    return valid.reduce((best, l) => l.lap_duration < best.lap_duration ? l : best, valid[0]);
  }, [laps]);

  // Average lap
  const avgLap = useMemo(() => {
    const valid = laps.filter(l => l.lap_duration && !l.is_pit_out_lap && l.lap_duration < 200);
    if (!valid.length) return null;
    return valid.reduce((sum, l) => sum + l.lap_duration, 0) / valid.length;
  }, [laps]);

  const teamColour = driver?.team_colour ? `#${driver.team_colour}` : getTeamColour(driver?.team_name);

  if (loadingDrivers || loadingLaps) {
    return (
      <div className="page-container">
        <LoadingSkeleton rows={10} />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="page-container">
        <h2>Driver not found</h2>
        <Link to="/live" className="btn btn-ghost">← Back to Live</Link>
      </div>
    );
  }

  return (
    <div className="page-container" id="driver-detail-page">
      <div className="page-header">
        <Link to="/live" className="back-link">← Back to Live Timing</Link>
      </div>

      {/* Driver Hero Card */}
      <div className="driver-hero glass-card">
        <div className="hero-color-stripe" style={{ background: teamColour }} />
        <div className="hero-info">
          {driver.headshot_url && (
            <img src={driver.headshot_url} alt={driver.full_name} className="hero-headshot" />
          )}
          <div className="hero-text">
            <div className="hero-number" style={{ color: teamColour }}>#{driver.driver_number}</div>
            <h1 className="hero-name">{driver.full_name}</h1>
            <div className="hero-team">{driver.team_name}</div>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-value">{bestLap ? formatLapTime(bestLap.lap_duration) : '—'}</span>
              <span className="stat-label">Best Lap</span>
            </div>
            <div className="hero-stat">
              <span className="stat-value">{avgLap ? formatLapTime(avgLap) : '—'}</span>
              <span className="stat-label">Avg Lap</span>
            </div>
            <div className="hero-stat">
              <span className="stat-value">{laps.length}</span>
              <span className="stat-label">Laps</span>
            </div>
            <div className="hero-stat">
              <span className="stat-value">{driverPits.length}</span>
              <span className="stat-label">Pit Stops</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="telemetry-grid">
        {/* Lap Time Trend */}
        <div className="glass-card chart-panel">
          <h3 className="chart-title">⏱️ Lap Time Trend</h3>
          {lapChartData.series.length > 0 ? (
            <MiniChart
              data={lapChartData.series}
              xLabels={lapChartData.labels}
              yLabel="Seconds"
              height={240}
              showDots={laps.length <= 20}
            />
          ) : (
            <p className="chart-empty">No lap time data available</p>
          )}
        </div>

        {/* Speed Trap */}
        <div className="glass-card chart-panel">
          <h3 className="chart-title">🏁 Speed Trap (km/h)</h3>
          {speedChartData.series.length > 0 ? (
            <MiniChart
              data={speedChartData.series}
              xLabels={speedChartData.labels}
              yLabel="km/h"
              height={240}
              showDots={laps.length <= 20}
            />
          ) : (
            <p className="chart-empty">No speed data available</p>
          )}
        </div>

        {/* Sector Times */}
        {sectorChartData.map((sd, idx) => (
          <div key={idx} className="glass-card chart-panel chart-panel-sector">
            <h3 className="chart-title">Sector {idx + 1}</h3>
            {sd.series.length > 0 && sd.series[0].values.length > 0 ? (
              <MiniChart
                data={sd.series}
                xLabels={sd.labels}
                height={160}
              />
            ) : (
              <p className="chart-empty">No sector data</p>
            )}
          </div>
        ))}
      </div>

      {/* Stint History Timeline */}
      <div className="glass-card stint-panel">
        <h3 className="chart-title">🏎️ Stint History</h3>
        {driverStints.length > 0 ? (
          <div className="stint-timeline">
            {driverStints.map((stint, i) => {
              const compound = TYRE_COMPOUNDS[stint.compound];
              const lapCount = (stint.lap_end || stint.lap_start) - stint.lap_start + 1;
              const tyreAge = stint.tyre_age_at_start || 0;
              return (
                <div key={i} className="stint-block" style={{
                  flex: lapCount,
                  borderTop: `3px solid ${compound?.color || '#666'}`,
                }}>
                  <div className="stint-compound">
                    <span className="tyre-badge" style={{
                      background: compound?.color || '#666',
                      color: stint.compound === 'HARD' ? '#111' : '#fff',
                    }}>
                      {compound?.letter || '?'}
                    </span>
                  </div>
                  <span className="stint-laps">L{stint.lap_start}–{stint.lap_end || '?'}</span>
                  <span className="stint-meta">{lapCount} laps{tyreAge > 0 ? ` (${tyreAge} used)` : ''}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="chart-empty">No stint data</p>
        )}
      </div>

      {/* Pit Stops Table */}
      {driverPits.length > 0 && (
        <div className="glass-card pit-panel">
          <h3 className="chart-title">🔧 Pit Stops</h3>
          <div className="pit-table">
            <div className="pit-table-header">
              <span>Stop</span>
              <span>Lap</span>
              <span>Duration</span>
            </div>
            {driverPits.map((pit, i) => (
              <div key={i} className="pit-table-row">
                <span className="pit-stop-num">{i + 1}</span>
                <span>Lap {pit.lap_number}</span>
                <span className="pit-dur">{pit.pit_duration ? `${pit.pit_duration.toFixed(1)}s` : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
