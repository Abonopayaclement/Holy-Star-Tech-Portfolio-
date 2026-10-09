import { useState, useEffect } from 'react';

/**
 * Reusable real-time clock hook for mobile.
 * Updates every second using device local timezone with Intl.DateTimeFormat.
 */
export const useRealtimeClock = () => {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(time);

  const dateString = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(time);

  return { timeString, dateString, time };
};
