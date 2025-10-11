import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import useFinancialStore from '../store/useFinancialStore'
import AIModelSelector from './AIModelSelector'

const TopNav = () => {
  const [isMuted, setIsMuted] = useState(false)
  const [selectedModel, setSelectedModel] = useState('google/gemini-1.5-pro')
  const location = useLocation()
  const { refreshData, isLoading } = useFinancialStore()

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
        
        {/* AI Model Selector */}
        <div className="ml-auto p-2">
          <AIModelSelector 
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </div>
        
        {/* Refresh Data Button */}
        <div className="p-2">
          <button
            className="sound-button mr-2"
            onClick={refreshData}
            disabled={isLoading}
          >
            {isLoading ? '⏳ Loading...' : '🔄 Refresh Data'}
          </button>
        </div>
        
        {/* Sound Toggle */}
        <div className="p-2">
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
