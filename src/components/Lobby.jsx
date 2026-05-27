import { useMemo } from 'react'
import { db } from '../firebase'
import { doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore'
import { assignRoles } from '../gameLogic'
import { CATEGORIES } from '../words'

export default function Lobby({ room, players, userId, onLeave, onError }) {
  const isHost = room.hostId === userId
  const settings = room.settings || { numImposters: 1, numMrWhites: 0, category: 'all' }
  const maxBadGuys = Math.max(0, players.length - 2) // au moins 2 civils

  const canStart = players.length >= 3 && (settings.numImposters + settings.numMrWhites) >= 1

  async function updateSettings(patch) {
    if (!isHost) return
    try {
      await updateDoc(doc(db, 'rooms', room.id), {
        settings: { ...settings, ...patch }
      })
    } catch (err) {
      console.error(err); onError('Maj impossible')
    }
  }

  async function startGame() {
    if (!isHost) return
    try {
      const { assignments, civilWord, imposterWord, speakingOrder } =
        assignRoles(players, settings)
      const batch = writeBatch(db)
      for (const p of players) {
        const a = assignments[p.id]
        batch.update(doc(db, 'rooms', room.id, 'players', p.id), {
          role: a.role,
          word: a.word,
          alive: true,
        })
      }
      batch.update(doc(db, 'rooms', room.id), {
        status: 'reveal',
        round: 1,
        speakingOrder,
        currentTurn: 0,
        civilWord,
        imposterWord,
        votes: {},
        eliminatedThisRound: null,
        mrWhiteGuess: null,
        winner: null,
        revealedBy: {},
      })
      await batch.commit()
    } catch (err) {
      console.error(err); onError(err.message || 'Démarrage impossible')
    }
  }

  async function leave() {
    try {
      await deleteDoc(doc(db, 'rooms', room.id, 'players', userId))
      // Si c'était le dernier joueur ou l'hôte → on supprime la room
      if (players.length <= 1 || isHost) {
        // Best effort cleanup
        const batch = writeBatch(db)
        for (const p of players) {
          if (p.id !== userId) batch.delete(doc(db, 'rooms', room.id, 'players', p.id))
        }
        batch.delete(doc(db, 'rooms', room.id))
        await batch.commit().catch(() => {})
      }
    } catch (err) {
      console.error(err)
    } finally {
      onLeave()
    }
  }

  const me = players.find(p => p.id === userId)

  return (
    <div className="app">
      <div className="row-between fade-in">
        <div>
          <div className="label">Room</div>
          <div className="pill live">En attente</div>
        </div>
        <button className="btn-ghost" onClick={leave}>Quitter</button>
      </div>

      <div className="stack stack-md fade-in" style={{ marginTop: 16 }}>
        <div className="room-code">{room.id}</div>
        <div className="tagline">Partage ce code avec tes potes</div>
      </div>

      <div className="card stack stack-sm fade-in" style={{ marginTop: 24 }}>
        <div className="row-between">
          <div className="label">Joueurs ({players.length})</div>
          <div className="label">{players.length < 3 ? 'Min. 3' : 'Prêt'}</div>
        </div>
        <div className="stack stack-sm" style={{ marginTop: 8 }}>
          {players.map(p => (
            <div key={p.id} className={`player-chip ${p.isHost ? 'host' : ''}`}>
              <div className="avatar">{p.nickname[0]?.toUpperCase() || '?'}</div>
              <div className="grow">{p.nickname}{p.id === userId && ' (toi)'}</div>
              {p.isHost && <div className="label">Hôte</div>}
            </div>
          ))}
        </div>
      </div>

      {isHost && (
        <div className="card stack stack-md fade-in" style={{ marginTop: 16 }}>
          <div className="label">Paramètres</div>

          <div>
            <div className="row-between" style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 600 }}>Imposteurs</div>
              <Stepper
                value={settings.numImposters}
                min={0}
                max={Math.max(0, maxBadGuys - settings.numMrWhites)}
                onChange={v => updateSettings({ numImposters: v })}
              />
            </div>
            <div className="tagline" style={{ fontSize: 10, textAlign: 'left', letterSpacing: '0.2em' }}>
              Reçoivent un mot proche du mot civil
            </div>
          </div>

          <div>
            <div className="row-between" style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 600 }}>Mr White</div>
              <Stepper
                value={settings.numMrWhites}
                min={0}
                max={Math.max(0, maxBadGuys - settings.numImposters)}
                onChange={v => updateSettings({ numMrWhites: v })}
              />
            </div>
            <div className="tagline" style={{ fontSize: 10, textAlign: 'left', letterSpacing: '0.2em' }}>
              N'a aucun mot · bluff total
            </div>
          </div>

          <div>
            <div className="label" style={{ marginBottom: 6 }}>Catégorie</div>
            <select
              className="select"
              value={settings.category}
              onChange={e => updateSettings({ category: e.target.value })}
            >
              <option value="all">Toutes catégories</option>
              {Object.entries(CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {!isHost && me && (
        <div className="card fade-in" style={{ marginTop: 16, textAlign: 'center' }}>
          <div className="tagline pulse">En attente du lancement par l'hôte…</div>
        </div>
      )}

      <div className="grow" />

      {isHost && (
        <button
          className="btn btn-primary fade-in"
          style={{ marginTop: 16 }}
          disabled={!canStart}
          onClick={startGame}
        >
          {!canStart ? `${3 - players.length > 0 ? `Encore ${3 - players.length} joueur(s)` : 'Choisis ≥ 1 imposteur'}` : 'Lancer la partie'}
        </button>
      )}
    </div>
  )
}

function Stepper({ value, min, max, onChange }) {
  return (
    <div className="stepper" style={{ width: 140 }}>
      <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>−</button>
      <div className="value">{value}</div>
      <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>+</button>
    </div>
  )
}
