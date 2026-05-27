import { db } from '../../firebase'
import { doc, updateDoc } from 'firebase/firestore'

export default function Voting({ room, players, alivePlayers, me, isHost, onClose, onLeave }) {
  const votes = room.votes || {}
  const myVote = votes[me?.id]
  const numVoted = Object.keys(votes).length
  const numAlive = alivePlayers.length
  const everyoneVoted = numVoted >= numAlive
  const meAlive = me?.alive

  async function castVote(targetId) {
    if (!meAlive) return
    await updateDoc(doc(db, 'rooms', room.id), {
      [`votes.${me.id}`]: targetId,
    })
  }

  return (
    <div className="app">
      <div className="row-between fade-in">
        <div className="pill live">Vote · Manche {room.round}</div>
        <button className="btn-ghost" onClick={onLeave}>Quitter</button>
      </div>

      <div className="stack stack-md fade-in" style={{ marginTop: 20 }}>
        <div className="center">
          <h2>Élimine quelqu'un</h2>
          <div className="tagline" style={{ marginTop: 8 }}>
            {numVoted} / {numAlive} ont voté
          </div>
        </div>

        <div className="stack stack-sm">
          {alivePlayers.map(p => {
            const votesForP = Object.values(votes).filter(v => v === p.id).length
            const isMe = p.id === me?.id
            const selected = myVote === p.id
            return (
              <button
                key={p.id}
                className={`vote-option ${selected ? 'selected' : ''}`}
                disabled={isMe || !meAlive}
                onClick={() => castVote(p.id)}
              >
                <div className="row-gap">
                  <div className="avatar" style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent), #7c1d1d)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--display)', fontSize: 16
                  }}>
                    {p.nickname[0]?.toUpperCase()}
                  </div>
                  <span>{p.nickname}{isMe && ' (toi)'}</span>
                </div>
                {votesForP > 0 && (
                  <span className="pill">{votesForP}</span>
                )}
              </button>
            )
          })}
        </div>

        {!meAlive && (
          <div className="tagline center">Tu es éliminé · spectateur</div>
        )}
      </div>

      <div className="grow" />

      {isHost && (
        <button
          className="btn btn-primary fade-in"
          disabled={numVoted === 0}
          onClick={onClose}
        >
          {everyoneVoted ? 'Clôturer le vote' : `Clôturer (${numVoted}/${numAlive})`}
        </button>
      )}
      {!isHost && everyoneVoted && (
        <div className="tagline center fade-in pulse">L'hôte clôture le vote…</div>
      )}
    </div>
  )
}
