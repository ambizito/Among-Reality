import AmongUsCharacter from '../character/AmongUsCharacter';

export default function InGameHeader({
  entryCode,
  fakeRoleLabel,
  avatarColor,
  isAvatarInteractive,
  onAvatarClick,
}) {
  return (
    <header className="p-5 flex justify-between items-center bg-[#0f172a]/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-20">
      <div>
        <h1 className="text-lg font-black tracking-widest">SALA: {entryCode}</h1>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Em jogo</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-xs font-black text-cyan-300">{fakeRoleLabel}</div>
        <button
          type="button"
          onClick={isAvatarInteractive ? onAvatarClick : undefined}
          disabled={!isAvatarInteractive}
          className={`rounded-full ${isAvatarInteractive ? 'cursor-pointer' : 'cursor-default'}`}
          aria-label={isAvatarInteractive ? 'Abrir painel secreto' : 'Avatar'}
        >
          <AmongUsCharacter color={avatarColor} className="w-10 h-10" />
        </button>
      </div>
    </header>
  );
}
