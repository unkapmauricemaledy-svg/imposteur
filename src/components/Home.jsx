import { useState } from 'react'
import { db } from '../firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { generateRoomCode } from '../gameLogic'

export default function Home({ userId, onEnter, onError }) {
  const [mode, setMode] = useState(null) // null | 'create' | 'join'
  const [nickname, setNickname] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate(e) {
    e?.preventDefault()
    if (!nickname.trim()) return onError('Choisis un pseudo')
    setLoading(true)
    try {
      // Génère un code unique
      let roomCode
      for (let i = 0; i < 8; i++) {
        roomCode = generateRoomCode(4)
        const snap = await getDoc(doc(db, 'rooms', roomCode))
        if (!snap.exists()) break
      }
      // Crée la room
      await setDoc(doc(db, 'rooms', roomCode), {
        hostId: userId,
        status: 'lobby',
        settings: { numImposters: 1, numMrWhites: 0, category: 'all' },
        round: 0,
        speakingOrder: [],
        currentTurn: 0,
        civilWord: '',
        imposterWord: '',
        votes: {},
        eliminatedThisRound: null,
        mrWhiteGuess: null,
        winner: null,
        createdAt: serverTimestamp(),
      })
      // Ajoute l'hôte comme joueur
      await setDoc(doc(db, 'rooms', roomCode, 'players', userId), {
        nickname: nickname.trim().slice(0, 20),
        isHost: true,
        alive: true,
        role: null,
        word: '',
        joinedAt: serverTimestamp(),
      })
      onEnter({ roomCode, nickname: nickname.trim() })
    } catch (err) {
      console.error(err)
      onError('Impossible de créer la room')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin(e) {
    e?.preventDefault()
    if (!nickname.trim()) return onError('Choisis un pseudo')
    const roomCode = code.trim().toUpperCase()
    if (roomCode.length < 4) return onError('Code invalide')
    setLoading(true)
    try {
      const snap = await getDoc(doc(db, 'rooms', roomCode))
      if (!snap.exists()) {
        onError('Cette room n\'existe pas')
        return
      }
      if (snap.data().status !== 'lobby') {
        onError('La partie a déjà commencé')
        return
      }
      await setDoc(doc(db, 'rooms', roomCode, 'players', userId), {
        nickname: nickname.trim().slice(0, 20),
        isHost: false,
        alive: true,
        role: null,
        word: '',
        joinedAt: serverTimestamp(),
      })
      onEnter({ roomCode, nickname: nickname.trim() })
    } catch (err) {
      console.error(err)
      onError('Impossible de rejoindre')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <div style={{ marginTop: 40 }} className="fade-in">
        <div className="brand">
          L<span style={{ opacity: 0.5 }}>'</span>
          <span className="accent">Imposteur</span>
        </div>
        <div className="tagline">Trouve le menteur · Bluffe les autres</div>
      </div>

      <div className="grow" />

      {!mode && (
        <div className="stack stack-md fade-in">
          <button className="btn btn-primary" onClick={() => setMode('create')}>
            Créer une partie
          </button>
          <button className="btn btn-secondary" onClick={() => setMode('join')}>
            Rejoindre
          </button>
          <div className="tagline center" style={{ marginTop: 12, fontSize: 10 }}>
            3 joueurs minimum · joue en ligne
          </div>
        </div>
      )}

      {mode === 'create' && (
        <form className="stack stack-md fade-in" onSubmit={handleCreate}>
          <div className="label">Ton pseudo</div>
          <input
            autoFocus
            className="input"
            placeholder="Karl"
            maxLength={20}
            value={nickname}
            onChange={e => setNickname(e.target.value)}
          />
          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'Création…' : 'Créer la room'}
          </button>
          <button className="btn-ghost" type="button" onClick={() => setMode(null)}>
            ← Retour
          </button>
        </form>
      )}

      {mode === 'join' && (
        <form className="stack stack-md fade-in" onSubmit={handleJoin}>
          <div className="label">Code de la room</div>
          <input
            autoFocus
            className="input input-code"
            placeholder="••••"
            maxLength={4}
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
          <div className="label" style={{ marginTop: 8 }}>Ton pseudo</div>
          <input
            className="input"
            placeholder="Stella"
            maxLength={20}
            value={nickname}
            onChange={e => setNickname(e.target.value)}
          />
          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'Connexion…' : 'Rejoindre'}
          </button>
          <button className="btn-ghost" type="button" onClick={() => setMode(null)}>
            ← Retour
          </button>
        </form>
      )}
    </div>
  )
}
