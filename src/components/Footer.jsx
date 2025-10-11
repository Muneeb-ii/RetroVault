// Footer component for RetroVault
const Footer = () => {
  return (
    <footer className="bg-gray-200 border-t-2 border-gray-400">
      <div className="max-w-screen-lg mx-auto px-4 py-8">
        <div className="window">
          <div className="title-bar">
            <div className="title-bar-text">📧 Contact & Information</div>
            <div className="title-bar-controls">
              <button aria-label="Minimize"></button>
              <button aria-label="Maximize"></button>
              <button aria-label="Close"></button>
            </div>
          </div>
          <div className="window-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* About Section */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">💾 About RetroVault</h3>
                <p className="text-sm text-gray-600 mb-4">
                  A nostalgic reimagining of early-2000s personal finance software with modern AI capabilities. 
                  Built for hackathons and financial enthusiasts who appreciate both retro aesthetics and cutting-edge technology.
                </p>
                <div className="text-xs text-gray-500">
                  <div>Built at BostonHacks 2025</div>
                  <div>Powered by React + Firebase + AI</div>
                </div>
              </div>

              {/* Features Quick Links */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">🚀 Key Features</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Retro Windows 98 UI</li>
                  <li>• AI Financial Insights</li>
                  <li>• Financial Time Machine</li>
                  <li>• Story Mode</li>
                  <li>• Real Banking Data</li>
                  <li>• Persistent Profiles</li>
                </ul>
              </div>

              {/* Contact Section */}
              <div id="contact">
                <h3 className="text-lg font-bold text-gray-800 mb-4">📧 Contact</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <div>
                    <span className="font-bold">GitHub:</span> 
                    <a href="https://github.com/Muneeb-ii/RetroVault" className="text-blue-600 hover:underline ml-1">
                      RetroVault Repository
                    </a>
                  </div>
                  <div>
                    <span className="font-bold">Demo:</span> 
                    <span className="ml-1">Live at Vercel</span>
                  </div>
                  <div>
                    <span className="font-bold">Hackathon:</span> 
                    <span className="ml-1">BostonHacks 2025</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tech Stack */}
            <div className="mt-8 pt-6 border-t border-gray-300">
              <div className="retro-info p-4">
                <h4 className="text-sm font-bold text-center mb-3">🛠️ Built With Modern Technology</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-center">
                  <div>
                    <div className="font-bold text-blue-600">Frontend</div>
                    <div>React + Vite</div>
                    <div>TailwindCSS</div>
                    <div>98.css</div>
                  </div>
                  <div>
                    <div className="font-bold text-green-600">Backend</div>
                    <div>Node.js</div>
                    <div>Vercel Functions</div>
                    <div>Firebase Admin</div>
                  </div>
                  <div>
                    <div className="font-bold text-purple-600">Database</div>
                    <div>Firestore</div>
                    <div>Firebase Auth</div>
                    <div>Real-time Sync</div>
                  </div>
                  <div>
                    <div className="font-bold text-orange-600">AI & APIs</div>
                    <div>OpenRouter</div>
                    <div>Capital One Nessie</div>
                    <div>Multiple Models</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="status-bar">
            <div className="status-bar-field">RetroVault © 2025 | Built at BostonHacks 💾</div>
            <div className="status-bar-field">The AI Time Machine for Your Finances</div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
