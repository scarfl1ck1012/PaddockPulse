import React from 'react';
import { useLiveStore } from '../../store/liveStore';
import { TYRE_PALETTE } from '../../utils/tyrePalette';


const TyreTracker = ({ customDrivers, customStints }) => {
  const storeState = useLiveStore();
  const drivers = customDrivers || storeState.drivers || [];
  const stints = customStints || storeState.stints || [];

  // Group stints by driver
  const stintsByDriver = {};
  drivers.forEach(d => stintsByDriver[d.driver_number] = []);
  stints.forEach(s => {
    if (stintsByDriver[s.driver_number]) {
      stintsByDriver[s.driver_number].push(s);
    }
  });

  return (
    <div className="tyre-tracker">
      <div className="panel-header">TYRE STRATEGY</div>
      <div className="tyre-tracker-scroll">
        {drivers.map(d => {
          const dStints = stintsByDriver[d.driver_number] || [];
          return (
            <div key={d.driver_number} className="tyre-row">
              <div className="tyre-driver">{d.name_acronym}</div>
              <div className="tyre-timeline">
                {dStints.map((stint, idx) => {
                  const width = `${Math.min((stint.tyre_age_at_start || 10) * 3, 100)}%`; // naive width
                  const color = TYRE_PALETTE[stint.compound] || '#555';
                  return (
                    <div 
                      key={idx} 
                      className="stint-rect" 
                      style={{ width, backgroundColor: color }}
                      title={`${stint.compound} - Laps: ${stint.tyre_age_at_start}`}
                    >
                       {stint.compound?.[0] || '?'}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TyreTracker;
