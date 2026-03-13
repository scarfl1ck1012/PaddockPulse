import { useState, useEffect, useMemo } from 'react';

export default function useCountdown(targetDateStr) {
  const targetTime = useMemo(() => new Date(targetDateStr).getTime(), [targetDateStr]);
  const [timeLeft, setTimeLeft] = useState(targetTime - Date.now());

  useEffect(() => {
    if (!targetTime || isNaN(targetTime)) return;
    
    // Initial diff
    setTimeLeft(targetTime - Date.now());

    const intervalId = setInterval(() => {
      const newTimeLeft = targetTime - Date.now();
      if (newTimeLeft <= 0) {
        clearInterval(intervalId);
        setTimeLeft(0);
      } else {
        setTimeLeft(newTimeLeft);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [targetTime]);

  const isExpired = timeLeft <= 0;

  // Format the time left
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return {
    isExpired,
    days,
    hours,
    minutes,
    seconds,
    totalMilliseconds: Math.max(0, timeLeft), // ensure we don't go negative
    formattedString: isExpired ? "STARTED" : `${days}d ${hours}h ${minutes}m ${seconds}s`
  };
}
