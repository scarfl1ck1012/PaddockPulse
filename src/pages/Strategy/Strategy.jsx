import React from 'react';
import { Link } from 'react-router-dom';

const Strategy = () => (
  <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-primary)' }}>
    <h2>Strategy is now part of the Live Timing dashboard.</h2>
    <br/>
    <Link to="/live" style={{ color: 'var(--accent-red)', fontSize: '1.2rem', textDecoration: 'underline' }}>
      Go to Live Timing →
    </Link>
  </div>
);

export default Strategy;
