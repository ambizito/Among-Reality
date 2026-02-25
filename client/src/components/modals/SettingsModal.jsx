import { X } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  gameSettings,
  limits,
  defaultSettings,
  clamp,
  onUpdateSetting,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="w-full max-w-md rounded-[2rem] overflow-hidden border border-white/15 bg-[#1f2840] shadow-2xl">
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">Configuracoes</h3>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-300 mb-2 font-black">Tarefas</p>
            <div className="rounded-xl bg-[#151d31] border border-white/10 p-2 flex items-center justify-between">
              <button
                type="button"
                className="w-10 h-10 rounded-lg bg-white/10 text-lg font-black"
                onClick={() => onUpdateSetting('tasksPerPlayer', clamp((gameSettings.tasksPerPlayer || defaultSettings.tasksPerPlayer) - 1, limits.tasksPerPlayer))}
              >
                -
              </button>
              <span className="text-2xl font-black">{gameSettings.tasksPerPlayer}</span>
              <button
                type="button"
                className="w-10 h-10 rounded-lg bg-white/10 text-lg font-black"
                onClick={() => onUpdateSetting('tasksPerPlayer', clamp((gameSettings.tasksPerPlayer || defaultSettings.tasksPerPlayer) + 1, limits.tasksPerPlayer))}
              >
                +
              </button>
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-300 mb-2 font-black">Impostores</p>
            <div className="rounded-xl bg-[#151d31] border border-white/10 p-2 flex items-center justify-between">
              <button
                type="button"
                className="w-10 h-10 rounded-lg bg-white/10 text-lg font-black"
                onClick={() => onUpdateSetting('numImpostors', clamp((gameSettings.numImpostors || defaultSettings.numImpostors) - 1, limits.numImpostors))}
              >
                -
              </button>
              <span className="text-2xl font-black text-red-400">{gameSettings.numImpostors}</span>
              <button
                type="button"
                className="w-10 h-10 rounded-lg bg-white/10 text-lg font-black"
                onClick={() => onUpdateSetting('numImpostors', clamp((gameSettings.numImpostors || defaultSettings.numImpostors) + 1, limits.numImpostors))}
              >
                +
              </button>
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-300 mb-2 font-black">Kill cooldown (s)</p>
            <div className="rounded-xl bg-[#151d31] border border-white/10 p-2 flex items-center justify-between">
              <button
                type="button"
                className="w-10 h-10 rounded-lg bg-white/10 text-lg font-black"
                onClick={() => onUpdateSetting('killCooldown', clamp((gameSettings.killCooldown || defaultSettings.killCooldown) - 5, limits.killCooldown))}
              >
                -
              </button>
              <span className="text-2xl font-black text-orange-400">{gameSettings.killCooldown}s</span>
              <button
                type="button"
                className="w-10 h-10 rounded-lg bg-white/10 text-lg font-black"
                onClick={() => onUpdateSetting('killCooldown', clamp((gameSettings.killCooldown || defaultSettings.killCooldown) + 5, limits.killCooldown))}
              >
                +
              </button>
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-300 mb-2 font-black">Sabotagem (s)</p>
            <div className="rounded-xl bg-[#151d31] border border-white/10 p-2 flex items-center justify-between">
              <button
                type="button"
                className="w-10 h-10 rounded-lg bg-white/10 text-lg font-black"
                onClick={() => onUpdateSetting('sabotageCooldown', clamp((gameSettings.sabotageCooldown || defaultSettings.sabotageCooldown) - 5, limits.sabotageCooldown))}
              >
                -
              </button>
              <span className="text-2xl font-black text-purple-400">{gameSettings.sabotageCooldown}s</span>
              <button
                type="button"
                className="w-10 h-10 rounded-lg bg-white/10 text-lg font-black"
                onClick={() => onUpdateSetting('sabotageCooldown', clamp((gameSettings.sabotageCooldown || defaultSettings.sabotageCooldown) + 5, limits.sabotageCooldown))}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-4 bg-cyan-600 text-sm font-black uppercase tracking-[0.15em]"
        >
          Salvar regras
        </button>
      </div>
    </div>
  );
}
