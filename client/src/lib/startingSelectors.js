function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function buildStartingView({ currentPlayerId, currentPlayerRole, players, reveal, nowMs }) {
  const role = currentPlayerRole || null;
  const safePlayers = Array.isArray(players) ? players : [];

  const isImpostor = role === 'IMPOSTOR';
  const impostors = safePlayers.filter((player) => player.role === 'IMPOSTOR');

  const visiblePlayers = isImpostor
    ? impostors
    : safePlayers;

  const totalMs = Number.isFinite(reveal?.durationMs) && reveal.durationMs > 0
    ? reveal.durationMs
    : 6000;

  const startedAt = Number.isFinite(reveal?.startedAt)
    ? reveal.startedAt
    : nowMs;

  const endsAt = startedAt + totalMs;
  const remainingMs = clamp(endsAt - nowMs, 0, totalMs);
  const totalSeconds = Math.ceil(totalMs / 1000);
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const progressPct = clamp(((totalMs - remainingMs) / totalMs) * 100, 0, 100);

  let subtitle = 'Sincronizando papel...';
  if (role === 'CREWMATE') {
    const count = Number.isFinite(reveal?.numImpostors)
      ? reveal.numImpostors
      : impostors.length;
    subtitle = `Existem ${count} impostor(es) entre nos`;
  } else if (role === 'IMPOSTOR') {
    subtitle = impostors.length <= 1 ? 'Voce esta sozinho' : 'Seus aliados';
  }

  const roleLabel = role || 'SINCRONIZANDO';
  const roleTone = role === 'IMPOSTOR' ? 'red' : 'cyan';
  const currentPlayer = safePlayers.find((player) => player.id === currentPlayerId) || null;

  return {
    roleLabel,
    roleTone,
    subtitle,
    visiblePlayers,
    totalSeconds,
    remainingSeconds,
    progressPct,
    currentPlayer,
  };
}
