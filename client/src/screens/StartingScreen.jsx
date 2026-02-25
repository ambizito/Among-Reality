import { useEffect, useMemo, useState } from 'react';
import StartingRoster from '../components/game/StartingRoster';
import { buildStartingView } from '../lib/startingSelectors';

export default function StartingScreen({
  currentPlayerId,
  currentPlayerRole,
  players,
  reveal,
  resolveColor,
}) {
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNowTick(Date.now());
    }, 250);
    return () => clearInterval(interval);
  }, []);

  const view = useMemo(
    () =>
      buildStartingView({
        currentPlayerId,
        currentPlayerRole,
        players,
        reveal,
        nowMs: nowTick,
      }),
    [currentPlayerId, currentPlayerRole, nowTick, players, reveal],
  );

  const roleColorClass =
    view.roleTone === 'red'
      ? 'text-red-500'
      : 'text-cyan-300';

  const panelGlowClass =
    view.roleTone === 'red'
      ? 'from-red-500/20 via-red-500/5 to-black/0'
      : 'from-cyan-500/20 via-cyan-500/5 to-black/0';

  return (
    <div className="fixed inset-0 bg-[#05080f] text-white flex items-center justify-center p-4 z-[100] overflow-hidden">
      <div className={`absolute -top-24 -left-24 w-80 h-80 rounded-full blur-[90px] bg-gradient-to-br ${panelGlowClass}`} />
      <div className={`absolute -bottom-24 -right-24 w-80 h-80 rounded-full blur-[90px] bg-gradient-to-br ${panelGlowClass}`} />

      <div className="w-full max-w-4xl max-h-[96vh] rounded-3xl border border-white/15 bg-[#0f172a]/95 backdrop-blur-xl p-4 md:p-6 flex flex-col gap-4 overflow-hidden">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-black mb-2">Revelacao de papel</p>
          <h1 className={`text-4xl md:text-6xl font-black tracking-[0.08em] ${roleColorClass}`}>{view.roleLabel}</h1>
          <p className="mt-2 text-sm md:text-base text-gray-200 font-bold uppercase tracking-wide">{view.subtitle}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-300 font-black mb-2">
            <span>Carregando partida</span>
            <span>{view.remainingSeconds}s / {view.totalSeconds}s</span>
          </div>
          <div className="w-full h-3 rounded-full bg-black/40 border border-white/10 overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${view.roleTone === 'red' ? 'bg-red-500' : 'bg-cyan-500'}`}
              style={{ width: `${view.progressPct}%` }}
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          <StartingRoster
            players={view.visiblePlayers}
            currentPlayerId={currentPlayerId}
            resolveColor={resolveColor}
            columnsClass="grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          />
        </div>
      </div>
    </div>
  );
}
