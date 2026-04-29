// Génère un token valide 30 secondes basé sur l'heure + secret du restaurant
export function generateToken(restoId, secret) {
  const timeSlot = Math.floor(Date.now() / 30000)
  const raw = `${restoId}-${secret}-${timeSlot}`
  // Hash simple
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36).toUpperCase().padStart(8, '0')
}

export function verifyToken(token, restoId, secret) {
  const now = Math.floor(Date.now() / 30000)
  // Vérifier le slot actuel et le précédent (tolérance 30s)
  return [now, now - 1].some(slot => {
    const raw = `${restoId}-${secret}-${slot}`
    let hash = 0
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash) + raw.charCodeAt(i)
      hash |= 0
    }
    return Math.abs(hash).toString(36).toUpperCase().padStart(8, '0') === token
  })
}

export function secondsLeft() {
  return 30 - (Math.floor(Date.now() / 1000) % 30)
}
