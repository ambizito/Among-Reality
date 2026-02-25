import { X } from 'lucide-react';

export default function ReportModal({ isOpen, crewmates, onClose, onReport }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[55] bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-[#111827] border border-white/15 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black uppercase tracking-widest text-yellow-300">Report</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-full bg-white/10">
            <X size={16} />
          </button>
        </div>

        <p className="text-[11px] text-gray-300 uppercase tracking-wide mb-3">
          Escolha um crewmate. So corpos pendentes validos iniciam reuniao.
        </p>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {crewmates.map((target) => (
            <button
              key={target.id}
              type="button"
              onClick={() => onReport(target.id)}
              className="w-full text-left rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2"
            >
              <span className="text-sm font-black text-white">{target.nickname}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
