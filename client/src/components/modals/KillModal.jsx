import { X } from 'lucide-react';

export default function KillModal({ isOpen, targets, onClose, onKill }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[55] bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-[#111827] border border-white/15 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black uppercase tracking-widest text-red-300">Kill</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-full bg-white/10">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {targets.map((target) => (
            <button
              key={target.id}
              type="button"
              onClick={() => onKill(target.id)}
              className="w-full text-left rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2"
            >
              <span className="text-sm font-black text-white">{target.nickname}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
