export default function Discussion({ room, players, me, isHost, onNext, onSkipToVote, onLeave }) {
  const order = room.speakingOrder || []
  const turn = room.currentTurn || 0
  const currentSpeakerId = order[turn]
  const currentSpeaker = players.find(p => p.id === currentSpeakerId)
  const isMyTurn = currentSpeakerId === me?.id
  const finished = turn >= order.length - 1

  return (
    <div className="app">
      <div className="row-between fade-in">
        <div className="pill live">Manche {room.round}</div>
        <button className="btn-ghost" onClick={onLeave}>Quitter</button>
      </div>

      <div className="stack stack-md fade-in" style={{ marginTop: 24 }}>
        <div className="label center">Tour de parole</div>
        <div className={`turn-indicator ${isMyTurn ? 'active' : ''}`}>
          <div className="label" style={{ marginBottom: 8 }}>
            {isMyTurn ? 'À TON TOUR' : 'C\'EST AU TOUR DE'}
          </div>
          <div style={{
            fontFamily: 'var(--display)',
            fontSize: 56,
            lineHeight: 1,
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }}>
            {currentSpeaker?.nickname || '—'}
          </div>
          <div className="tagline" style={{ marginTop: 12 }}>
            {turn + 1} / {order.length}
          </div>
        </div>

        {me?.role && me.role !== 'mrwhite' && (
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="label" style={{ marginBottom: 8 }}>Rappel · ton mot secret</div>
            <div className="secret-word" style={{ fontSize: 32, padding: '10px 20px' }}>{me.word}</div>
          </div>
        )}
        {me?.role === 'mrwhite' && (
          <div className="card" style={{ textAlign: 'center', borderColor: 'var(--mrwhite)' }}>
            <div className="label" style={{ marginBottom: 8 }}>Rappel</div>
            <div style={{ fontWeight: 600 }}>Tu es Mr White · improvise un mot crédible</div>
          </div>
        )}
      </div>

      <div className="card fade-in" style={{ marginTop: 16 }}>
        <div className="label" style={{ marginBottom: 12 }}>Règle</div>
        <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-dim)' }}>
          Chacun donne <b style={{ color: 'var(--text)' }}>UN mot</b> qui décrit son mot secret, sans le nommer.
          Sois ni trop précis (tu te grilles) ni trop vague (suspect).
        </div>
      </div>

      <div className="grow" />

      {isHost && (
        <div className="stack stack-sm fade-in">
          <button className="btn btn-primary" onClick={onNext}>
            {finished ? 'Passer au vote' : 'Joueur suivant'}
          </button>
          {!finished && (
            <button className="btn-ghost" onClick={onSkipToVote}>
              Sauter directement au vote
            </button>
          )}
        </div>
      )}
      {!isHost && (
        <div className="tagline center fade-in pulse">L'hôte gère le tour</div>
      )}
    </div>
  )
}
