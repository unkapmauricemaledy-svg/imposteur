import { useMemo } from 'react'
import { db } from '../firebase'
import { doc, updateDoc, writeBatch, deleteDoc } from 'firebase/firestore'
import { computeElimination, checkWinner, isCorrectGuess, shuffle } from '../gameLogic'
import RoleReveal from './phases/RoleReveal'
import Discussion from './phases/Discussion'
import Voting from './phases/Voting'
import MrWhiteGuess from './phases/MrWhiteGuess'
import RoundEnd from './phases/RoundEnd'
import Finished from './phases/Finished'

export default function Game({ room, players, userId, onLeave, onError }) {
  const me = players.find(p => p.id === userId)
  const isHost = room.hostId === userId
  const alivePlayers = useMemo(() => players.filter(p => p.alive), [players])

  // Map id → role pour checkWinner (à partir de players state)
  const assignments = useMemo(() => {
    const map = {}
    for (const p of players) map[p.id] = { role: p.role, word: p.word }
    return map
  }, [players])

  // ---- Actions hôte ----
  async function startDiscussion() {
    await updateDoc(doc(db, 'rooms', room.id), {
      status: 'discussion',
      currentTurn: 0,
    })
  }

  async function nextSpeaker() {
    const next = room.currentTurn + 1
    if (next >= room.speakingOrder.length) {
      await updateDoc(doc(db, 'rooms', room.id), {
        status: 'voting',
        votes: {},
      })
    } else {
      await updateDoc(doc(db, 'rooms', room.id), { currentTurn: next })
    }
  }

  async function skipToVote() {
    await updateDoc(doc(db, 'rooms', room.id), {
      status: 'voting',
      votes: {},
    })
  }

  async function closeVote() {
    const result = computeElimination(room.votes || {}, alivePlayers)
    if (result.tied) {
      onError('Égalité ! On revote.')
      await updateDoc(doc(db, 'rooms', room.id), { votes: {} })
      return
    }
    const eliminated = players.find(p => p.id === result.eliminated)
    if (!eliminated) return
    const batch = writeBatch(db)
    batch.update(doc(db, 'rooms', room.id, 'players', eliminated.id), { alive: false })
    if (eliminated.role === 'mrwhite') {
      batch.update(doc(db, 'rooms', room.id), {
        status: 'mrwhite_guess',
        eliminatedThisRound: eliminated.id,
      })
    } else {
      batch.update(doc(db, 'rooms', room.id), {
        status: 'round_end',
        eliminatedThisRound: eliminated.id,
      })
    }
    await batch.commit()
  }

  async function submitMrWhiteGuess(guess) {
    const won = isCorrectGuess(guess, room.civilWord)
    await updateDoc(doc(db, 'rooms', room.id), {
      mrWhiteGuess: guess,
      status: 'round_end',
      mrWhiteWon: won,
    })
  }

  async function nextRound() {
    // Vérifie victoire (en tenant compte du Mr White ayant deviné)
    const updatedPlayers = players.map(p =>
      p.id === room.eliminatedThisRound ? { ...p, alive: false } : p
    )
    if (room.mrWhiteWon) {
      await updateDoc(doc(db, 'rooms', room.id), {
        status: 'finished',
        winner: 'mrwhite',
      })
      return
    }
    const winner = checkWinner(updatedPlayers, assignments)
    if (winner) {
      await updateDoc(doc(db, 'rooms', room.id), {
        status: 'finished',
        winner,
      })
      return
    }
    // Continue: nouveau round, on remet à jour l'ordre de parole (joueurs vivants)
    const alive = updatedPlayers.filter(p => p.alive)
    const newOrder = shuffle(alive.map(p => p.id))
    await updateDoc(doc(db, 'rooms', room.id), {
      status: 'discussion',
      round: (room.round || 1) + 1,
      currentTurn: 0,
      speakingOrder: newOrder,
      votes: {},
      eliminatedThisRound: null,
      mrWhiteGuess: null,
      mrWhiteWon: false,
    })
  }

  async function playAgain() {
    // Reset complet de la room pour rejouer
    const batch = writeBatch(db)
    for (const p of players) {
      batch.update(doc(db, 'rooms', room.id, 'players', p.id), {
        role: null, word: '', alive: true,
      })
    }
    batch.update(doc(db, 'rooms', room.id), {
      status: 'lobby',
      round: 0,
      speakingOrder: [],
      currentTurn: 0,
      civilWord: '',
      imposterWord: '',
      votes: {},
      eliminatedThisRound: null,
      mrWhiteGuess: null,
      mrWhiteWon: false,
      winner: null,
      revealedBy: {},
    })
    await batch.commit()
  }

  async function leave() {
    try {
      if (isHost) {
        // Hôte quitte → ferme la room
        const batch = writeBatch(db)
        for (const p of players) {
          batch.delete(doc(db, 'rooms', room.id, 'players', p.id))
        }
        batch.delete(doc(db, 'rooms', room.id))
        await batch.commit()
      } else {
        await deleteDoc(doc(db, 'rooms', room.id, 'players', userId))
      }
    } catch (err) {
      console.error(err)
    } finally {
      onLeave()
    }
  }

  // ---- Routage par phase ----
  const sharedProps = { room, players, alivePlayers, userId, me, isHost, onError, onLeave: leave }

  if (room.status === 'reveal') {
    return <RoleReveal {...sharedProps} onContinue={startDiscussion} />
  }
  if (room.status === 'discussion') {
    return <Discussion {...sharedProps} onNext={nextSpeaker} onSkipToVote={skipToVote} />
  }
  if (room.status === 'voting') {
    return <Voting {...sharedProps} onClose={closeVote} />
  }
  if (room.status === 'mrwhite_guess') {
    return <MrWhiteGuess {...sharedProps} onSubmit={submitMrWhiteGuess} />
  }
  if (room.status === 'round_end') {
    return <RoundEnd {...sharedProps} onNext={nextRound} />
  }
  if (room.status === 'finished') {
    return <Finished {...sharedProps} onPlayAgain={playAgain} />
  }

  return (
    <div className="app">
      <div className="grow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="tagline pulse">Synchronisation…</div>
      </div>
    </div>
  )
}
