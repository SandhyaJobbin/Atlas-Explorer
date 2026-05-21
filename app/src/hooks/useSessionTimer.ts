import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSession';

const TOTAL_SESSION_MINUTES = 60;
const TOTAL_SESSION_SECONDS = TOTAL_SESSION_MINUTES * 60;

export function useSessionTimer() {
  const { session } = useSession();

  const [now, setNow] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => setNow(Date.now()), 0);
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      window.clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const parsedStartTime = session?.createdAt ? new Date(session.createdAt).getTime() : Number.NaN;
  const startTimeMs = Number.isFinite(parsedStartTime) ? parsedStartTime : now;
  const elapsedSeconds = Math.max(0, Math.floor((now - startTimeMs) / 1000));
  const remainingSeconds = Math.max(0, TOTAL_SESSION_SECONDS - elapsedSeconds);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const isUrgent = minutes < 10;

  const formattedRemaining = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const pillLabel = `${minutes} min remaining`;

  return {
    elapsedSeconds,
    remainingSeconds,
    minutes,
    seconds,
    isUrgent,
    formattedRemaining,
    pillLabel,
  };
}
