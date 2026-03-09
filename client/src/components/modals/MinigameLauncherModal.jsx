import { useMemo, useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';

function formatTaskTypeLabel(taskType) {
  return taskType.replace(/_/g, ' ').toUpperCase();
}

const VIEW_MODES = {
  LIST: 'LIST',
  PLAY: 'PLAY',
};

export default function MinigameLauncherModal({
  isOpen,
  onClose,
  minigameEntries,
}) {
  const [selectedTaskType, setSelectedTaskType] = useState('');
  const [viewMode, setViewMode] = useState(VIEW_MODES.LIST);

  const selectedMinigame = useMemo(
    () => minigameEntries.find((entry) => entry.taskType === selectedTaskType) || null,
    [minigameEntries, selectedTaskType],
  );

  if (!isOpen) return null;

  const handleClose = () => {
    setViewMode(VIEW_MODES.LIST);
    setSelectedTaskType('');
    onClose();
  };

  const handleSelectMinigame = (taskType) => {
    setSelectedTaskType(taskType);
    setViewMode(VIEW_MODES.PLAY);
  };

  return (
    <div className="fixed inset-0 z-[65] bg-black/90 backdrop-blur-sm p-3 md:p-4 flex items-center justify-center">
      <div className="w-full max-w-5xl h-[92vh] rounded-2xl bg-[#0f172a] border border-white/20 overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-black uppercase tracking-widest text-cyan-300">
              Launcher de Minigames
            </h3>
            <p className="text-[11px] uppercase tracking-wide text-gray-400">
              {viewMode === VIEW_MODES.LIST
                ? 'Selecione um minigame para abrir'
                : 'Minigame em execucao'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {viewMode === VIEW_MODES.PLAY && (
              <button
                type="button"
                onClick={() => setViewMode(VIEW_MODES.LIST)}
                className="h-9 px-3 rounded-lg bg-white/10 border border-white/20 inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wide"
              >
                <ArrowLeft size={14} />
                Lista
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          {viewMode === VIEW_MODES.LIST ? (
            <section className="h-full p-3 md:p-4 overflow-y-auto">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
                Minigames disponiveis
              </p>
              <div className="space-y-2">
                {minigameEntries.map((entry) => (
                  <button
                    key={entry.taskType}
                    type="button"
                    onClick={() => handleSelectMinigame(entry.taskType)}
                    className="w-full text-left rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 transition-colors"
                  >
                    <p className="text-xs font-black text-white uppercase tracking-wide">
                      {formatTaskTypeLabel(entry.taskType)}
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                      {entry.legacyTaskId}
                    </p>
                  </button>
                ))}
                {!minigameEntries.length && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-gray-300 uppercase tracking-wide">
                      Nenhum minigame disponivel.
                    </p>
                  </div>
                )}
              </div>
            </section>
          ) : (
            <section className="h-full p-3 md:p-4 flex flex-col min-h-0">
              {selectedMinigame ? (
                <>
                  <div className="mb-2">
                    <p className="text-xs font-black text-cyan-200 uppercase tracking-wide">
                      {formatTaskTypeLabel(selectedMinigame.taskType)}
                    </p>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                      Identificador esperado: {selectedMinigame.legacyTaskId}
                    </p>
                  </div>
                  <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-white/10 bg-black">
                    <iframe
                      title={`minigame-${selectedMinigame.taskType}`}
                      src={selectedMinigame.path}
                      className="w-full h-full border-0"
                      allow="camera"
                    />
                  </div>
                </>
              ) : (
                <div className="h-full rounded-xl border border-white/10 bg-white/5 flex items-center justify-center px-4">
                  <p className="text-xs text-gray-300 uppercase tracking-wide">
                    Minigame nao encontrado. Volte para a lista e selecione novamente.
                  </p>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
