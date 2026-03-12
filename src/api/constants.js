/**
 * F1 Static Constants
 * Team colours, tyre compounds, flag types, and session info
 */

// Official F1 team colours (fallback when API unavailable)
export const TEAM_COLOURS = {
  'Red Bull Racing': '#4781D7',
  'red_bull': '#4781D7',
  'McLaren': '#F47600',
  'mclaren': '#F47600',
  'Ferrari': '#ED1131',
  'ferrari': '#ED1131',
  'Mercedes': '#00D7B6',
  'mercedes': '#00D7B6',
  'Aston Martin': '#229971',
  'aston_martin': '#229971',
  'Alpine': '#00A1E8',
  'alpine': '#00A1E8',
  'Alpine F1 Team': '#00A1E8',
  'Williams': '#1868DB',
  'williams': '#1868DB',
  'Racing Bulls': '#6C98FF',
  'RB F1 Team': '#6C98FF',
  'rb': '#6C98FF',
  'Haas F1 Team': '#9C9FA2',
  'haas': '#9C9FA2',
  'Sauber': '#F50537',
  'sauber': '#F50537',
  'Audi': '#F50537',
  'Cadillac': '#909090',
};

// Used for CSS class mapping
export const TEAM_CSS_VAR = {
  'Red Bull Racing': '--team-red-bull',
  'red_bull': '--team-red-bull',
  'McLaren': '--team-mclaren',
  'mclaren': '--team-mclaren',
  'Ferrari': '--team-ferrari',
  'ferrari': '--team-ferrari',
  'Mercedes': '--team-mercedes',
  'mercedes': '--team-mercedes',
  'Aston Martin': '--team-aston-martin',
  'aston_martin': '--team-aston-martin',
  'Alpine': '--team-alpine',
  'alpine': '--team-alpine',
  'Alpine F1 Team': '--team-alpine',
  'Williams': '--team-williams',
  'williams': '--team-williams',
  'Racing Bulls': '--team-rb',
  'RB F1 Team': '--team-rb',
  'rb': '--team-rb',
  'Haas F1 Team': '--team-haas',
  'haas': '--team-haas',
  'Sauber': '--team-sauber',
  'sauber': '--team-sauber',
  'Audi': '--team-sauber',
  'Cadillac': '--team-cadillac',
};

// Tyre compound definitions per PRD
export const TYRE_COMPOUNDS = {
  SOFT: { name: 'Soft', color: '#e10600', letter: 'S' },
  MEDIUM: { name: 'Medium', color: '#f5c623', letter: 'M' },
  HARD: { name: 'Hard', color: '#f0f0f5', letter: 'H' },
  INTERMEDIATE: { name: 'Intermediate', color: '#43b02a', letter: 'I' },
  WET: { name: 'Wet', color: '#0080ff', letter: 'W' },
};

// Flag types for race control
export const FLAG_TYPES = {
  GREEN: { name: 'Green', color: '#00d97e', emoji: '🟢' },
  YELLOW: { name: 'Yellow', color: '#f5c623', emoji: '🟡' },
  RED: { name: 'Red', color: '#e10600', emoji: '🔴' },
  BLUE: { name: 'Blue', color: '#3b82f6', emoji: '🔵' },
  CHEQUERED: { name: 'Chequered', color: '#f0f0f5', emoji: '🏁' },
  SAFETY_CAR: { name: 'Safety Car', color: '#f5a623', emoji: '🚗' },
  VSC: { name: 'Virtual Safety Car', color: '#f5a623', emoji: '⚡' },
};

// Session type labels
export const SESSION_TYPES = {
  'fp1': 'Free Practice 1',
  'fp2': 'Free Practice 2',
  'fp3': 'Free Practice 3',
  'qualifying': 'Qualifying',
  'sprint_qualifying': 'Sprint Qualifying',
  'sprint': 'Sprint',
  'race': 'Race',
};

// Country code to flag emoji
export const COUNTRY_FLAGS = {
  'UK': '🇬🇧', 'Monaco': '🇲🇨', 'USA': '🇺🇸', 'Italy': '🇮🇹',
  'Spain': '🇪🇸', 'Belgium': '🇧🇪', 'Netherlands': '🇳🇱', 'Hungary': '🇭🇺',
  'Canada': '🇨🇦', 'France': '🇫🇷', 'Austria': '🇦🇹', 'Germany': '🇩🇪',
  'Japan': '🇯🇵', 'China': '🇨🇳', 'Australia': '🇦🇺', 'Brazil': '🇧🇷',
  'Mexico': '🇲🇽', 'Singapore': '🇸🇬', 'Azerbaijan': '🇦🇿', 'Saudi Arabia': '🇸🇦',
  'Bahrain': '🇧🇭', 'UAE': '🇦🇪', 'Qatar': '🇶🇦', 'Portugal': '🇵🇹',
  'Turkey': '🇹🇷', 'Russia': '🇷🇺', 'Switzerland': '🇨🇭', 'Argentina': '🇦🇷',
  'South Africa': '🇿🇦', 'India': '🇮🇳', 'Malaysia': '🇲🇾', 'South Korea': '🇰🇷',
  'Sweden': '🇸🇪', 'Morocco': '🇲🇦',
};

/**
 * Get team colour by constructor name or ID
 * @param {string} identifier - Team name or constructor ID
 * @returns {string} Hex colour code
 */
export function getTeamColour(identifier) {
  return TEAM_COLOURS[identifier] || '#666666';
}

/**
 * Get country flag emoji
 */
export function getCountryFlag(country) {
  return COUNTRY_FLAGS[country] || '🏴';
}

// Current season
export const CURRENT_SEASON = new Date().getFullYear();
