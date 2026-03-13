import React from 'react';
import { Link } from 'react-router-dom';

const TrackMapPage = () => (
  <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-primary)' }}>
    <h2>Track Map is now part of the Live Timing dashboard.</h2>
    <br/>
    <Link to="/live" style={{ color: 'var(--accent-red)', fontSize: '1.2rem', textDecoration: 'underline' }}>
      Go to Live Timing →
    </Link>
  </div>
);

export default TrackMapPage;
