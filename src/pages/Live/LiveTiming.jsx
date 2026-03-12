import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  useOpenF1Drivers, useOpenF1Weather, useOpenF1RaceControl,
  useOpenF1Stints, useOpenF1PitStops, useOpenF1Laps,
  useOpenF1Positions
} from '../../hooks/useF1Data';
import { LoadingSkeleton } from '../../components/Common/Common';
import { TYRE_COMPOUNDS, FLAG_TYPES, getTeamColour } from '../../api/constants';
import dayjs from 'dayjs';
import './LiveTiming.css';

function formatLapTime(seconds) {
  if (!seconds) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : `${secs}`;
}

function formatSectorTime(seconds) {
  if (!seconds) return '—';
  return seconds.toFixed(3);
}

// Segment colour codes from OpenF1
function getSegmentColor(code) {
  switch (code) {
    case 2049: return 'var(--f1-green, #00d97e)';   // personal best
    case 2051: return 'var(--f1-purple, #a855f7)';   // overall best
    case 2064: return 'var(--f1-red, #e10600)';       // pit/slow
    case 2048:
    default:   return 'var(--text-muted, #555)';      // normal
  }
}

export default function LiveTiming() {
  const { data: drivers, isLoading: loadingDrivers } = useOpenF1Drivers();
  const { data: weather } = useOpenF1Weather();
  const { data: raceControl } = useOpenF1RaceControl();
  const { data: stints } = useOpenF1Stints();
  const { data: pitStops } = useOpenF1PitStops();
  const { data: lapsData, isLoading: loadingLaps } = useOpenF1Laps();
  const { data: positions } = useOpenF1Positions();

  // Build driver map: number -> driver info
  const driverMap = useMemo(() => {
    const map = {};
    if (drivers) {
      drivers.forEach(d => {
        map[d.driver_number] = d;
      });
    }
    return map;
  }, [drivers]);

  // Get latest position per driver
  const latestPositions = useMemo(() => {
    if (!positions?.length) return {};
    const posMap = {};
    positions.forEach(p => {
      const existing = posMap[p.driver_number];
      if (!existing || new Date(p.date) > new Date(existing.date)) {
        posMap[p.driver_number] = p;
      }
    });
    return posMap;
  }, [positions]);

  // Get last lap per driver
  const lastLaps = useMemo(() => {
    if (!lapsData?.length) return {};
    const lapMap = {};
    lapsData.forEach(l => {
      const existing = lapMap[l.driver_number];
      if (!existing || l.lap_number > existing.lap_number) {
        lapMap[l.driver_number] = l;
      }
    });
    return lapMap;
  }, [lapsData]);

  // Get current stint (latest) per driver
  const currentStints = useMemo(() => {
    if (!stints?.length) return {};
    const stintMap = {};
    stints.forEach(s => {
      const existing = stintMap[s.driver_number];
      if (!existing || s.stint_number > existing.stint_number) {
        stintMap[s.driver_number] = s;
      }
    });
    return stintMap;
  }, [stints]);

  // Build timing tower rows sorted by position
  const towerRows = useMemo(() => {
    const driverNumbers = Object.keys(driverMap).map(Number);
    return driverNumbers
      .map(num => {
        const driver = driverMap[num];
        const pos = latestPositions[num];
        const lap = lastLaps[num];
        const stint = currentStints[num];
        return {
          driverNumber: num,
          name: driver?.name_acronym || `#${num}`,
          fullName: driver?.full_name || '',
          teamName: driver?.team_name || '',
          teamColour: driver?.team_colour ? `#${driver.team_colour}` : getTeamColour(driver?.team_name),
          headshot: driver?.headshot_url,
          position: pos?.position || 99,
          lastLapTime: lap?.lap_duration,
          sector1: lap?.duration_sector_1,
          sector2: lap?.duration_sector_2,
          sector3: lap?.duration_sector_3,
          segments: lap?.segments_sector_1?.concat(lap?.segments_sector_2 || [], lap?.segments_sector_3 || []),
          lapNumber: lap?.lap_number,
          isPitOut: lap?.is_pit_out_lap,
          compound: stint?.compound,
          tyreAge: stint?.tyre_age_at_start != null ?
            (stint.lap_end ? stint.lap_end - stint.lap_start + stint.tyre_age_at_start : stint.tyre_age_at_start) : null,
          stintStart: stint?.lap_start,
          speed: lap?.st_speed,
        };
      })
      .sort((a, b) => a.position - b.position);
  }, [driverMap, latestPositions, lastLaps, currentStints]);

  // Latest weather
  const latestWeather = weather?.[weather.length - 1];

  // Latest race control messages (last 10)
  const rcMessages = useMemo(() => {
    if (!raceControl?.length) return [];
    return raceControl.slice(-12).reverse();
  }, [raceControl]);

  return (
    <div className="page-container" id="live-timing-page">
      <div className="page-header">
        <div className="live-header-row">
          <div>
            <h1 className="page-title">
              <span className="live-dot"></span>
              Live Timing
            </h1>
            <p className="page-subtitle">Session data from the latest session via OpenF1</p>
          </div>
          {latestWeather && (
            <div className="session-info-badges">
              <span className="badge">{latestWeather.air_temperature}°C Air</span>
              <span className="badge">{latestWeather.track_temperature}°C Track</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="live-grid">
        {/* Timing Tower (main column) */}
        <div className="live-tower">
          <div className="tower-header">
            <span className="tower-col pos">P</span>
            <span className="tower-col driver">Driver</span>
            <span className="tower-col tyre">Tyre</span>
            <span className="tower-col sector">S1</span>
            <span className="tower-col sector">S2</span>
            <span className="tower-col sector">S3</span>
            <span className="tower-col laptime">Last Lap</span>
            <span className="tower-col lap-num">Lap</span>
            <span className="tower-col speed">SPD</span>
          </div>

          {loadingDrivers || loadingLaps ? (
            <LoadingSkeleton rows={20} />
          ) : (
            <div className="tower-body stagger-children">
              {towerRows.map((row, idx) => (
                <Link
                  to={`/driver/${row.driverNumber}`}
                  key={row.driverNumber}
                  className={`tower-row tower-row-link ${row.isPitOut ? 'tower-row-pit' : ''}`}
                >
                  <span className="tower-col pos">
                    <span className={`pos-number ${idx < 3 ? 'pos-podium' : ''}`}>{row.position !== 99 ? row.position : '—'}</span>
                  </span>

                  <span className="tower-col driver">
                    <div className="tower-driver-cell">
                      <div className="team-color-bar" style={{ background: row.teamColour, height: 28 }} />
                      <span className="tower-driver-code">{row.name}</span>
                    </div>
                  </span>

                  <span className="tower-col tyre">
                    {row.compound ? (
                      <span
                        className="tyre-badge"
                        style={{
                          background: TYRE_COMPOUNDS[row.compound]?.color || '#666',
                          color: row.compound === 'HARD' ? '#111' : '#fff',
                        }}
                        title={`${row.compound} — Age: ${row.tyreAge ?? '?'} laps`}
                      >
                        {TYRE_COMPOUNDS[row.compound]?.letter || '?'}
                      </span>
                    ) : (
                      <span className="tyre-badge tyre-unknown">?</span>
                    )}
                  </span>

                  <span className="tower-col sector">
                    <span className="sector-time">{formatSectorTime(row.sector1)}</span>
                  </span>
                  <span className="tower-col sector">
                    <span className="sector-time">{formatSectorTime(row.sector2)}</span>
                  </span>
                  <span className="tower-col sector">
                    <span className="sector-time">{formatSectorTime(row.sector3)}</span>
                  </span>

                  <span className="tower-col laptime">
                    <span className={`lap-time ${row.isPitOut ? 'lap-pit' : ''}`}>
                      {row.isPitOut ? 'PIT' : formatLapTime(row.lastLapTime)}
                    </span>
                  </span>

                  <span className="tower-col lap-num">{row.lapNumber || '—'}</span>

                  <span className="tower-col speed">
                    {row.speed ? `${row.speed}` : '—'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar Panels */}
        <div className="live-panels">
          {/* Weather Panel */}
          <div className="glass-card live-panel" id="weather-panel">
            <h3 className="panel-title">🌤️ Weather</h3>
            {latestWeather ? (
              <div className="weather-grid">
                <div className="weather-item">
                  <span className="weather-value">{latestWeather.air_temperature}°</span>
                  <span className="weather-label">Air Temp</span>
                </div>
                <div className="weather-item">
                  <span className="weather-value">{latestWeather.track_temperature}°</span>
                  <span className="weather-label">Track Temp</span>
                </div>
                <div className="weather-item">
                  <span className="weather-value">{latestWeather.humidity}%</span>
                  <span className="weather-label">Humidity</span>
                </div>
                <div className="weather-item">
                  <span className="weather-value">{latestWeather.wind_speed}<small> m/s</small></span>
                  <span className="weather-label">Wind</span>
                </div>
                <div className="weather-item">
                  <span className="weather-value">{latestWeather.pressure}<small> mb</small></span>
                  <span className="weather-label">Pressure</span>
                </div>
                <div className="weather-item">
                  <span className="weather-value">{latestWeather.rainfall === 1 ? '🌧️ Yes' : '☀️ No'}</span>
                  <span className="weather-label">Rain</span>
                </div>
              </div>
            ) : (
              <p className="panel-empty">No weather data</p>
            )}
          </div>

          {/* Race Control Messages */}
          <div className="glass-card live-panel" id="race-control-panel">
            <h3 className="panel-title">🏁 Race Control</h3>
            {rcMessages.length > 0 ? (
              <div className="rc-messages">
                {rcMessages.map((msg, i) => {
                  const flagInfo = msg.flag ? FLAG_TYPES[msg.flag?.toUpperCase()] : null;
                  return (
                    <div key={i} className="rc-msg" style={flagInfo ? { borderLeftColor: flagInfo.color } : {}}>
                      <span className="rc-time">{dayjs(msg.date).format('HH:mm:ss')}</span>
                      <span className="rc-category">{msg.category}</span>
                      <span className="rc-text">{msg.message}</span>
                      {flagInfo && <span className="rc-flag">{flagInfo.emoji}</span>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="panel-empty">No race control messages</p>
            )}
          </div>

          {/* Pit Stops */}
          <div className="glass-card live-panel" id="pit-stops-panel">
            <h3 className="panel-title">🔧 Pit Stops</h3>
            {pitStops?.length > 0 ? (
              <div className="pit-list">
                {pitStops.slice(-10).reverse().map((pit, i) => {
                  const driver = driverMap[pit.driver_number];
                  return (
                    <div key={i} className="pit-row">
                      <div className="team-color-bar" style={{
                        background: driver?.team_colour ? `#${driver.team_colour}` : '#666',
                        height: 20
                      }} />
                      <span className="pit-driver">{driver?.name_acronym || pit.driver_number}</span>
                      <span className="pit-lap">Lap {pit.lap_number}</span>
                      <span className="pit-duration">
                        {pit.pit_duration ? `${pit.pit_duration.toFixed(1)}s` : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="panel-empty">No pit stops recorded</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
