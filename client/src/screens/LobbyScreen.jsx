import { CheckCircle, Circle, Crown, Play, Settings, Users, X, Zap } from 'lucide-react';
import AmongUsCharacter from '../components/character/AmongUsCharacter';

export default function LobbyScreen({
  entryCode,
  gameSettings,
  minPlayersRequired,
  players,
  hostId,
  playerId,
  notice,
  isAdmin,
  currentPlayer,
  everyoneReady,
  onOpenSettings,
  onOpenColor,
  onToggleReady,
  onStartGame,
  resolveColor,
}) {
  return (
    <div className="min-h-screen bg-[#0b121e] text-white flex flex-col relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <header className="p-5 flex justify-between items-center bg-[#0f172a]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-20">
        <div>
          <h1 className="text-lg font-black tracking-widest">SALA: {entryCode}</h1>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Online</span>
          </div>
        </div>

        <div className="flex gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
            >
              <Settings size={20} className="text-cyan-400" />
            </button>
          )}
          {isAdmin && (
            <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full border border-yellow-500/20">
              <Crown size={14} />
              <span className="text-[10px] font-black uppercase tracking-tighter">Host</span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto pb-32">
        <div className="mb-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs text-gray-300">
          <p className="font-black uppercase tracking-widest text-cyan-200">Regra de inicio</p>
          <p className="mt-1">
            Minimo de {minPlayersRequired} jogadores para {gameSettings.numImpostors} impostor(es). Todos os jogadores (exceto host) precisam estar prontos.
          </p>
        </div>

        {notice && <div className="mb-4 rounded-full bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-wide">{notice}</div>}

        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <Users size={12} /> Tripulantes ({players.length}/20)
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {players.map((player) => (
            <div
              key={player.id}
              className={`p-4 rounded-2xl flex items-center justify-between border transition-all duration-300 ${player.id === playerId ? 'bg-white/10 border-white/20' : 'bg-black/20 border-white/5 opacity-80'}`}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <AmongUsCharacter color={resolveColor(player.color)} className="w-10 h-10" />
                  {player.id === hostId && <Crown size={12} className="absolute -top-1 -left-1 text-yellow-500" />}
                </div>
                <span className={`font-bold ${player.id === playerId ? 'text-white' : 'text-gray-400'}`}>
                  {player.nickname} {player.id === playerId && '(Voce)'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {player.id !== hostId ? (
                  player.ready ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">
                      <CheckCircle size={12} /> PRONTO
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-white/5 px-2 py-1 rounded-lg">
                      <Circle size={12} /> ESPERANDO
                    </span>
                  )
                ) : (
                  <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest px-2">Lider</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      <button
        type="button"
        onClick={onOpenColor}
        className="fixed bottom-28 right-6 z-40 group cursor-pointer"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl group-hover:bg-cyan-500/30 transition-all scale-75" />
          <div className="relative bg-[#1e293b] p-3 rounded-full border border-white/20 shadow-2xl transition-transform active:scale-90 hover:scale-105">
            <AmongUsCharacter color={resolveColor(currentPlayer?.color)} className="w-14 h-14" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center border-2 border-[#0b121e]">
              <Zap size={12} className="text-white" fill="currentColor" />
            </div>
          </div>
        </div>
      </button>

      <footer className="p-6 bg-[#0f172a]/95 backdrop-blur-md border-t border-white/10 sticky bottom-0 z-30 pb-10">
        {isAdmin ? (
          <button
            type="button"
            disabled={!everyoneReady}
            onClick={onStartGame}
            className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-lg transition-all active:scale-95 ${everyoneReady ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-700 opacity-50 cursor-not-allowed'}`}
          >
            <Play fill="currentColor" size={20} />
            {everyoneReady ? 'INICIAR PARTIDA' : 'AGUARDANDO TODOS'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleReady}
            className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-lg transition-all active:scale-95 ${currentPlayer?.ready ? 'bg-red-600/20 text-red-500 border border-red-500/30' : 'bg-cyan-600 text-white'}`}
          >
            {currentPlayer?.ready ? <X size={20} /> : <CheckCircle size={20} />}
            {currentPlayer?.ready ? 'CANCELAR PRONTO' : 'FICAR PRONTO'}
          </button>
        )}
      </footer>
    </div>
  );
}
