import { useState } from 'react'
import { getAvailableModels } from '../api/aiService'

const AIModelSelector = ({ selectedModel, onModelChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const models = getAvailableModels()

  return (
    <div className="relative">
      <button
        className="sound-button text-xs"
        onClick={() => setIsOpen(!isOpen)}
      >
        🧠 {selectedModel || 'Select AI Model'}
      </button>
      
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-white border-2 border-gray-400 shadow-lg z-10 min-w-48">
          <div className="p-2 bg-gray-200 border-b border-gray-400 text-xs font-bold">
            AI Models
          </div>
          {models.map((model) => (
            <button
              key={model.id}
              className={`w-full text-left px-2 py-1 text-xs hover:bg-gray-100 ${
                selectedModel === model.id ? 'bg-blue-100' : ''
              }`}
              onClick={() => {
                onModelChange(model.id)
                setIsOpen(false)
              }}
            >
              {model.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default AIModelSelector
