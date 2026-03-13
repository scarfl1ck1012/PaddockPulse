/**
 * Formats seconds into M:SS.mmm (e.g., 82.123 -> 1:22.123)
 */
export const formatLapTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : secs;
};

/**
 * Formats a gap/interval in seconds (e.g., +2.345)
 */
export const formatGap = (seconds) => {
  if (!seconds || isNaN(seconds)) return '';
  if (seconds >= 60) return `+${formatLapTime(seconds)}`;
  return `+${seconds.toFixed(3)}`;
};

/**
 * Capitalizes the first letter of a string.
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};
