import { Camera, Megaphone, QrCode } from 'lucide-react';

export default function ActionPanelCrewmate({
  isAlive,
  isMeetingActive,
  canUseEmergency,
  canUseReport,
  reportCooldownSec,
  onOpenTaskScanner,
  onOpenEmergencyScanner,
  onOpenReport,
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-4">
      <h2 className="text-xs uppercase tracking-[0.2em] text-cyan-200 font-black mb-3">Acoes</h2>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onOpenTaskScanner}
          disabled={!isAlive || isMeetingActive}
          className="px-3 py-3 rounded-xl bg-cyan-600 disabled:bg-gray-700 disabled:opacity-60 text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2"
        >
          <Camera size={14} /> Task QR
        </button>

        <button
          type="button"
          onClick={onOpenEmergencyScanner}
          disabled={!canUseEmergency}
          className="px-3 py-3 rounded-xl bg-orange-600 disabled:bg-gray-700 disabled:opacity-60 text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2"
        >
          <Megaphone size={14} /> Emergencia
        </button>

        <button
          type="button"
          onClick={onOpenReport}
          disabled={!canUseReport}
          className="col-span-2 px-3 py-3 rounded-xl bg-yellow-600 disabled:bg-gray-700 disabled:opacity-60 text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2"
        >
          <QrCode size={14} /> Report
        </button>
      </div>

      <div className="mt-3 text-[11px] text-gray-300 uppercase tracking-wide">
        <p>Report cooldown: {reportCooldownSec > 0 ? `${reportCooldownSec}s` : 'pronto'}</p>
      </div>
    </section>
  );
}
