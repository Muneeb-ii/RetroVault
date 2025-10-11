import { useState, useEffect } from 'react'
import TopNav from '../components/TopNav'
import SideBar from '../components/SideBar'
import useFinancialStore from '../store/useFinancialStore'
import { generateFinancialStory, generateStoryMetadata } from '../api/storyService'

const StoryMode = () => {
  const { data } = useFinancialStore()
  const [story, setStory] = useState('')
  const [metadata, setMetadata] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)

  // Generate story when component mounts
  useEffect(() => {
    generateStory()
  }, [data])

  const generateStory = async () => {
    setIsGenerating(true)
    setLoadingProgress(0)
    
    // Simulate retro boot-up sequence
    const bootSequence = [
      'Initializing RetroVault...',
      'Loading financial data...',
      'Analyzing spending patterns...',
      'Generating narrative...',
      'Finalizing story...'
    ]
    
    for (let i = 0; i < bootSequence.length; i++) {
      setLoadingProgress((i + 1) * 20)
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    
    try {
      const storyText = await generateFinancialStory(
        data.transactions,
        data.savings,
        data.aiInsight,
        data.balance
      )
      setStory(storyText)
      
      const storyMeta = generateStoryMetadata(data.transactions, data.savings, data.balance)
      setMetadata(storyMeta)
    } catch (error) {
      console.error('Error generating story:', error)
      setStory('Unable to generate story at this time. Please try again later.')
    } finally {
      setIsGenerating(false)
      setLoadingProgress(100)
    }
  }

  const playStory = () => {
    setIsPlaying(true)
    // Simulate audio playback with visual feedback
    setTimeout(() => {
      setIsPlaying(false)
    }, 5000) // 5 second simulation
  }

  return (
    <div className="min-h-screen p-4">
      <TopNav />
      <div className="flex">
        <SideBar />
        <div className="flex-1">
          <div className="retro-window p-4">
            <div className="text-center font-bold text-lg mb-4 text-retro-dark">
              📖 STORY MODE
            </div>
            
            {/* Story Generation Section */}
            <div className="retro-info mb-6">
              <div className="text-center mb-4">
                <div className="text-lg font-bold mb-2">Generate Your Financial Story</div>
                <div className="text-sm text-gray-600">
                  Turn your financial data into an engaging narrative
                </div>
              </div>
              
              <div className="text-center">
                <button
                  className="retro-button px-6 py-3 text-lg font-bold"
                  onClick={generateStory}
                  disabled={isGenerating}
                >
                  {isGenerating ? '⏳ Generating...' : '📚 Generate Story'}
                </button>
              </div>
            </div>

            {/* Loading Animation */}
            {isGenerating && (
              <div className="retro-chart mb-6">
                <div className="text-center font-bold mb-4 text-sm">RETROVAULT BOOT SEQUENCE</div>
                <div className="space-y-2">
                  <div className="retro-boot-screen">
                    <div className="mb-2">RetroVault v1.0 - Story Mode</div>
                    <div className="mb-2">Loading financial narrative...</div>
                    <div className="flex items-center space-x-2">
                      <div className="retro-progress-bar w-32">
                        <div 
                          className="retro-progress-fill"
                          style={{ width: `${loadingProgress}%` }}
                        />
                      </div>
                      <span className="text-xs">{loadingProgress}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Story Display */}
            {story && !isGenerating && (
              <div className="space-y-6">
                {/* Story Metadata */}
                {metadata && (
                  <div className="retro-chart">
                    <div className="text-center font-bold mb-4 text-sm">STORY METADATA</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div className="story-metadata-card">
                        <div className="text-lg font-bold text-blue-600">{metadata.totalTransactions}</div>
                        <div className="text-xs">Transactions</div>
                      </div>
                      <div className="story-metadata-card">
                        <div className="text-lg font-bold text-green-600">${metadata.avgTransaction}</div>
                        <div className="text-xs">Avg Amount</div>
                      </div>
                      <div className="story-metadata-card">
                        <div className="text-lg font-bold text-purple-600">{metadata.savingsGrowth}%</div>
                        <div className="text-xs">Savings Growth</div>
                      </div>
                      <div className="story-metadata-card">
                        <div className="text-lg font-bold text-orange-600">{metadata.difficulty}</div>
                        <div className="text-xs">Level</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Story Text */}
                <div className="retro-chart">
                  <div className="text-center font-bold mb-4 text-sm">YOUR FINANCIAL ADVENTURE</div>
                  <div className="story-container">
                    <div className="story-text">
                      {story}
                    </div>
                  </div>
                </div>

                {/* Play Story Button */}
                <div className="text-center">
                  <button
                    className="retro-button px-6 py-3 text-lg font-bold"
                    onClick={playStory}
                    disabled={isPlaying}
                  >
                    {isPlaying ? '🔊 Playing...' : '▶️ Play Story'}
                  </button>
                </div>

                {/* Audio Visualization */}
                {isPlaying && (
                  <div className="retro-chart">
                    <div className="text-center font-bold mb-4 text-sm">AUDIO VISUALIZATION</div>
                    <div className="audio-visualizer">
                      {[...Array(20)].map((_, i) => (
                        <div
                          key={i}
                          className="audio-bar"
                          style={{
                            height: `${Math.random() * 40 + 10}px`,
                            animationDelay: `${i * 0.1}s`
                          }}
                        />
                      ))}
                    </div>
                    <div className="text-center mt-2 text-xs text-gray-600">
                      Narrating your financial journey...
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Story Mode Info */}
            <div className="retro-info text-center">
              <div className="text-4xl mb-4">📚</div>
              <div className="text-lg mb-2">Interactive Financial Storytelling</div>
              <div className="text-sm text-gray-600">
                Experience your financial journey as an engaging narrative. 
                Story Mode transforms your data into a personalized adventure, 
                complete with achievements, milestones, and character progression.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StoryMode
