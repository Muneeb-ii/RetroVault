// Retro-styled authentication modal component
import { useState } from 'react'
import { useAuthInit } from '../hooks/useAuthInit'

const AuthModal = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  
  const { signInWithEmail, signUpWithEmail, signInAndSeedIfNeeded, isLoading } = useAuthInit()

  const handleEmailAuth = async (e) => {
    e.preventDefault()
    setError('')
    
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, displayName)
      } else {
        await signInWithEmail(email, password)
      }
      onClose()
    } catch (error) {
      setError(error.message)
    }
  }

  const handleGoogleAuth = async () => {
    try {
      await signInAndSeedIfNeeded()
      onClose()
    } catch (error) {
      setError(error.message)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="window max-w-md w-full mx-4">
        <div className="title-bar">
          <div className="title-bar-text">🔐 RetroVault Authentication</div>
          <div className="title-bar-controls">
            <button aria-label="Minimize"></button>
            <button aria-label="Maximize"></button>
            <button aria-label="Close" onClick={onClose}></button>
          </div>
        </div>
        <div className="window-body">
          <div className="space-y-4">
            {/* Google Sign-In Button */}
            <div className="text-center">
              <button
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="retro-button w-full py-3 text-lg font-bold"
              >
                {isLoading ? '⏳ Processing...' : '🔑 Sign in with Google'}
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center">
              <div className="flex-1 border-t border-gray-400"></div>
              <span className="px-4 text-sm text-gray-600">or</span>
              <div className="flex-1 border-t border-gray-400"></div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="field w-full"
                    placeholder="Enter your name"
                    required={isSignUp}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field w-full"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field w-full"
                  placeholder="Enter your password"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="retro-info bg-red-100 border-red-300 text-red-700 p-2 text-sm">
                  ❌ {error}
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="retro-button flex-1 py-2"
                >
                  {isLoading ? '⏳ Processing...' : (isSignUp ? '📝 Sign Up' : '🔑 Sign In')}
                </button>
              </div>
            </form>

            {/* Toggle Sign Up/Sign In */}
            <div className="text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-blue-600 hover:underline"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </div>
        </div>
        <div className="status-bar">
          <div className="status-bar-field">Secure authentication powered by Firebase</div>
        </div>
      </div>
    </div>
  )
}

export default AuthModal
