import { useState, useEffect } from 'react'
import TopNav from '../components/TopNav'
import SideBar from '../components/SideBar'
import { useFinancialData } from '../contexts/FinancialDataContext'
import { generateFinancialStory, generateStoryMetadata } from '../api/storyService'
import { ElevenLabsClient, play } from '@elevenlabs/elevenlabs-js';

const StoryMode = () => {
  const { financialData, isLoading, error } = useFinancialData()
  const [story, setStory] = useState('')
  const [metadata, setMetadata] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isAudioLoading, setIsAudioLoading] = useState(false)
  const [audioLoadingProgress, setAudioLoadingProgress] = useState(0)
   const elevenlabs = new ElevenLabsClient({
     apiKey: import.meta.env.VITE_ELEVENLABS_API_KEY,
   });

const playStoryAudio = async (story) => {
  console.log(story)
  try {
    
     const audio = await elevenlabs.textToSpeech.convert("EXAVITQu4vr4xnSDxMaL", {
       text: story,
       modelId: "eleven_multilingual_v2",
     });

     const chunks= [];
     for await (const chunk of audio) {
       chunks.push(chunk);
     }
     const blob = new Blob(chunks, { type: 'audio/mpeg' });
     const audioUrl = URL.createObjectURL(blob);
    
     const audioElement = new Audio(audioUrl);
     await audioElement.play();
    
     // Optional: cleanup
     audioElement.addEventListener('ended', () => {
       URL.revokeObjectURL(audioUrl);
     });
    
  } catch (error) {
    console.error('Error playing audio:', error);
  }
};
  // Generate story when component mounts
  useEffect(() => {
    if (financialData && !story) {
      generateStory()
    }
  }, [financialData])

  const generateStory = async () => {
    if (!financialData) return
    
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
        financialData.transactions,
        financialData.savings,
        financialData.aiInsight,
        financialData.balance
      )
      setStory(storyText)
      
      const storyMeta = generateStoryMetadata(financialData.transactions, financialData.savings, financialData.balance)
      setMetadata(storyMeta)
    } catch (error) {
      console.error('Error generating story:', error)
      setStory('Unable to generate story at this time. Please try again later.')
    } finally {
      setIsGenerating(false)
      setLoadingProgress(100)
    }
  }

  const playStory = async () => {
    // Show 2 second loading filler while we request audio
    setIsAudioLoading(true)
    setAudioLoadingProgress(0)
    const start = Date.now()
    const duration = 2000
    const intv = setInterval(() => {
      const elapsed = Date.now() - start
      const pct = Math.min(100, Math.round((elapsed / duration) * 100))
      setAudioLoadingProgress(pct)
      if (elapsed >= duration) {
        clearInterval(intv)
        setIsAudioLoading(false)
      }
    }, 100)

    setIsPlaying(true)
    await playStoryAudio(story)
    // Simulate audio playback with visual feedback
    setTimeout(() => {
      setIsPlaying(false)
    }, 5000) // 5 second simulation
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center retro-auth-bg">
        <div className="window max-w-md">
          <div className="title-bar">
            <div className="title-bar-text">📖 Story Mode</div>
          </div>
          <div className="window-body text-center">
            <div className="text-lg font-bold mb-4">Loading financial data... Please Wait 💾</div>
            <div className="text-sm text-gray-600">Preparing your financial story</div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center retro-auth-bg">
        <div className="window max-w-md">
          <div className="title-bar">
            <div className="title-bar-text">❌ Error</div>
          </div>
          <div className="window-body text-center">
            <div className="text-lg font-bold mb-4 text-red-600">Failed to load data</div>
            <div className="text-sm text-gray-600 mb-4">{error}</div>
          </div>
        </div>
      </div>
    )
  }

  // No data state
  if (!financialData) {
    return (
      <div className="min-h-screen flex items-center justify-center retro-auth-bg">
        <div className="window max-w-md">
          <div className="title-bar">
            <div className="title-bar-text">📖 Story Mode</div>
          </div>
          <div className="window-body text-center">
            <div className="text-lg font-bold mb-4">No financial data available</div>
            <div className="text-sm text-gray-600">Please ensure your data is properly loaded</div>
          </div>
        </div>
      </div>
    )
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

                {/* Audio Loading Overlay (2s) */}
                {isAudioLoading && (
                  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="retro-window p-6 max-w-md mx-4">
                      <div className="text-center font-bold mb-4">🔊 Preparing Story Audio</div>
                      <div className="retro-boot-screen text-center">
                        <div className="mb-4">Warming up audio engines...</div>
                        <div className="flex items-center justify-center">
                          <div className="retro-progress-bar w-56">
                            <div className="retro-progress-fill" style={{ width: `${audioLoadingProgress}%` }} />
                          </div>
                        </div>
                        <div className="text-xs mt-2">{audioLoadingProgress}%</div>
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
