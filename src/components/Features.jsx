// Features section component for RetroVault
const Features = () => {
  const features = [
    {
      icon: '■',
      title: 'Interactive Retro Dashboard',
      description: 'Navigate your finances through a nostalgic Windows 98 interface. Every chart, button, and window is crafted for maximum retro appeal.',
      color: 'blue'
    },
    {
      icon: '◆',
      title: 'AI Financial Insights',
      description: 'Get personalized financial advice from multiple AI models including Gemini, Claude, GPT-4, and Llama. Your data, analyzed by the best AI minds.',
      color: 'green'
    },
    {
      icon: '▲',
      title: 'Time Machine Simulations',
      description: 'Navigate through your financial past, analyze your present spending, and project your future wealth with interactive time travel.',
      color: 'purple'
    },
    {
      icon: '●',
      title: 'Story Mode Narratives',
      description: 'Transform your financial journey into an engaging narrative. Experience your money story as an interactive adventure with achievements and milestones.',
      color: 'orange'
    },
    {
      icon: '★',
      title: 'Persistent Profiles with Firestore',
      description: 'Your financial data is securely stored and consistent across all sessions. Sign in from anywhere and pick up exactly where you left off.',
      color: 'indigo'
    },
    {
      icon: '♦',
      title: 'Retro Crypto Terminal',
      description: 'Trade, track, and simulate cryptocurrencies inside a vintage command-line interface. Watch pixelated candlestick charts update in real time, execute mock trades, and explore how blockchain assets would\'ve looked on a 90s desktop.',
      color: 'cyan'
    }
  ]

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'text-blue-600 bg-blue-50 border-blue-200',
      green: 'text-green-600 bg-green-50 border-green-200',
      purple: 'text-purple-600 bg-purple-50 border-purple-200',
      orange: 'text-orange-600 bg-orange-50 border-orange-200',
      red: 'text-red-600 bg-red-50 border-red-200',
      indigo: 'text-indigo-600 bg-indigo-50 border-indigo-200'
    }
    return colorMap[color] || colorMap.blue
  }

  return (
    <section id="features" className="py-16 bg-white">
  <div className="w-full px-4">
        <div className="window retro-window-animate">
          <div className="title-bar">
            <div className="title-bar-text">Features - Why RetroVault is Revolutionary</div>
            <div className="title-bar-controls">
              <button aria-label="Minimize"></button>
              <button aria-label="Maximize"></button>
              <button aria-label="Close"></button>
            </div>
          </div>
          <div className="window-body">
            <div className="text-center mb-12 retro-fade-in">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 retro-text-reveal">
                Built for the Future, Styled for the Past
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto retro-fade-in-delay-1">
                RetroVault combines cutting-edge AI technology with nostalgic design to create 
                the most engaging financial management experience ever built.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className={`retro-info p-6 ${getColorClasses(feature.color)} retro-feature-card-animate retro-card-hover`}
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-bold mb-3 retro-text-reveal" style={{animationDelay: `${index * 0.1 + 0.5}s`}}>{feature.title}</h3>
                    <p className="text-sm leading-relaxed retro-fade-in-delay-1" style={{animationDelay: `${index * 0.1 + 0.7}s`}}>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
          <div className="status-bar">
            <div className="status-bar-field">6 revolutionary features</div>
            <div className="status-bar-field">Built with modern tech</div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Features
