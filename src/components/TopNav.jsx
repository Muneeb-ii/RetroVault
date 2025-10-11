import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const TopNav = () => {
  const [isMuted, setIsMuted] = useState(false)
  const location = useLocation()

  const tabs = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Time Machine', path: '/time' },
    { name: 'Insights', path: '/insights' },
    { name: 'Story Mode', path: '/story' }
  ]

  return (
    <div className="retro-window mb-4">
      {/* Header Banner */}
      <div className="bg-retro-blue text-white p-2 text-center font-retro text-sm">
        💾 RetroVault — Rewind your finances. Fast-forward your future.
      </div>
      
      {/* Navigation Tabs */}
      <div className="flex bg-retro-gray border-b-2 border-gray-400">
        {tabs.map((tab) => (
          <Link
            key={tab.path}
            to={tab.path}
            className={`retro-tab px-4 py-2 text-sm font-retro ${
              location.pathname === tab.path ? 'active' : ''
            }`}
          >
            {tab.name}
          </Link>
        ))}
        
        {/* Sound Toggle */}
        <div className="ml-auto p-2">
          <button
            className="sound-button"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? '🔇 Mute' : '🔊 Sound'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TopNav
