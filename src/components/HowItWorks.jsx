// How It Works section component for RetroVault
const HowItWorks = () => {
  const steps = [
    {
      number: '01',
      title: 'Sign In with Google',
      description: 'Authenticate securely with your Google account. Your data is protected with enterprise-grade security.',
      icon: '◆',
      details: [
        'One-click Google authentication',
        'Secure Firebase Auth integration',
        'No passwords to remember',
        'Enterprise-grade security'
      ]
    },
    {
      number: '02',
      title: 'Automatic Data Seeding',
      description: 'On your first visit, RetroVault fetches real financial data from Capital One\'s Nessie API and creates your personalized profile.',
      icon: '■',
      details: [
        'Real transaction data from Capital One',
        'Authentic spending patterns',
        'Automatic categorization',
        'Personalized financial profile'
      ]
    },
    {
      number: '03',
      title: 'Explore Your Dashboard',
      description: 'Navigate through your financial time machine with AI insights, interactive charts, and story mode.',
      icon: '▲',
      details: [
        'Interactive financial dashboard',
        'AI-powered insights and advice',
        'Time Machine for projections',
        'Story Mode for engagement'
      ]
    }
  ]

  return (
    <section id="howitworks" className="py-12" style={{background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'}}>
      <div className="w-full px-4">
        <div className="window retro-window-animate retro-scanlines shadow-2xl">
          <div className="title-bar">
            <div className="title-bar-text">🚀 How It Works - Simple as 1-2-3</div>
            <div className="title-bar-controls">
              <button aria-label="Minimize"></button>
              <button aria-label="Maximize"></button>
              <button aria-label="Close"></button>
            </div>
          </div>
          <div className="window-body p-6">
            <div className="text-center mb-8 retro-fade-in">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 retro-text-reveal bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Get Started in Minutes
              </h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed retro-fade-in-delay-1">
                RetroVault is designed to be intuitive and powerful. Follow these three simple steps 
                to begin your financial time travel journey.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {steps.map((step, index) => (
                <div key={index} className="retro-step-animate group" style={{animationDelay: `${index * 0.2}s`}}>
                  <div className="retro-chart p-6 retro-chart-animate retro-card-hover h-full flex flex-col hover:scale-105 transition-transform duration-300">
                    {/* Step Number */}
                    <div className="text-center mb-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full text-2xl font-bold mb-3 group-hover:scale-110 transition-transform duration-300">
                        {step.number}
                      </div>
                    </div>

                    {/* Step Content */}
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-800 mb-3 retro-text-reveal text-center">{step.title}</h3>
                      <p className="text-gray-600 mb-4 leading-relaxed retro-fade-in-delay-1 text-center">{step.description}</p>
                      
                      <div className="space-y-2">
                        {step.details.map((detail, detailIndex) => (
                          <div key={detailIndex} className="flex items-center text-sm text-gray-700 retro-fade-in-delay-2 bg-gray-50 px-3 py-2 rounded group-hover:bg-blue-50 transition-colors duration-300" style={{animationDelay: `${detailIndex * 0.1}s`}}>
                            <span className="text-green-600 mr-3 text-lg">✓</span>
                            <span className="font-medium">{detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
          <div className="status-bar">
            <div className="status-bar-field">⚡ 3 simple steps</div>
            <div className="status-bar-field">🔒 Automatic data processing</div>
            <div className="status-bar-field">🚀 Ready in minutes</div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
