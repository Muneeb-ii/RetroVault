import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { play, unlockAudio } from './utils/soundPlayer'

// Global handler: play click sound for any <button> interactions and unlock queued audio
if (typeof window !== 'undefined') {
  const handler = (e) => {
    const el = e.target
    if (!el) return
    // Only play click sound for actual mouse clicks to match user's request
    const isMouse = e.pointerType ? e.pointerType === 'mouse' : (e.type === 'mousedown')
    if (!isMouse) {
      // Still unlock queued audio even for touch/keyboard
      try { unlockAudio() } catch (err) {}
      return
    }

    // Walk up DOM tree to see if a button was clicked
    let node = el
    while (node && node !== document.body) {
      if (node.tagName && node.tagName.toLowerCase() === 'button') {
        try { play('click1') } catch (err) {}
        break
      }
      node = node.parentElement
    }

    // Unlock any queued sounds on first gesture
    try { unlockAudio() } catch (err) {}
  }

  window.addEventListener('pointerdown', handler)
  // fallback for environments without pointer events
  window.addEventListener('mousedown', handler)
  window.addEventListener('keydown', (e) => { try { unlockAudio() } catch (err) {} })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
