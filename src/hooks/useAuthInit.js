// Simplified Authentication Hook for RetroVault
// Uses the new unified authentication service

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'

export const useAuthInit = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const signInAndSeedIfNeeded = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Use the unified authentication service
      const result = await authService.authenticate('google')
      
      if (result.success) {
        console.log('✅ Authentication successful:', result.message)
        navigate('/dashboard')
        return result
      } else {
        throw new Error(result.error || 'Authentication failed')
      }

    } catch (error) {
      console.error('❌ Authentication error:', error)
      setError(error.message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signInWithEmail = async (email, password) => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await authService.authenticate('email', { email, password })
      
      if (result.success) {
        console.log('✅ Email sign-in successful:', result.message)
        navigate('/dashboard')
        return result
      } else {
        throw new Error(result.error || 'Email sign-in failed')
      }

    } catch (error) {
      console.error('❌ Email sign-in error:', error)
      setError(error.message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signUpWithEmail = async (email, password, displayName) => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await authService.authenticate('signup', { email, password, displayName })
      
      if (result.success) {
        console.log('✅ Email sign-up successful:', result.message)
        navigate('/dashboard')
        return result
      } else {
        throw new Error(result.error || 'Email sign-up failed')
      }

    } catch (error) {
      console.error('❌ Email sign-up error:', error)
      setError(error.message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setIsLoading(true)
      await authService.signOut()
      console.log('👋 User signed out')
      navigate('/')
    } catch (error) {
      console.error('❌ Sign out error:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    signInAndSeedIfNeeded,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    isLoading,
    error
  }
}
