import React, { useState } from 'react';
import SessionSelector from '../../components/shared/SessionSelector';
import TyreTracker from '../../components/live/TyreTracker';
import { fetchStints, fetchDrivers } from '../../api/openf1';

const Strategy = () => {
  const [stints, setStints] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const handleSelectSession = async (sessionKey) => {
    setLoading(true);
    setHasLoaded(true);
    try {
      const [fetchedStints, fetchedDrivers] = await Promise.all([
        fetchStints(sessionKey),
        fetchDrivers(sessionKey)
      ]);
      setStints(fetchedStints || []);
      setDrivers(fetchedDrivers || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>RACE STRATEGY</h1>
      </div>
      
      <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '15px' }}>Select session to view historical tyre strategy</h3>
        <SessionSelector onSelectSession={handleSelectSession} />
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading strategy data from OpenF1 API...
        </div>
      ) : hasLoaded ? (
        stints.length > 0 && drivers.length > 0 ? (
          <div className="glass-card">
            <TyreTracker customDrivers={drivers} customStints={stints} />
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No strategy/stint data available for this session.
          </div>
        )
      ) : null}
    </div>
  );
};

export default Strategy;
