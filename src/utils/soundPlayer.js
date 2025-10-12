// Simple sound player for RetroVault
// Usage: import { play, stopAll, setMuted } from '../utils/soundPlayer'

const sounds = {
  startup: new URL('../assets/sounds/startup.mp3', import.meta.url).href,
  logon: new URL('../assets/sounds/logon.mp3', import.meta.url).href,
  logoff: new URL('../assets/sounds/logoff.mp3', import.meta.url).href,
  success: new URL('../assets/sounds/success.mp3', import.meta.url).href,
  error: new URL('../assets/sounds/error.mp3', import.meta.url).href,
  minorError: new URL('../assets/sounds/minor-error.mp3', import.meta.url).href,
  click1: new URL('../assets/sounds/moues_click1.mp3', import.meta.url).href,
  click2: new URL('../assets/sounds/mouse_click2.mp3', import.meta.url).href
}

let muted = false
let playing = []
let pendingQueue = []
let unlocked = false

export const setMuted = (value) => {
  muted = !!value
  if (muted) {
    // stop any playing audio when muted
    stopAll()
    pendingQueue = []
  }
}
export const isMuted = () => muted

export const stopAll = () => {
  try {
    playing.forEach(a => {
      try { a.pause() } catch (e) {}
      try { a.src = '' } catch (e) {}
    })
  } finally {
    playing = []
  }
}

const addFirstGestureListener = () => {
  if (typeof window === 'undefined' || unlocked) return

  const unlock = () => {
    unlocked = true
    tryPlayQueue()
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
  }

  window.addEventListener('pointerdown', unlock, { once: true })
  window.addEventListener('keydown', unlock, { once: true })
}

const tryPlayQueue = () => {
  if (muted || pendingQueue.length === 0) return
  const q = pendingQueue.slice()
  pendingQueue = []
  q.forEach(item => {
    try { play(item.name, item.opts) } catch (e) {}
  })
}

export const play = (name, { volume = 1.0, loop = false } = {}) => {
  if (muted) return null
  const src = sounds[name]
  if (!src) {
    console.warn(`Sound not found: ${name}`)
    return null
  }

  // Create audio element
  try {
    const a = new Audio(src)
    a.volume = Math.max(0, Math.min(1, volume))
    a.loop = !!loop

    // Attempt playback and capture promise to detect autoplay blocking
    const p = a.play()
    if (p && typeof p.then === 'function') {
      p.then(() => {
        // playback started
        playing.push(a)
        const cleanup = () => {
          const idx = playing.indexOf(a)
          if (idx >= 0) playing.splice(idx, 1)
          try { a.src = '' } catch (e) {}
        }
        a.addEventListener('ended', cleanup)
        a.addEventListener('pause', cleanup)
      }).catch((err) => {
        // Playback blocked by autoplay policy — queue it and wait for user gesture
        pendingQueue.push({ name, opts: { volume, loop } })
        addFirstGestureListener()
      })
    } else {
      // Some environments return undefined — assume started
      playing.push(a)
      const cleanup = () => {
        const idx = playing.indexOf(a)
        if (idx >= 0) playing.splice(idx, 1)
        try { a.src = '' } catch (e) {}
      }
      a.addEventListener('ended', cleanup)
      a.addEventListener('pause', cleanup)
    }

    return a
  } catch (e) {
    // If constructing/playing fails, queue it and ensure we listen for a gesture
    pendingQueue.push({ name, opts: { volume, loop } })
    addFirstGestureListener()
    return null
  }
}

export const unlockAudio = () => {
  if (typeof window === 'undefined') return
  if (!unlocked) {
    unlocked = true
    tryPlayQueue()
  }
}

export default { play, stopAll, setMuted, isMuted, unlockAudio }
