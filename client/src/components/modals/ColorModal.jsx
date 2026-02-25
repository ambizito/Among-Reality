import { X } from 'lucide-react';

export default function ColorModal({
  isOpen,
  availableColors,
  usedColors,
  currentColor,
  onSelectColor,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl bg-[#1f2840] border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-3xl font-black uppercase tracking-wide">Traje</h3>
          <button type="button" onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-6">
          {availableColors.map((colorOption) => {
            const takenByOther = usedColors.includes(colorOption.id) && currentColor !== colorOption.id;
            const selected = currentColor === colorOption.id;

            return (
              <button
                key={colorOption.id}
                type="button"
                onClick={() => {
                  if (takenByOther) return;
                  onSelectColor(colorOption.id);
                }}
                className={`relative w-16 h-16 rounded-full border-2 transition-all ${selected ? 'border-white scale-105 shadow-[0_0_0_4px_rgba(255,255,255,0.2)]' : 'border-transparent'} ${takenByOther ? 'opacity-35 grayscale cursor-not-allowed' : 'hover:scale-105'}`}
                style={{ backgroundColor: colorOption.hex }}
                title={colorOption.name}
              >
                {takenByOther && <span className="absolute inset-0 flex items-center justify-center text-white font-black text-lg">X</span>}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-4 rounded-2xl bg-white/10 font-black uppercase tracking-[0.15em]"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
