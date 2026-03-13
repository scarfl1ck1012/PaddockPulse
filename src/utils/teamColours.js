export const TEAM_COLOURS = {
  RedBull: '#3671C6',
  Mercedes: '#27F4D2',
  Ferrari: '#E80020',
  McLaren: '#FF8000',
  AstonMartin: '#229971',
  Alpine: '#FF87BC',
  Williams: '#64C4FF',
  RB: '#6692FF',
  Sauber: '#52E252',
  Haas: '#B6BABD',
  Default: '#FFFFFF'
};

export const getTeamColour = (teamName, fallbackColour = null) => {
  if (fallbackColour && fallbackColour !== '000000') return `#${fallbackColour}`;
  if (!teamName) return TEAM_COLOURS.Default;
  
  const name = teamName.toLowerCase();
  if (name.includes('red bull') || name.includes('redbull')) return TEAM_COLOURS.RedBull;
  if (name.includes('mercedes')) return TEAM_COLOURS.Mercedes;
  if (name.includes('ferrari')) return TEAM_COLOURS.Ferrari;
  if (name.includes('mclaren')) return TEAM_COLOURS.McLaren;
  if (name.includes('aston martin')) return TEAM_COLOURS.AstonMartin;
  if (name.includes('alpine')) return TEAM_COLOURS.Alpine;
  if (name.includes('williams')) return TEAM_COLOURS.Williams;
  if (name.includes('rb') || name.includes('racing bulls')) return TEAM_COLOURS.RB;
  if (name.includes('sauber') || name.includes('alfa romeo')) return TEAM_COLOURS.Sauber;
  if (name.includes('haas')) return TEAM_COLOURS.Haas;
  
  return TEAM_COLOURS.Default;
};
