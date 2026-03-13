import React from 'react';
import { getTeamColour } from '../../utils/teamColours';
import './PodiumResult.css';

const PodiumResult = ({ results }) => {
  if (!results || results.length < 3) return null;
  const [p1, p2, p3] = results.slice(0, 3);

  return (
    <div className="podium-container">
      <div className="podium-step p2">
        <div className="podium-driver">{p2.Driver.code || p2.Driver.familyName}</div>
        <div className="podium-team" style={{ color: getTeamColour(p2.Constructor.name) }}>
          {p2.Constructor.name}
        </div>
        <div className="podium-time">{p2.Time?.time || p2.status}</div>
        <div className="podium-bar p2-bar" style={{ backgroundColor: getTeamColour(p2.Constructor.name) }}>
          <span className="pos-num">2</span>
        </div>
      </div>
      
      <div className="podium-step p1">
        <div className="podium-driver">{p1.Driver.code || p1.Driver.familyName}</div>
        <div className="podium-team" style={{ color: getTeamColour(p1.Constructor.name) }}>
          {p1.Constructor.name}
        </div>
        <div className="podium-time">{p1.Time?.time || p1.status}</div>
        <div className="podium-bar p1-bar" style={{ backgroundColor: getTeamColour(p1.Constructor.name) }}>
          <span className="pos-num">1</span>
        </div>
      </div>
      
      <div className="podium-step p3">
        <div className="podium-driver">{p3.Driver.code || p3.Driver.familyName}</div>
        <div className="podium-team" style={{ color: getTeamColour(p3.Constructor.name) }}>
          {p3.Constructor.name}
        </div>
        <div className="podium-time">{p3.Time?.time || p3.status}</div>
        <div className="podium-bar p3-bar" style={{ backgroundColor: getTeamColour(p3.Constructor.name) }}>
          <span className="pos-num">3</span>
        </div>
      </div>
    </div>
  );
};

export default PodiumResult;
