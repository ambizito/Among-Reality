import { SERVER_URL } from './constants';

let localEventSequence = 0;

function createEventId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  localEventSequence += 1;
  return `evt_${Date.now()}_${localEventSequence}`;
}

export class OfflineClient {
  constructor(playerId) {
    this.playerId = playerId;
  }

  async sendAction(type, payload = {}) {
    const event = {
      eventId: createEventId(),
      playerId: this.playerId,
      type,
      payload,
    };

    try {
      const response = await fetch(`${SERVER_URL}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      if (!response.ok) {
        return {
          ok: false,
          code: 'HTTP_ERROR',
          message: `Falha HTTP ${response.status}`,
        };
      }
      return await response.json();
    } catch {
      return {
        ok: false,
        code: 'NETWORK_ERROR',
        message: 'Servidor offline ou erro de rede.',
      };
    }
  }
}
