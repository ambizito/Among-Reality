export default function TaskModal({
  activeTask,
  isCompletingTask,
  taskModalNotice,
  onClose,
}) {
  if (!activeTask) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="w-full max-w-3xl h-[90vh] rounded-2xl bg-[#0f172a] border border-white/20 overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div>
            <p className="font-black text-cyan-300 uppercase tracking-widest text-xs">{activeTask.label}</p>
            <p className="text-[11px] uppercase tracking-wide text-gray-400">Instancia: {activeTask.instanceId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-lg bg-white/10 text-xs font-black uppercase tracking-wide"
            disabled={isCompletingTask}
          >
            Fechar task
          </button>
        </div>

        <div className="flex-1 bg-black">
          <iframe
            title={`task-${activeTask.instanceId}`}
            src={activeTask.minigamePath}
            className="w-full h-full border-0"
            allow="camera"
          />
        </div>

        <div className="px-4 py-3 border-t border-white/10 bg-[#111827]">
          <p className="text-[11px] text-gray-300 uppercase tracking-wide">Task esperada: {activeTask.expectedLegacyTaskId}</p>
          {isCompletingTask && <p className="text-xs text-cyan-300 font-bold uppercase tracking-wide mt-2">Registrando conclusao...</p>}
          {taskModalNotice && <p className="text-xs text-red-300 font-bold uppercase tracking-wide mt-2">{taskModalNotice}</p>}
        </div>
      </div>
    </div>
  );
}
