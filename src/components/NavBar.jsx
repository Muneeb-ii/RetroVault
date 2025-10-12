// Navigation bar component for RetroVault
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebaseClient'
import { useAuthInit } from '../hooks/useAuthInit'
import { play as playSound } from '../utils/soundPlayer'

const NavBar = () => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const { signInAndSeedIfNeeded, signOut, isLoading: authLoading } = useAuthInit()
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
    })
    return unsubscribe
  }, [])

  const handleSignIn = () => {
    try { playSound('click1') } catch (e) {}
    navigate('/auth')
  }

  const handleSignOut = async () => {
    try {
      setIsLoading(true)
      await signOut()
      playSound('logoff')
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDashboard = () => {
    try { playSound('click1') } catch (e) {}
    navigate('/dashboard')
  }

  // Smooth-scroll handler for in-page anchors to avoid full page reloads
  const handleScrollTo = (e, id) => {
    e.preventDefault()
    try { playSound('click1') } catch (err) {}
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    } else {
      // if element not found, just navigate home then scroll
      navigate('/')
      setTimeout(() => {
        const el2 = document.getElementById(id)
        if (el2) el2.scrollIntoView({ behavior: 'smooth' })
      }, 200)
    }
  }

  return (
    <nav className="bg-gray-200 border-b-2 border-gray-400 shadow-lg">
  <div className="w-full px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Left: Brand */}
          <Link to="/" onClick={() => { try { playSound('click1') } catch (e) {} }} className="flex items-center space-x-2 text-lg font-bold text-gray-800 hover:text-blue-600 transition-colors">
            <span className="text-2xl">■</span>
            <span>RetroVault</span>
          </Link>

          {/* Center: Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <a href="#features" onClick={(e) => handleScrollTo(e, 'features')} className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
              Features
            </a>
            <a href="#howitworks" onClick={(e) => handleScrollTo(e, 'howitworks')} className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
              How it works
            </a>
            <a href="#contact" onClick={(e) => handleScrollTo(e, 'contact')} className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
              Contact
            </a>
          </div>

          {/* Right: Auth Buttons */}
          <div className="flex items-center space-x-2">
            {user ? (
              <>
                <button
                  onClick={handleDashboard}
                  className="retro-button px-4 py-2 text-sm font-medium"
                  disabled={isLoading || authLoading}
                >
                  Dashboard
                </button>
                <button
                  onClick={handleSignOut}
                  className="retro-button px-4 py-2 text-sm font-medium"
                  disabled={isLoading || authLoading}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={handleSignIn}
                className="retro-button px-4 py-2 text-sm font-medium"
                disabled={isLoading || authLoading}
              >
                {isLoading || authLoading ? 'Processing...' : 'Sign In'}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
          <div className="md:hidden mt-2 pt-2 border-t border-gray-400">
          <div className="flex flex-wrap gap-2">
            <a href="#features" onClick={(e) => handleScrollTo(e, 'features')} className="text-xs text-gray-700 hover:text-blue-600">Features</a>
            <a href="#howitworks" onClick={(e) => handleScrollTo(e, 'howitworks')} className="text-xs text-gray-700 hover:text-blue-600">How it works</a>
            <a href="#contact" onClick={(e) => handleScrollTo(e, 'contact')} className="text-xs text-gray-700 hover:text-blue-600">Contact</a>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default NavBar
