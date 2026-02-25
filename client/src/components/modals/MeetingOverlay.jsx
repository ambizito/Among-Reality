export default function MeetingOverlay({
  isOpen,
  meeting,
  meetingCheckinSec,
  meetingVoteSec,
  formatClock,
  isAlive,
  isInMeetingSnapshot,
  hasMeetingPresence,
  isEligibleVoter,
  hasVoted,
  getPlayerLabel,
  onOpenCheckinScanner,
  onCastVote,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl rounded-2xl bg-[#111827] border border-white/20 p-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black uppercase tracking-widest text-cyan-300">Reuniao</h3>
          <span className="text-[11px] uppercase tracking-wide text-gray-400">Fase: {meeting.phase}</span>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-3 mb-3">
          <p className="text-xs font-black uppercase tracking-wide text-cyan-200 mb-2">Mortos da rodada</p>
          {meeting.roundDeaths?.length ? (
            <div className="space-y-1">
              {meeting.roundDeaths.map((death) => (
                <p key={death.corpseId} className="text-sm text-gray-200">{getPlayerLabel(death.victimId)}</p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-300">Nenhum corpo reportado nesta reuniao.</p>
          )}
        </div>

        {meeting.phase === 'CHECKIN' && (
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 mb-3">
            <p className="text-xs uppercase tracking-wide text-cyan-200 font-black mb-2">
              Presenca por QR: {meeting.presenceConfirmed?.length || 0}/{meeting.aliveSnapshot?.length || 0}
            </p>
            <p className="text-sm text-cyan-100 mb-3">Tempo restante: {formatClock(meetingCheckinSec)}</p>

            {isAlive && isInMeetingSnapshot && !hasMeetingPresence && (
              <button
                type="button"
                onClick={onOpenCheckinScanner}
                className="w-full py-2 rounded-lg bg-cyan-600 text-xs font-black uppercase tracking-wide"
              >
                Escanear QR de presenca
              </button>
            )}
            {hasMeetingPresence && <p className="text-xs text-green-300 font-black uppercase tracking-wide">Presenca confirmada</p>}
            {!isInMeetingSnapshot && <p className="text-xs text-gray-300 uppercase tracking-wide">Voce nao estava vivo no snapshot desta reuniao.</p>}
          </div>
        )}

        {meeting.phase === 'VOTING' && (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 mb-3">
            <p className="text-xs uppercase tracking-wide text-yellow-200 font-black mb-2">
              Votacao: {meeting.votes?.length || 0}/{meeting.eligibleVoters?.length || 0}
            </p>
            <p className="text-sm text-yellow-100 mb-3">Tempo restante: {formatClock(meetingVoteSec)}</p>

            {isEligibleVoter && !hasVoted && (
              <div className="space-y-2">
                {(meeting.aliveSnapshot || []).map((candidateId) => (
                  <button
                    key={candidateId}
                    type="button"
                    onClick={() => onCastVote(candidateId)}
                    className="w-full text-left rounded-lg border border-yellow-500/30 bg-yellow-500/15 px-3 py-2"
                  >
                    <span className="text-sm font-black text-white">{getPlayerLabel(candidateId)}</span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => onCastVote('SKIP')}
                  className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-black uppercase tracking-wide"
                >
                  Skip
                </button>
              </div>
            )}
            {isEligibleVoter && hasVoted && <p className="text-xs text-green-300 font-black uppercase tracking-wide">Voto registrado, aguardando os demais.</p>}
            {!isEligibleVoter && <p className="text-xs text-gray-300 uppercase tracking-wide">Voce nao esta elegivel para voto nesta reuniao.</p>}
          </div>
        )}

        {meeting.phase === 'RESULT' && (
          <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3">
            <p className="text-xs uppercase tracking-wide text-purple-200 font-black mb-2">Resultado</p>
            <p className="text-sm text-white">Motivo: {meeting.result?.reason || 'N/A'}</p>
            <p className="text-sm text-white">Expulso: {meeting.result?.ejectedPlayerId ? getPlayerLabel(meeting.result.ejectedPlayerId) : 'Ninguem'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
