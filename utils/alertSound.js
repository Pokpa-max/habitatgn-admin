// Son d'alerte de l'app d'administration (nouvelle demande, candidature…).
// Les navigateurs bloquent le son tant que la page n'a pas été touchée : le
// lecteur audio est créé et débloqué au premier clic / à la première touche,
// puis réutilisé pour chaque alerte.

let audioContext = null

const getAudioContext = () => {
  if (typeof window === 'undefined') return null
  if (!audioContext) {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext
    if (!AudioContextConstructor) return null
    audioContext = new AudioContextConstructor()
  }
  return audioContext
}

if (typeof window !== 'undefined') {
  const unlock = () => {
    const context = getAudioContext()
    if (context && context.state === 'suspended') context.resume().catch(() => {})
    if (context && context.state === 'running') {
      window.removeEventListener('pointerdown', unlock, true)
      window.removeEventListener('keydown', unlock, true)
    }
  }
  window.addEventListener('pointerdown', unlock, true)
  window.addEventListener('keydown', unlock, true)
}

const tone = (context, frequency, start) => {
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(frequency, start)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.25)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(start)
  oscillator.stop(start + 0.26)
}

/** Double bip discret ; silencieux si le navigateur bloque encore le son. */
export const playAlertSound = () => {
  const context = getAudioContext()
  if (!context) return
  const play = () => {
    const now = context.currentTime
    tone(context, 660, now)
    tone(context, 880, now + 0.18)
  }
  if (context.state === 'running') play()
  else context.resume().then(() => context.state === 'running' && play()).catch(() => {})
}
