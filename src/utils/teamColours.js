export const TEAM_COLOURS = {
  "Red Bull": "#3671C6",
  "Red Bull Racing": "#3671C6",
  "Ferrari": "#E8002D",
  "Mercedes": "#27F4D2",
  "McLaren": "#FF8000",
  "Aston Martin": "#229971",
  "Alpine": "#FF87BC",
  "Williams": "#64C4FF",
  "RB": "#6692FF",
  "Haas": "#B6BABD",
  "Kick Sauber": "#52E252",
  "Sauber": "#52E252"
};

export const getTeamColour = (teamName) => {
  if (!teamName) return "#FFFFFF";
  // Try exact match
  if (TEAM_COLOURS[teamName]) return TEAM_COLOURS[teamName];
  // Try partial match
  const match = Object.keys(TEAM_COLOURS).find(k => teamName.includes(k));
  return match ? TEAM_COLOURS[match] : "#FFFFFF";
};
