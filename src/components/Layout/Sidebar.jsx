import { NavLink, useLocation } from 'react-router-dom';
import './Sidebar.css';

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { path: '/', label: 'Home', icon: '🏠', exact: true },
    ],
  },
  {
    label: 'LIVE SESSION',
    items: [
      { path: '/live', label: 'Live Timing', icon: '🔴' },
    ],
  },
  {
    label: 'ANALYSIS',
    items: [
      { path: '/compare', label: 'Compare', icon: '⚔️' },
      { path: '/recap', label: 'Race Recap', icon: '🎬' },
      { path: '/learn', label: 'F1 Learn', icon: '📚' },
    ],
  },
  {
    label: 'CHAMPIONSHIP',
    items: [
      { path: '/standings', label: 'Standings', icon: '🏆', match: '/standings' },
      { path: '/schedule', label: 'Schedule', icon: '📅', match: '/schedule' },
      { path: '/results', label: 'Results', icon: '🏁' },
    ],
  },
];

export default function Sidebar({ onNavigate }) {
  const location = useLocation();

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    if (item.match) return location.pathname.startsWith(item.match);
    return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
  };

  return (
    <aside className="sidebar" id="main-sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <span className="logo-icon">🏎️</span>
          <div className="logo-text">
            <span className="logo-title">PaddockPulse</span>
            <span className="logo-sub">F1 Companion</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className="nav-group">
            {group.label && <div className="nav-group-label">{group.label}</div>}
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item) ? 'nav-item-active' : ''}`}
                id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={onNavigate}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {isActive(item) && <div className="nav-indicator" />}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-season-badge">
          <span className="season-dot" />
          <span>2026 Season</span>
        </div>
      </div>
    </aside>
  );
}
