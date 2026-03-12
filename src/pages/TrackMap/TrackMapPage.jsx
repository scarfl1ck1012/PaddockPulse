import { useMemo } from 'react';
import { useOpenF1Drivers } from '../../hooks/useF1Data';
import { useQuery } from '@tanstack/react-query';
import * as openf1 from '../../api/openf1';
import { LoadingSkeleton } from '../../components/Common/Common';
import TrackMap from '../../components/TrackMap/TrackMap';
import '../../components/TrackMap/TrackMap.css';
import './TrackMapPage.css';

export default function TrackMapPage() {
  // Fetch sessions to find one with location data (race sessions are most reliable)
  const { data: sessions } = useQuery({
    queryKey: ['openf1LatestSession'],
    queryFn: () => openf1.fetchSessions(),
    staleTime: 5 * 60 * 1000,
  });

  // Find the most recent Race session (these reliably have location data)
  const { sessionKey, sessionInfo } = useMemo(() => {
    if (!sessions?.length) return { sessionKey: null, sessionInfo: null };
    const sorted = [...sessions].sort((a, b) => new Date(b.date_start) - new Date(a.date_start));
    // Prefer race sessions, then qualifying, then any
    const raceSessions = sorted.filter(s =>
      s.session_name?.toLowerCase().includes('race') ||
      s.session_type === 'Race'
    );
    const best = raceSessions[0] || sorted[0];
    return { sessionKey: best?.session_key, sessionInfo: best };
  }, [sessions]);

  const sessionName = sessionInfo
    ? `${sessionInfo.session_name} — ${sessionInfo.meeting_name || sessionInfo.circuit_short_name || ''}`
    : '';

  const { data: drivers, isLoading: loadingDrivers } = useOpenF1Drivers(sessionKey || 'latest');

  // Fetch location for one driver (first unique) for track outline
  const firstDriverNumber = useMemo(() => {
    if (!drivers?.length) return null;
    const seen = new Set();
    const unique = drivers.filter(d => {
      if (seen.has(d.driver_number)) return false;
      seen.add(d.driver_number);
      return true;
    });
    return unique[0]?.driver_number;
  }, [drivers]);

  const { data: trackLocationData, isLoading: loadingTrackOutline, isError: locationError } = useQuery({
    queryKey: ['openf1LocationOutline', sessionKey, firstDriverNumber],
    queryFn: () => openf1.fetchLocation(sessionKey, firstDriverNumber),
    enabled: !!sessionKey && !!firstDriverNumber,
    staleTime: 60 * 1000,
    retry: 1,
  });

  const hasLocationData = trackLocationData?.length > 0;

  return (
    <div className="page-container" id="track-map-page">
      <div className="page-header">
        <h1 className="page-title">🗺️ Track Map</h1>
        <p className="page-subtitle">
          {sessionName || 'Driver positions on circuit from the latest session'}
        </p>
      </div>

      <div className="track-map-wrapper glass-card">
        {(!sessionKey || loadingDrivers || loadingTrackOutline) && !locationError ? (
          <div className="track-map-loading">
            <LoadingSkeleton rows={4} />
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-4)' }}>
              Loading track data… This may take a moment.
            </p>
          </div>
        ) : hasLocationData ? (
          <TrackMap
            locationData={trackLocationData}
            drivers={drivers || []}
            width={900}
            height={600}
          />
        ) : (
          <div className="track-map-unavailable">
            <div className="unavailable-icon">🏁</div>
            <h3>Location Data Unavailable</h3>
            <p>
              Track location data is only available for certain sessions (typically races).
              {sessionName && <><br/>Current session: <strong>{sessionName}</strong></>}
            </p>
            <p className="unavailable-hint">
              The track map will automatically populate when location-enabled session data becomes available from OpenF1.
            </p>
          </div>
        )}
      </div>

      {/* Driver Legend */}
      {drivers?.length > 0 && (
        <div className="track-legend glass-card">
          <h3 className="track-legend-title">Drivers</h3>
          <div className="track-legend-grid">
            {drivers
              .filter((d, i, arr) => arr.findIndex(x => x.driver_number === d.driver_number) === i)
              .map(d => (
                <div key={d.driver_number} className="legend-item">
                  <span
                    className="legend-dot"
                    style={{ background: d.team_colour ? `#${d.team_colour}` : '#666' }}
                  />
                  <span className="legend-code">{d.name_acronym}</span>
                  <span className="legend-team">{d.team_name}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
