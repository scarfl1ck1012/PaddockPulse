export const TYRE_COMPOUNDS = {
  SOFT: { color: '#FF3333', id: 'SOFT', letter: 'S' },
  MEDIUM: { color: '#EAEB00', id: 'MEDIUM', letter: 'M' },
  HARD: { color: '#FFFFFF', id: 'HARD', letter: 'H' },
  INTERMEDIATE: { color: '#319241', id: 'INTERMEDIATE', letter: 'I' },
  WET: { color: '#005FB3', id: 'WET', letter: 'W' },
  UNKNOWN: { color: '#555555', id: 'UNKNOWN', letter: '?' }
};

export const getTyreCompound = (compoundStr) => {
  if (!compoundStr) return TYRE_COMPOUNDS.UNKNOWN;
  const upper = compoundStr.toUpperCase();
  if (upper.includes('SOFT')) return TYRE_COMPOUNDS.SOFT;
  if (upper.includes('MEDIUM')) return TYRE_COMPOUNDS.MEDIUM;
  if (upper.includes('HARD')) return TYRE_COMPOUNDS.HARD;
  if (upper.includes('INTER')) return TYRE_COMPOUNDS.INTERMEDIATE;
  if (upper.includes('WET')) return TYRE_COMPOUNDS.WET;
  return TYRE_COMPOUNDS.UNKNOWN;
};
