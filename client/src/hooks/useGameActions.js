import { useCallback } from 'react';
import { SERVER_URL } from '../constants';

let localEventSequence = 0;

function createEventId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  localEventSequence += 1;
  return `evt_${Date.now()}_${localEventSequence}`;
}

export function useGameActions(playerId, setMatch) {
  const sendAction = useCallback(
    async (type, payload = {}) => {
      const event = { eventId: createEventId(), playerId, type, payload };

      try {
        const response = await fetch(`${SERVER_URL}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        });

        if (!response.ok) {
          return { ok: false, code: 'HTTP_ERROR', message: `Falha HTTP ${response.status}` };
        }

        const result = await response.json();
        if (result?.match) setMatch(result.match);
        return result;
      } catch {
        return { ok: false, code: 'NETWORK_ERROR', message: 'Falha de rede ao enviar evento.' };
      }
    },
    [playerId, setMatch],
  );

  return { sendAction };
}
