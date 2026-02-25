import AmongUsCharacter from '../character/AmongUsCharacter';

export default function StartingRoster({
  players,
  currentPlayerId,
  resolveColor,
  columnsClass = 'grid-cols-2 md:grid-cols-3',
}) {
  if (!players?.length) {
    return (
      <div className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-xs uppercase tracking-wide text-gray-300">
        Sem jogadores para exibir
      </div>
    );
  }

  return (
    <div className={`w-full grid ${columnsClass} gap-3`}>
      {players.map((player) => (
        <div
          key={player.id}
          className={`rounded-2xl border px-3 py-3 flex flex-col items-center gap-2 min-w-0 ${player.id === currentPlayerId ? 'bg-white/14 border-white/20' : 'bg-white/5 border-white/10'}`}
        >
          <AmongUsCharacter color={resolveColor(player.color)} className="w-10 h-10" />
          <span className="text-[11px] font-black uppercase tracking-wide text-center truncate w-full" title={player.nickname}>
            {player.nickname}
          </span>
        </div>
      ))}
    </div>
  );
}
