// Protected route component for RetroVault
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebaseClient'

const ProtectedRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('🔒 User authenticated, allowing access to protected route')
        setIsAuthenticated(true)
        setIsLoading(false)
      } else {
        console.log('🚫 User not authenticated, redirecting to landing')
        setIsAuthenticated(false)
        setIsLoading(false)
        // Add a small delay to prevent race conditions with data loading
        setTimeout(() => {
          navigate('/')
        }, 100)
      }
    })

    return unsubscribe
  }, [navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="window">
          <div className="title-bar">
            <div className="title-bar-text">RetroVault</div>
            <div className="title-bar-controls">
              <button aria-label="Minimize"></button>
              <button aria-label="Maximize"></button>
              <button aria-label="Close"></button>
            </div>
          </div>
          <div className="window-body">
            <div className="text-center">
              <div className="text-lg font-bold mb-2">💾 Processing...</div>
              <div className="text-sm text-gray-600">Please Wait</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to landing page
  }

  return children
}

export default ProtectedRoute
