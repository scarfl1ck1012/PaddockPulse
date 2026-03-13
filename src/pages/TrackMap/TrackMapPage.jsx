import React, { useState } from 'react';
import SessionSelector from '../../components/shared/SessionSelector';
import TrackMap from '../../components/live/TrackMap';
import { fetchPositions, fetchDrivers } from '../../api/openf1';

const TrackMapPage = () => {
  const [positions, setPositions] = useState({});
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const processPositions = (posArray) => {
    const posMap = {};
    if (Array.isArray(posArray)) {
        posArray.forEach(p => {
            posMap[p.driver_number] = p; // Keep latest in the fetched array
        });
    }
    return posMap;
  };

  const handleSelectSession = async (sessionKey) => {
    setLoading(true);
    setHasLoaded(true);
    try {
      const [fetchedPos, fetchedDrivers] = await Promise.all([
        fetchPositions(sessionKey),
        fetchDrivers(sessionKey)
      ]);
      setPositions(processPositions(fetchedPos));
      setDrivers(fetchedDrivers || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>TRACK MAP</h1>
      </div>
      
      <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '15px' }}>Select session to view track positions</h3>
        <SessionSelector onSelectSession={handleSelectSession} />
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading telemetry data from OpenF1 API...
        </div>
      ) : hasLoaded ? (
        Object.keys(positions).length > 0 && drivers.length > 0 ? (
          <div className="glass-card" style={{ padding: '20px' }}>
            <TrackMap customDrivers={drivers} customPositions={positions} />
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No position tracking data available for this session.
          </div>
        )
      ) : null}
    </div>
  );
};

export default TrackMapPage;
