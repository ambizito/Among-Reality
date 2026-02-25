import InGameHeader from '../components/game/InGameHeader';
import ActionPanelCrewmate from '../components/game/ActionPanelCrewmate';
import TaskList from '../components/game/TaskList';

export default function InGameScreen({
  entryCode,
  notice,
  isAlive,
  isImpostor,
  meetingActive,
  fakeRoleLabel,
  avatarColor,
  globalProgress,
  canUseEmergency,
  canUseReport,
  reportCooldownSec,
  pendingEmergencyConfirm,
  emergencyConfirmSec,
  tasks,
  taskTypeCounts,
  isAdmin,
  onAvatarClick,
  onOpenTaskScanner,
  onOpenEmergencyScanner,
  onOpenReport,
  onConfirmEmergency,
  onCancelEmergencyConfirm,
  onReset,
}) {
  return (
    <div className="min-h-screen bg-[#0b121e] text-white flex flex-col relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <InGameHeader
        entryCode={entryCode}
        fakeRoleLabel={fakeRoleLabel}
        avatarColor={avatarColor}
        isAvatarInteractive={isImpostor}
        onAvatarClick={onAvatarClick}
      />

      <main className="flex-1 p-5 overflow-y-auto pb-28">
        {notice && (
          <div className="mb-4 rounded-xl bg-red-600/90 px-4 py-2 text-xs font-black uppercase tracking-wide">
            {notice}
          </div>
        )}

        {!isAlive && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs uppercase tracking-wide text-red-200 font-black">
            Voce esta morto e nao pode usar acoes de kill, sabotagem, report ou voto sem presenca.
          </div>
        )}

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs uppercase tracking-[0.2em] text-cyan-200 font-black">Progresso global</h2>
            <span className="text-sm font-black">{globalProgress}%</span>
          </div>

          <div className="w-full h-3 rounded-full bg-black/30 overflow-hidden border border-white/10">
            <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${globalProgress}%` }} />
          </div>
          <p className="mt-3 text-[11px] text-gray-300">Tasks fake de impostor nao aumentam esta barra.</p>
        </section>

        <ActionPanelCrewmate
          isAlive={isAlive}
          isMeetingActive={meetingActive}
          canUseEmergency={canUseEmergency}
          canUseReport={canUseReport}
          reportCooldownSec={reportCooldownSec}
          onOpenTaskScanner={onOpenTaskScanner}
          onOpenEmergencyScanner={onOpenEmergencyScanner}
          onOpenReport={onOpenReport}
        />

        {pendingEmergencyConfirm && (
          <section className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4 mb-4">
            <h2 className="text-xs uppercase tracking-[0.2em] text-orange-200 font-black mb-2">Confirmar emergencia</h2>
            <p className="text-xs text-orange-100 mb-3">Confirmacao expira em {emergencyConfirmSec}s.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onConfirmEmergency}
                className="flex-1 py-2 rounded-lg bg-orange-600 text-xs font-black uppercase tracking-wide"
              >
                Confirmar ativacao
              </button>
              <button
                type="button"
                onClick={onCancelEmergencyConfirm}
                className="px-3 py-2 rounded-lg bg-black/30 border border-orange-500/20 text-xs font-black uppercase tracking-wide"
              >
                Cancelar
              </button>
            </div>
          </section>
        )}

        <TaskList tasks={tasks} taskTypeCounts={taskTypeCounts} />

        {isAdmin && (
          <button
            type="button"
            onClick={onReset}
            className="mt-5 w-full py-3 rounded-xl bg-red-600 font-black uppercase tracking-wide"
          >
            Encerrar partida
          </button>
        )}
      </main>
    </div>
  );
}
