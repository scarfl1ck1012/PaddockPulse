import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import duration from 'dayjs/plugin/duration.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);

export const formatLapTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return "";
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3).padStart(6, '0');
  return mins > 0 ? `${mins}:${secs}` : secs;
};

export const formatGap = (seconds) => {
  if (!seconds || isNaN(seconds)) return "";
  if (seconds > 100) return "1 LAP"; // Simplified check for lapped cars, ideally we'd get boolean from API
  return `+${seconds.toFixed(3)}`;
};

export const formatSector = (ms) => {
  if (!ms) return "";
  const secs = ms / 1000;
  return secs.toFixed(3);
};

export const toIST = (utcString) => {
  if (!utcString) return "";
  return dayjs(utcString).tz("Asia/Kolkata");
};

export { dayjs };
