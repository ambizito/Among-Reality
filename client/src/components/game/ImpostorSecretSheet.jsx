import { Bomb, Skull, Swords, X } from 'lucide-react';

export default function ImpostorSecretSheet({
  isOpen,
  onClose,
  isAlive,
  isMeetingActive,
  canUseKill,
  canUseSabotage,
  killCooldownSec,
  sabotageCooldownSec,
  onOpenKill,
  onUseSabotage,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[65]">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Fechar painel secreto"
      />

      <div className="absolute left-0 right-0 bottom-0 animate-[slideUp_180ms_ease-out] rounded-t-3xl border-t border-white/20 bg-[#101827] p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-red-300 font-black">Funcao real</p>
            <h3 className="text-xl font-black text-red-500">IMPOSTOR</h3>
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        {!isAlive && (
          <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs uppercase tracking-wide text-red-200 font-black">
            Jogador morto: kill e sabotagem bloqueados.
          </div>
        )}

        {isMeetingActive && (
          <div className="mb-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs uppercase tracking-wide text-yellow-200 font-black">
            Reuniao ativa: acoes de impostor bloqueadas.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onOpenKill}
            disabled={!canUseKill}
            className="px-3 py-3 rounded-xl bg-red-600 disabled:bg-gray-700 disabled:opacity-60 text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2"
          >
            <Swords size={14} /> Kill
          </button>

          <button
            type="button"
            onClick={onUseSabotage}
            disabled={!canUseSabotage}
            className="px-3 py-3 rounded-xl bg-purple-600 disabled:bg-gray-700 disabled:opacity-60 text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2"
          >
            <Bomb size={14} /> Sabotagem
          </button>
        </div>

        <div className="mt-3 text-[11px] text-gray-300 uppercase tracking-wide space-y-1">
          <p>
            <Skull size={11} className="inline-block mr-1" /> Kill cooldown: {killCooldownSec > 0 ? `${killCooldownSec}s` : 'pronto'}
          </p>
          <p>Sabotagem cooldown global: {sabotageCooldownSec > 0 ? `${sabotageCooldownSec}s` : 'pronto'}</p>
        </div>
      </div>
    </div>
  );
}
