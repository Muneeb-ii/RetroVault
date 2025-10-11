// Authentication initialization hook for RetroVault
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut 
} from 'firebase/auth'
import { auth, db } from '../firebaseClient'
import { doc, getDoc } from 'firebase/firestore'

export const useAuthInit = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const signInAndSeedIfNeeded = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Step 1: Google Sign-In
      console.log('🔄 Initiating Google Sign-In...')
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({
        prompt: 'select_account'
      })
      
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      console.log('✅ Google Sign-In successful:', user.displayName)

      // Step 2: Check if user document exists in Firestore
      console.log('🔍 Checking user document in Firestore...')
      const userDocRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        // User exists - returning user
        console.log('👤 Returning user found, skipping Nessie sync')
        navigate('/dashboard')
        return { status: 'existing', user }
      } else {
        // New user - seed data from Nessie API
        console.log('🆕 New user detected, seeding data from Nessie API...')
        
        const response = await fetch('/api/syncNessieToFirestore', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.uid,
            userInfo: {
              name: user.displayName,
              email: user.email,
              photoURL: user.photoURL
            }
          })
        })

        if (!response.ok) {
          throw new Error(`Backend sync failed: ${response.status}`)
        }

        const result = await response.json()
        console.log('✅ Nessie data seeded successfully:', result)
        
        navigate('/dashboard')
        return { status: 'seeded', user, result }
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
    setIsLoading(true)
    setError(null)

    try {
      console.log('🔄 Signing in with email...')
      const result = await signInWithEmailAndPassword(auth, email, password)
      const user = result.user
      console.log('✅ Email Sign-In successful:', user.email)

      // Check if user document exists and handle seeding
      return await handleUserDataCheck(user)
    } catch (error) {
      console.error('❌ Email sign-in error:', error)
      setError(error.message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signUpWithEmail = async (email, password, displayName) => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('🔄 Creating account with email...')
      const result = await createUserWithEmailAndPassword(auth, email, password)
      const user = result.user
      
      // Update display name if provided
      if (displayName) {
        await user.updateProfile({ displayName })
      }
      
      console.log('✅ Email Sign-Up successful:', user.email)

      // Check if user document exists and handle seeding
      return await handleUserDataCheck(user)
    } catch (error) {
      console.error('❌ Email sign-up error:', error)
      setError(error.message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserDataCheck = async (user) => {
    try {
      // Check if user document exists in Firestore
      console.log('🔍 Checking user document in Firestore...')
      const userDocRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        // User exists - returning user
        console.log('👤 Returning user found, skipping Nessie sync')
        navigate('/dashboard')
        return { status: 'existing', user }
      } else {
        // New user - seed data from Nessie API
        console.log('🆕 New user detected, seeding data from Nessie API...')
        
        const response = await fetch('/api/syncNessieToFirestore', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.uid,
            userInfo: {
              name: user.displayName || user.email,
              email: user.email,
              photoURL: user.photoURL
            }
          })
        })

        if (!response.ok) {
          throw new Error(`Backend sync failed: ${response.status}`)
        }

        const result = await response.json()
        console.log('✅ Nessie data seeded successfully:', result)
        
        navigate('/dashboard')
        return { status: 'seeded', user, result }
      }
    } catch (error) {
      console.error('❌ User data check error:', error)
      setError(error.message)
      throw error
    }
  }

  const signOut = async () => {
    try {
      setIsLoading(true)
      await firebaseSignOut(auth)
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
