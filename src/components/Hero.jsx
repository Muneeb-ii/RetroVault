// Hero section component for RetroVault
import { useNavigate } from 'react-router-dom'

const Hero = () => {
  const navigate = useNavigate()

  const handleSignIn = () => {
    navigate('/auth')
  }

  return (
    <section className="py-8" style={{background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'}}>
  <div className="w-full px-4">
        <div className="window retro-window-animate retro-scanlines">
          <div className="title-bar">
            <div className="title-bar-text">RetroVault - The AI Time Machine for Your Finances</div>
            <div className="title-bar-controls">
              <button aria-label="Minimize"></button>
              <button aria-label="Maximize"></button>
              <button aria-label="Close"></button>
            </div>
          </div>
          <div className="window-body">
            <div className="text-center">
              {/* Retro ASCII Art Header */}
              <div className="mb-3 retro-fade-in">
                <div className="mb-1 flex justify-center">
                  <img src="/favicon.png" alt="RetroVault" className="w-16 h-16" />
                </div>
                <div className="text-2xl font-bold text-blue-600 mb-2 retro-text-reveal">RetroVault</div>
              </div>
              
              {/* Main Headline */}
              <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-3 leading-tight retro-fade-in-delay-1">
                Rewind your finances.<br />
                <span className="text-blue-600 retro-glow">Fast-forward your future.</span>
              </h1>
              
              {/* Subheadline */}
              <p className="text-lg md:text-xl text-gray-600 mb-4 max-w-3xl mx-auto leading-normal retro-fade-in-delay-2">
                Experience the nostalgia of Windows 98 with the power of modern AI. 
                Transform your financial data into an interactive time machine that helps you 
                understand your past, optimize your present, and plan your future.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4 retro-fade-in-delay-3">
                <button
                  onClick={handleSignIn}
                  className="retro-button px-8 py-3 text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors retro-card-hover"
                >
                  Start Your Journey
                </button>
                
                <a 
                  href="#features" 
                  className="retro-button px-8 py-3 text-lg font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors retro-card-hover"
                >
                  Explore Features
                </a>
              </div>

              {/* Demo Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
                <div className="retro-info text-center p-4 retro-feature-card-animate retro-card-hover">
                  <div className="text-2xl font-bold text-blue-600 mb-2">AI-Powered</div>
                  <div className="text-sm text-gray-600">Smart insights from multiple AI models</div>
                </div>
                <div className="retro-info text-center p-4 retro-feature-card-animate retro-card-hover" style={{animationDelay: '0.2s'}}>
                  <div className="text-2xl font-bold text-green-600 mb-2">Time Machine</div>
                  <div className="text-sm text-gray-600">Navigate past, present, and future finances</div>
                </div>
                <div className="retro-info text-center p-4 retro-feature-card-animate retro-card-hover" style={{animationDelay: '0.4s'}}>
                  <div className="text-2xl font-bold text-purple-600 mb-2">Story Mode</div>
                  <div className="text-sm text-gray-600">Turn your data into engaging narratives</div>
                </div>
              </div>
            </div>
          </div>
          <div className="status-bar">
            <div className="status-bar-field">Ready to revolutionize your finances</div>
            <div className="status-bar-field">Built at BostonHacks 2025</div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
