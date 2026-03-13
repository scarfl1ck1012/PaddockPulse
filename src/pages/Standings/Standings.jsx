import React, { useState } from 'react';
import DriverStandings from './DriverStandings';
import ConstructorStandings from './ConstructorStandings';
import './Standings.css';

const Standings = () => {
  const [activeTab, setActiveTab] = useState('drivers');
  const [year, setYear] = useState(new Date().getFullYear());

  const years = Array.from({ length: new Date().getFullYear() - 1949 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="standings-page">
      <div className="standings-header">
        <h1>CHAMPIONSHIP STANDINGS</h1>
        <div className="standings-controls">
          <select 
            value={year} 
            onChange={(e) => setYear(Number(e.target.value))}
            className="year-selector"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="standings-tabs">
        <button 
          className={`tab-btn ${activeTab === 'drivers' ? 'active' : ''}`}
          onClick={() => setActiveTab('drivers')}
        >
          DRIVERS
        </button>
        <button 
          className={`tab-btn ${activeTab === 'constructors' ? 'active' : ''}`}
          onClick={() => setActiveTab('constructors')}
        >
          CONSTRUCTORS
        </button>
      </div>

      <div className="standings-content">
        {activeTab === 'drivers' 
            ? <DriverStandings year={year} /> 
            : <ConstructorStandings year={year} />
        }
      </div>
    </div>
  );
};

export default Standings;
