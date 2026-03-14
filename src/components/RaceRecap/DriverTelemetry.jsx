import React from 'react';

export default function DriverTelemetry({ frame, selectedDriver }) {
  if (!selectedDriver || !frame?.drivers?.[selectedDriver]) return null;
  const d = frame.drivers[selectedDriver];

  // Colors mapping based on F1 TV graphic
  const throttleWidth = Math.min(100, Math.max(0, d.throttle || 0));
  
  return (
    <div className="driver-telemetry glass-panel">
      <div className="dt-header" style={{ borderBottomColor: d.teamColor }}>
        <h3>TELEMETRY: {selectedDriver}</h3>
      </div>
      
      <div className="dt-grid">
        {/* Speed */}
        <div className="dt-stat">
          <span className="dt-val">{d.speed || 0}</span>
          <span className="dt-unit">km/h</span>
          <div className="dt-bar-bg">
            <div className="dt-bar-fill speed" style={{ width: `${(d.speed/350)*100}%` }}></div>
          </div>
        </div>

        {/* Gear */}
        <div className="dt-stat gear-box">
          <span className="dt-lbl">GEAR</span>
          <span className="dt-val-large">{d.gear || '-'}</span>
        </div>

        {/* Throttle */}
        <div className="dt-stat">
          <span className="dt-lbl">THR</span>
          <div className="dt-bar-bg vertical">
            <div className="dt-bar-fill green" style={{ height: `${throttleWidth}%` }}></div>
          </div>
        </div>

        {/* Brake */}
        <div className="dt-stat text-center">
          <span className="dt-lbl">BRK</span>
          <div className={`dt-circle ${d.brake ? 'active red' : ''}`}></div>
        </div>

        {/* DRS */}
        <div className="dt-stat text-center dt-drs">
          <span className="dt-lbl">DRS</span>
          <div className={`dt-badge ${d.drs ? 'open' : 'closed'}`}>
            {d.drs ? 'OPEN' : 'CLOSED'}
          </div>
        </div>

      </div>
    </div>
  );
}
