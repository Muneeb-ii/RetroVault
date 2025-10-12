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
    <section id="howitworks" className="py-8 bg-gray-50">
  <div className="w-full px-4">
        <div className="window retro-window-animate">
          <div className="title-bar">
            <div className="title-bar-text">How It Works - Simple as 1-2-3</div>
            <div className="title-bar-controls">
              <button aria-label="Minimize"></button>
              <button aria-label="Maximize"></button>
              <button aria-label="Close"></button>
            </div>
          </div>
          <div className="window-body">
            <div className="text-center mb-6 retro-fade-in">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 retro-text-reveal">
                Get Started in Minutes
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-normal retro-fade-in-delay-1">
                RetroVault is designed to be intuitive and powerful. Follow these three simple steps 
                to begin your financial time travel journey.
              </p>
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="retro-step-animate" style={{animationDelay: `${index * 0.3}s`}}>
                  <div className="flex flex-col md:flex-row items-center gap-3">
                    {/* Step Number and Icon */}
                    <div className="flex-shrink-0">
                      <div className="retro-info w-24 h-24 flex flex-col items-center justify-center text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-1 retro-text-reveal">{step.number}</div>
                        <div className="text-2xl">{step.icon}</div>
                      </div>
                    </div>

                    {/* Step Content */}
                    <div className="flex-1">
                      <div className="retro-chart p-4 retro-chart-animate retro-card-hover">
                        <h3 className="text-xl font-bold text-gray-800 mb-2 retro-text-reveal">{step.title}</h3>
                        <p className="text-gray-600 mb-3 leading-normal retro-fade-in-delay-1">{step.description}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {step.details.map((detail, detailIndex) => (
                            <div key={detailIndex} className="flex items-center text-sm text-gray-700 retro-fade-in-delay-2" style={{animationDelay: `${detailIndex * 0.1}s`}}>
                              <span className="text-green-600 mr-2">✓</span>
                              {detail}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* ASCII Arrow Separator (except for last step) */}
                  {index < steps.length - 1 && (
                    <div className="flex justify-center my-3">
                      <div className="retro-info px-4 py-2 text-center">
                        <div className="text-2xl text-gray-600">↓</div>
                        <div className="text-xs text-gray-500 retro-text-reveal">Next Step</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
          <div className="status-bar">
            <div className="status-bar-field">3 simple steps</div>
            <div className="status-bar-field">Automatic data processing</div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
