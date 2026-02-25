import { useEffect, useState } from 'react';
import { SERVER_URL } from '../constants';

export function useMatchSync(playerId) {
  const [match, setMatch] = useState(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [syncError, setSyncError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const syncState = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/state`);
        if (!response.ok || cancelled) return;

        const nextMatch = await response.json();
        if (cancelled) return;

        setMatch(nextMatch);
        setSyncError('');

        if (nextMatch.players?.some((player) => player.id === playerId)) {
          setHasJoined(true);
        }
      } catch {
        if (!cancelled) setSyncError('Servidor offline na porta 3000.');
      }
    };

    syncState();
    const interval = setInterval(syncState, 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [playerId]);

  return {
    match,
    setMatch,
    hasJoined,
    setHasJoined,
    syncError,
  };
}
