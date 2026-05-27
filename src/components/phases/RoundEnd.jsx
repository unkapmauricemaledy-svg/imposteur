const ROLE_DISPLAY = {
  civil: { name: 'Civil', cls: 'civil' },
  imposter: { name: 'Imposteur', cls: 'imposter' },
  mrwhite: { name: 'Mr White', cls: 'mrwhite' },
}

export default function RoundEnd({ room, players, isHost, onNext, onLeave }) {
  const eliminated = players.find(p => p.id === room.eliminatedThisRound)
  const role = eliminated ? ROLE_DISPLAY[eliminated.role] : null

  return (
    <div className="app">
      <div className="row-between fade-in">
        <div className="pill live">Manche {room.round} · Résultat</div>
        <button className="btn-ghost" onClick={onLeave}>Quitter</button>
      </div>

      <div className="grow" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24 }}>
        <div className="center fade-in">
          <div className="label" style={{ marginBottom: 12 }}>Éliminé</div>
          <h1 className={role?.cls === 'imposter' ? 'accent' : ''} style={{ color: role?.cls === 'civil' ? 'var(--civil)' : role?.cls === 'imposter' ? 'var(--imposter)' : 'var(--mrwhite)' }}>
            {eliminated?.nickname}
          </h1>
        </div>

        <div className={`role-card ${role?.cls} fade-in`}>
          <div className="role-label">Était</div>
          <div className={`role-name ${role?.cls}`}>{role?.name}</div>
          {eliminated?.role !== 'mrwhite' && (
            <>
              <div className="role-label" style={{ marginTop: 4 }}>Son mot</div>
              <div className="secret-word">{eliminated?.word}</div>
            </>
          )}
        </div>

        {room.mrWhiteGuess !== null && room.mrWhiteGuess !== undefined && (
          <div className="card fade-in" style={{ textAlign: 'center' }}>
            <div className="label" style={{ marginBottom: 8 }}>Mr White a deviné</div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 32, letterSpacing: '0.04em' }}>
              «&nbsp;{room.mrWhiteGuess}&nbsp;»
            </div>
            <div className="tagline" style={{ marginTop: 12 }}>
              Mot recherché : <b style={{ color: 'var(--civil)' }}>{room.civilWord}</b>
            </div>
            <div style={{
              marginTop: 12, fontWeight: 700,
              color: room.mrWhiteWon ? 'var(--mrwhite)' : 'var(--text-dim)'
            }}>
              {room.mrWhiteWon ? '✓ TROUVÉ — Mr White gagne' : '✗ Raté'}
            </div>
          </div>
        )}
      </div>

      {isHost && (
        <button className="btn btn-primary fade-in" onClick={onNext}>
          Continuer
        </button>
      )}
      {!isHost && (
        <div className="tagline center fade-in pulse">L'hôte continue la partie…</div>
      )}
    </div>
  )
}
