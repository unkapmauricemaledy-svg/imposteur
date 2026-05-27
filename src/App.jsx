import { useEffect, useState } from 'react'
import { ensureAuth, db } from './firebase'
import { doc, onSnapshot, collection } from 'firebase/firestore'
import Home from './components/Home'
import Lobby from './components/Lobby'
import Game from './components/Game'

const LS_KEY = 'imposteur:session'

function loadSession() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null') } catch { return null }
}
function saveSession(s) {
  if (s) localStorage.setItem(LS_KEY, JSON.stringify(s))
  else localStorage.removeItem(LS_KEY)
}

export default function App() {
  const [authReady, setAuthReady] = useState(false)
  const [userId, setUserId] = useState(null)
  const [session, setSession] = useState(loadSession())   // { roomCode, nickname }
  const [room, setRoom] = useState(null)
  const [players, setPlayers] = useState([])
  const [toast, setToast] = useState(null)

  // Auth anonyme au démarrage
  useEffect(() => {
    ensureAuth()
      .then(user => { setUserId(user.uid); setAuthReady(true) })
      .catch(err => {
        console.error(err)
        setToast('Erreur d\'authentification. Vérifie ta config Firebase.')
      })
  }, [])

  // Subscribe to room + players quand on a une session
  useEffect(() => {
    if (!session?.roomCode || !authReady) {
      setRoom(null); setPlayers([])
      return
    }
    const code = session.roomCode
    const unsubRoom = onSnapshot(doc(db, 'rooms', code), snap => {
      if (!snap.exists()) {
        setToast('La room n\'existe plus.')
        leaveSession()
        return
      }
      setRoom({ id: snap.id, ...snap.data() })
    }, err => {
      console.error(err)
      setToast('Connexion perdue.')
    })
    const unsubPlayers = onSnapshot(collection(db, 'rooms', code, 'players'), snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      // tri par joinedAt
      list.sort((a, b) => (a.joinedAt?.seconds || 0) - (b.joinedAt?.seconds || 0))
      setPlayers(list)
    })
    return () => { unsubRoom(); unsubPlayers() }
  }, [session?.roomCode, authReady])

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  function enterSession(s) {
    saveSession(s); setSession(s)
  }
  function leaveSession() {
    saveSession(null); setSession(null); setRoom(null); setPlayers([])
  }

  if (!authReady) {
    return (
      <div className="app">
        <div className="grow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="tagline pulse">Connexion…</div>
        </div>
      </div>
    )
  }

  // Pas de session → écran d'accueil
  if (!session) {
    return (
      <>
        <Home userId={userId} onEnter={enterSession} onError={setToast} />
        {toast && <div className="toast">{toast}</div>}
      </>
    )
  }

  // En attente de la room
  if (!room) {
    return (
      <div className="app">
        <div className="grow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="tagline pulse">Chargement de la room…</div>
        </div>
      </div>
    )
  }

  // Lobby (room créée, partie pas démarrée)
  if (room.status === 'lobby') {
    return (
      <>
        <Lobby
          room={room}
          players={players}
          userId={userId}
          onLeave={leaveSession}
          onError={setToast}
        />
        {toast && <div className="toast">{toast}</div>}
      </>
    )
  }

  // Partie en cours / terminée → Game gère tous les sous-états
  return (
    <>
      <Game
        room={room}
        players={players}
        userId={userId}
        onLeave={leaveSession}
        onError={setToast}
      />
      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
