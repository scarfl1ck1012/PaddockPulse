// Keyed by OpenF1 team_name field. Use team_colour from OpenF1 driver endpoint
// as primary source. These are fallbacks for 2026:
export const TEAM_COLORS_2026 = {
  'Red Bull Racing': '#3671C6',
  'Ferrari': '#E8002D',
  'Mercedes': '#27F4D2',
  'McLaren': '#FF8000',
  'Aston Martin': '#229971',
  'Alpine': '#FF87BC',
  'Williams': '#64C4FF',
  'RB': '#6692FF',
  'Haas F1 Team': '#B6BABD',
  'Sauber': '#52E252',
};
// Always prefer team_colour from OpenF1 API over these hardcoded fallbacks
