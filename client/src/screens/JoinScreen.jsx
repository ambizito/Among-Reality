export default function JoinScreen({ nickname, onNicknameChange, onEnterLobby, notice }) {
  return (
    <div className="h-screen bg-[#0b0e14] flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-[#1e293b] rounded-2xl p-6 border border-white/10 text-white">
        <h1 className="text-3xl font-black tracking-widest text-cyan-300 text-center mb-6">AMONG REALITY</h1>
        <input
          type="text"
          placeholder="SEU NOME"
          value={nickname}
          onChange={(event) => onNicknameChange(event.target.value.toUpperCase())}
          className="w-full rounded-xl border border-white/20 bg-black/20 p-4 text-center text-lg font-bold outline-none focus:border-cyan-400"
        />
        <button
          type="button"
          onClick={onEnterLobby}
          className="w-full mt-4 py-4 rounded-xl bg-cyan-600 font-black uppercase tracking-wide"
        >
          Entrar na sala
        </button>
        {notice && <p className="mt-3 text-xs text-red-300 font-bold">{notice}</p>}
      </div>
    </div>
  );
}
