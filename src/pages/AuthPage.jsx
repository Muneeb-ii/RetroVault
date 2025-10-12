// Dedicated authentication page for RetroVault
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebaseClient'
import { useFirebaseAuth } from '../hooks/useFirebaseAuth'
import authPageBg from '../assets/images/authPage.png'

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { signUpEmail, loginEmail, loginGoogle } = useFirebaseAuth()
  const navigate = useNavigate()

  // Redirect if already authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('🔒 User already authenticated, redirecting to dashboard')
        navigate('/dashboard')
      }
    })
    return unsubscribe
  }, [navigate])

  const handleEmailAuth = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      console.log('🔄 [AUTH_PAGE] Starting email authentication...')
      console.log('📧 [AUTH_PAGE] Email:', email)
      console.log('🔐 [AUTH_PAGE] Mode:', isLogin ? 'Login' : 'Sign Up')
      
      if (isLogin) {
        console.log('🔑 [AUTH_PAGE] Attempting email login...')
        await loginEmail(email, password)
        console.log('✅ [AUTH_PAGE] Email login successful')
      } else {
        console.log('📝 [AUTH_PAGE] Attempting email sign-up...')
        console.log('👤 [AUTH_PAGE] Display name:', displayName)
        await signUpEmail(email, password, displayName)
        console.log('✅ [AUTH_PAGE] Email sign-up successful')
      }
      // Navigation will be handled by the useEffect above
    } catch (error) {
      console.error('❌ [AUTH_PAGE] Email authentication failed:', error)
      console.error('❌ [AUTH_PAGE] Error details:', {
        message: error.message,
        code: error.code
      })
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setError('')
    setIsLoading(true)

    try {
      console.log('🔄 [AUTH_PAGE] Starting Google authentication...')
      await loginGoogle()
      console.log('✅ [AUTH_PAGE] Google authentication successful')
      // Navigation will be handled by the useEffect above
    } catch (error) {
      console.error('❌ [AUTH_PAGE] Google authentication failed:', error)
      console.error('❌ [AUTH_PAGE] Error details:', {
        message: error.message,
        code: error.code
      })
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${authPageBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="window max-w-md w-full bg-white/95 backdrop-blur-sm shadow-2xl">
        <div className="title-bar">
          <div className="title-bar-text">🔐 RetroVault Login Portal</div>
          <div className="title-bar-controls">
            <button aria-label="Minimize"></button>
            <button aria-label="Maximize"></button>
            <button aria-label="Close"></button>
          </div>
        </div>
        
        <div className="window-body">
          {/* Tab Switcher */}
          <div className="flex mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 mr-2 py-2 px-4 text-sm font-bold ${isLogin ? 'retro-tab-active' : 'retro-tab-inactive'}`}
            >
              🔑 Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 ml-2 py-2 px-4 text-sm font-bold ${!isLogin ? 'retro-tab-active' : 'retro-tab-inactive'}`}
            >
              📝 Sign Up
            </button>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {!isLogin && (
              <div className="field-row">
                <label className="text-sm font-bold text-gray-700">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="field w-full"
                  placeholder="Enter your name"
                  required={!isLogin}
                />
              </div>
            )}

            <div className="field-row">
              <label className="text-sm font-bold text-gray-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field w-full"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="field-row">
              <label className="text-sm font-bold text-gray-700">Password</label>
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

            <button
              type="submit"
              disabled={isLoading}
              className="retro-button w-full py-2 text-lg font-bold"
            >
              {isLoading ? '⏳ Processing...' : (isLogin ? '🔑 Login' : '📝 Create Account')}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-400"></div>
            <span className="px-4 text-sm text-gray-600 font-bold">or</span>
            <div className="flex-1 border-t border-gray-400"></div>
          </div>

          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="retro-google-button w-full py-3 text-lg font-bold"
          >
            {isLoading ? '⏳ Processing...' : '🔑 Sign in with Google'}
          </button>

          {/* Back to Landing */}
          <div className="text-center mt-4">
            <a 
              href="/" 
              className="text-sm text-blue-600 hover:underline"
            >
              ← Back to RetroVault Home
            </a>
          </div>
        </div>
        
        <div className="status-bar">
          <div className="status-bar-field">💾 Your finances, securely stored — Windows 98 style.</div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage
