import { pickRandomPair } from './words'

// Génère un code de room à 4 caractères (sans I, O, 0, 1 pour éviter confusion)
const ROOM_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function generateRoomCode(length = 4) {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += ROOM_CHARS[Math.floor(Math.random() * ROOM_CHARS.length)]
  }
  return code
}

// Mélange un tableau (Fisher-Yates)
export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Assigne les rôles à partir de la liste des joueurs et des paramètres
// Retourne { assignments: { playerId: { role, word } }, civilWord, imposterWord, speakingOrder }
export function assignRoles(players, { numImposters, numMrWhites, category }) {
  const n = players.length
  if (numImposters + numMrWhites >= n) {
    throw new Error('Trop d\'imposteurs/Mr White par rapport au nombre de joueurs')
  }

  const pair = pickRandomPair(category)
  const shuffled = shuffle(players)

  const assignments = {}
  let i = 0

  // D'abord les Mr White (aucun mot)
  for (let k = 0; k < numMrWhites; k++) {
    assignments[shuffled[i].id] = { role: 'mrwhite', word: '' }
    i++
  }

  // Puis les imposteurs (mot imposteur)
  for (let k = 0; k < numImposters; k++) {
    assignments[shuffled[i].id] = { role: 'imposter', word: pair.imposter }
    i++
  }

  // Les autres sont civils (mot civil)
  for (; i < shuffled.length; i++) {
    assignments[shuffled[i].id] = { role: 'civil', word: pair.civil }
  }

  // Ordre de parole: les Mr White ne parlent jamais en premier (pas fair)
  // On met d'abord un civil aléatoirement, puis le reste mélangé
  const civilIds = players.filter(p => assignments[p.id].role === 'civil').map(p => p.id)
  const others = players.filter(p => assignments[p.id].role !== 'civil').map(p => p.id)
  const firstSpeaker = civilIds[Math.floor(Math.random() * civilIds.length)]
  const rest = shuffle([...civilIds.filter(id => id !== firstSpeaker), ...others])
  const speakingOrder = [firstSpeaker, ...rest]

  return {
    assignments,
    civilWord: pair.civil,
    imposterWord: pair.imposter,
    speakingOrder,
  }
}

// Calcule le joueur éliminé à partir des votes { voterId: targetId }
// En cas d'égalité, retourne null (re-vote ou choix de l'hôte)
export function computeElimination(votes, alivePlayers) {
  const tally = {}
  for (const targetId of Object.values(votes)) {
    tally[targetId] = (tally[targetId] || 0) + 1
  }
  let maxVotes = 0
  let maxIds = []
  for (const [id, count] of Object.entries(tally)) {
    if (count > maxVotes) {
      maxVotes = count
      maxIds = [id]
    } else if (count === maxVotes) {
      maxIds.push(id)
    }
  }
  if (maxIds.length > 1) return { tied: true, candidates: maxIds, tally }
  return { tied: false, eliminated: maxIds[0], tally }
}

// Détermine si la partie est terminée
// civils gagnent si tous les imposteurs ET Mr White sont éliminés
// imposteurs gagnent si le nombre de civils restants <= imposteurs+mrwhite restants
export function checkWinner(players, assignments) {
  const alive = players.filter(p => p.alive)
  const aliveCivils = alive.filter(p => assignments[p.id]?.role === 'civil').length
  const aliveBadGuys = alive.filter(p => {
    const r = assignments[p.id]?.role
    return r === 'imposter' || r === 'mrwhite'
  }).length

  if (aliveBadGuys === 0) return 'civils'
  if (aliveCivils <= aliveBadGuys) return 'imposters'
  return null
}

// Vérifie si la devinette du Mr White correspond au mot civil (insensible casse/accents)
export function normalizeGuess(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

export function isCorrectGuess(guess, civilWord) {
  return normalizeGuess(guess) === normalizeGuess(civilWord)
}
