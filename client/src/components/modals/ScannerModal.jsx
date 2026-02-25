import { X } from 'lucide-react';

export default function ScannerModal({
  isOpen,
  scannerMode,
  onClose,
  scanInFlight,
  scannerError,
}) {
  if (!isOpen) return null;

  const label = scannerMode === 'TASK'
    ? 'Task'
    : scannerMode === 'EMERGENCY'
      ? 'Emergencia'
      : 'Presenca';

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-[#111827] border border-white/15 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-black uppercase tracking-widest text-sm text-cyan-300">Scanner QR {label}</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        <div className="p-4">
          <div id="task-qr-reader" className="overflow-hidden rounded-xl" />
          {scanInFlight && <p className="mt-3 text-xs text-cyan-300 font-bold uppercase tracking-wide">Validando QR...</p>}
          {scannerError && <p className="mt-3 text-xs text-red-300 font-bold uppercase tracking-wide">{scannerError}</p>}
        </div>
      </div>
    </div>
  );
}
