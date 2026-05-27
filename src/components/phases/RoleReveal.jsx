import { useState } from 'react'
import { db } from '../../firebase'
import { doc, updateDoc } from 'firebase/firestore'

const ROLE_LABELS = {
  civil: { name: 'Civil', tagline: 'Trouve les imposteurs', cls: 'civil' },
  imposter: { name: 'Imposteur', tagline: 'Reste discret · bluffe', cls: 'imposter' },
  mrwhite: { name: 'Mr White', tagline: 'Tu n\'as aucun mot · improvise', cls: 'mrwhite' },
}

export default function RoleReveal({ room, players, me, isHost, onContinue, onLeave }) {
  const [revealed, setRevealed] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)

  const revealedBy = room.revealedBy || {}
  const allReady = players.every(p => revealedBy[p.id])

  async function markReady() {
    setAcknowledged(true)
    setRevealed(false)
    await updateDoc(doc(db, 'rooms', room.id), {
      [`revealedBy.${me.id}`]: true,
    })
  }

  if (!me?.role) {
    return (
      <div className="app">
        <div className="grow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="tagline pulse">Distribution des rôles…</div>
        </div>
      </div>
    )
  }

  const role = ROLE_LABELS[me.role]

  return (
    <div className="app">
      <div className="row-between fade-in">
        <div className="pill live">Manche {room.round}</div>
        <button className="btn-ghost" onClick={onLeave}>Quitter</button>
      </div>

      <div className="grow" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24 }}>
        {!acknowledged ? (
          <>
            <div className="center fade-in">
              <div className="label" style={{ marginBottom: 12 }}>Ton rôle est secret</div>
              <div className="tagline">Cache ton écran des autres</div>
            </div>

            <div
              className={`role-card ${role.cls} tap-to-reveal ${revealed ? 'revealed' : ''} fade-in`}
              onClick={() => setRevealed(v => !v)}
            >
              <div className="role-label">Tu es</div>
              <div className={`role-name ${role.cls} blur-target`}>{role.name}</div>
              {me.role !== 'mrwhite' && (
                <>
                  <div className="role-label" style={{ marginTop: 8 }}>Ton mot</div>
                  <div className="secret-word blur-target">{me.word}</div>
                </>
              )}
              {me.role === 'mrwhite' && (
                <div className="blur-target" style={{ fontSize: 14, color: 'var(--text-dim)', textAlign: 'center' }}>
                  Aucun mot · écoute et improvise pour ne pas te faire griller
                </div>
              )}
              <div className="tagline blur-target" style={{ marginTop: 8 }}>{role.tagline}</div>
              {!revealed && (
                <div className="tagline" style={{ position: 'absolute', bottom: 16, left: 0, right: 0 }}>
                  ↑ Tape pour révéler
                </div>
              )}
            </div>

            <button
              className="btn btn-primary fade-in"
              disabled={!revealed}
              onClick={markReady}
            >
              {revealed ? 'J\'ai vu' : 'Révèle d\'abord'}
            </button>
          </>
        ) : (
          <div className="center fade-in stack stack-md">
            <div className="label">En attente des autres</div>
            <div className="brand" style={{ fontSize: 64 }}>
              <span className="accent">{Object.keys(revealedBy).length}</span>
              <span style={{ color: 'var(--text-faint)' }}> / {players.length}</span>
            </div>
            <div className="tagline">Joueurs prêts</div>
          </div>
        )}
      </div>

      {isHost && allReady && (
        <button className="btn btn-primary fade-in" onClick={onContinue}>
          Démarrer la discussion
        </button>
      )}
    </div>
  )
}
