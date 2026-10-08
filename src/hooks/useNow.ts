import { useEffect, useState } from 'react';

/** Current time, refreshed every `intervalMs` so relative labels ("5 分鐘前") stay accurate. */
export function useNow(intervalMs = 60000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
