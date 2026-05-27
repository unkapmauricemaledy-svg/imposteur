const WINNER_LABEL = {
  civils: { name: 'Les Civils', cls: 'civil', tagline: 'Ils ont démasqué tous les imposteurs' },
  imposters: { name: 'Les Imposteurs', cls: 'imposter', tagline: 'Le bluff a payé' },
  mrwhite: { name: 'Mr White', cls: 'mrwhite', tagline: 'Il a deviné le mot · victoire solo' },
}

const ROLE_LABEL = {
  civil: 'Civil',
  imposter: 'Imposteur',
  mrwhite: 'Mr White',
}

export default function Finished({ room, players, isHost, onPlayAgain, onLeave }) {
  const winner = WINNER_LABEL[room.winner] || { name: '—', cls: '', tagline: '' }

  return (
    <div className="app">
      <div className="row-between fade-in">
        <div className="pill">Fin de partie</div>
        <button className="btn-ghost" onClick={onLeave}>Quitter</button>
      </div>

      <div className="center fade-in" style={{ marginTop: 32 }}>
        <div className="label" style={{ marginBottom: 12 }}>Vainqueur</div>
        <h1 style={{
          color: winner.cls === 'civil' ? 'var(--civil)'
            : winner.cls === 'imposter' ? 'var(--imposter)'
            : 'var(--mrwhite)',
          textShadow: '0 0 40px currentColor',
        }}>
          {winner.name}
        </h1>
        <div className="tagline" style={{ marginTop: 12 }}>{winner.tagline}</div>
      </div>

      <div className="card stack stack-sm fade-in" style={{ marginTop: 24 }}>
        <div className="label">Mots de la manche</div>
        <div className="row-between" style={{ marginTop: 8 }}>
          <div>
            <div className="label" style={{ fontSize: 9 }}>Civils</div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 24, color: 'var(--civil)' }}>{room.civilWord}</div>
          </div>
          <div>
            <div className="label" style={{ fontSize: 9 }}>Imposteurs</div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 24, color: 'var(--imposter)' }}>{room.imposterWord}</div>
          </div>
        </div>
      </div>

      <div className="card stack stack-sm fade-in" style={{ marginTop: 16 }}>
        <div className="label">Tous les rôles</div>
        <div className="stack stack-sm" style={{ marginTop: 4 }}>
          {players.map(p => (
            <div key={p.id} className="row-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 600 }}>{p.nickname}</span>
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
                color: p.role === 'civil' ? 'var(--civil)'
                  : p.role === 'imposter' ? 'var(--imposter)'
                  : 'var(--mrwhite)'
              }}>
                {ROLE_LABEL[p.role] || '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grow" />

      {isHost ? (
        <button className="btn btn-primary fade-in" onClick={onPlayAgain}>
          Rejouer
        </button>
      ) : (
        <div className="tagline center fade-in pulse">En attente de l'hôte…</div>
      )}
    </div>
  )
}
