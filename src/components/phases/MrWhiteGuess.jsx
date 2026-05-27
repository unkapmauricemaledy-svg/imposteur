import { useState } from 'react'

export default function MrWhiteGuess({ room, players, me, isHost, onSubmit, onLeave }) {
  const eliminated = players.find(p => p.id === room.eliminatedThisRound)
  const amIMrWhite = eliminated?.id === me?.id
  const [guess, setGuess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (!guess.trim()) return
    setSubmitting(true)
    try { await onSubmit(guess.trim()) } finally { setSubmitting(false) }
  }

  return (
    <div className="app">
      <div className="row-between fade-in">
        <div className="pill live">Dernière chance</div>
        <button className="btn-ghost" onClick={onLeave}>Quitter</button>
      </div>

      <div className="stack stack-md fade-in" style={{ marginTop: 20 }}>
        <div className="center">
          <div className="label" style={{ marginBottom: 8 }}>Éliminé</div>
          <h2 style={{ color: 'var(--mrwhite)' }}>{eliminated?.nickname}</h2>
          <div className="tagline" style={{ marginTop: 8 }}>était <b style={{ color: 'var(--mrwhite)' }}>Mr White</b></div>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, lineHeight: 1.6 }}>
            {amIMrWhite ? (
              <>Devine le mot des civils. Si tu trouves, <b style={{ color: 'var(--civil)' }}>tu gagnes</b> la partie tout seul.</>
            ) : (
              <>Le Mr White essaie de deviner votre mot secret. S'il trouve, il gagne tout.</>
            )}
          </div>
        </div>

        {amIMrWhite && (
          <div className="stack stack-md fade-in">
            <input
              autoFocus
              className="input input-code"
              style={{ fontSize: 28 }}
              placeholder="Le mot ?"
              maxLength={30}
              value={guess}
              onChange={e => setGuess(e.target.value)}
              autoCapitalize="off"
              autoCorrect="off"
            />
            <button
              className="btn btn-primary"
              disabled={!guess.trim() || submitting}
              onClick={submit}
            >
              {submitting ? 'Envoi…' : 'Tenter'}
            </button>
          </div>
        )}

        {!amIMrWhite && (
          <div className="tagline center pulse" style={{ marginTop: 16 }}>
            {eliminated?.nickname} réfléchit…
          </div>
        )}
      </div>
    </div>
  )
}
