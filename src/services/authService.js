// Unified Authentication Service for RetroVault
// Handles all authentication flows with consistent data seeding

import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut 
} from 'firebase/auth'
import { auth } from '../firebaseClient'
import { getUserProfile } from '../api/unifiedFirestoreService'

/**
 * Unified Authentication Service
 * Handles all auth flows with consistent data management
 */
export class AuthService {
  constructor() {
    this.isLoading = false
    this.error = null
  }

  /**
   * Main authentication method - handles both new and existing users
   * @param {string} method - 'google' | 'email' | 'signup'
   * @param {Object} credentials - { email, password, displayName }
   * @returns {Promise<Object>} Auth result with user data
   */
  async authenticate(method, credentials = {}) {
    this.isLoading = true
    this.error = null

    try {
      let authResult

      // Step 1: Authenticate with Firebase
      switch (method) {
        case 'google':
          authResult = await this.signInWithGoogle()
          break
        case 'email':
          authResult = await this.signInWithEmail(credentials.email, credentials.password)
          break
        case 'signup':
          authResult = await this.signUpWithEmail(credentials.email, credentials.password, credentials.displayName)
          break
        default:
          throw new Error('Invalid authentication method')
      }

      const user = authResult.user
      console.log(`✅ Authentication successful: ${user.displayName || user.email}`)

      // Step 2: Check user data and handle seeding
      const userDataResult = await this.handleUserData(user)
      
      return {
        success: true,
        user,
        ...userDataResult
      }

    } catch (error) {
      console.error('❌ Authentication error:', error)
      this.error = error.message
      throw error
    } finally {
      this.isLoading = false
    }
  }

  /**
   * Google Sign-In
   */
  async signInWithGoogle() {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    
    return await signInWithPopup(auth, provider)
  }

  /**
   * Email Sign-In
   */
  async signInWithEmail(email, password) {
    return await signInWithEmailAndPassword(auth, email, password)
  }

  /**
   * Email Sign-Up
   */
  async signUpWithEmail(email, password, displayName) {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    
    if (displayName) {
      await result.user.updateProfile({ displayName })
    }
    
    return result
  }

  /**
   * Handle user data after authentication
   * Determines if user is new or existing and handles data accordingly
   */
  async handleUserData(user) {
    try {
      console.log('🔍 Checking user data status...')
      
      // Check if user profile exists
      const userProfile = await getUserProfile(user.uid)
      
      if (userProfile) {
        // Existing user - check data consistency
        console.log('👤 Existing user found')
        
        if (this.isDataConsistent(userProfile)) {
          console.log('✅ User data is consistent, no action needed')
          return {
            status: 'existing',
            message: 'Welcome back! Your data is up to date.',
            userProfile,
            needsSeeding: false
          }
        } else {
          console.log('🔄 User data needs refresh')
          return {
            status: 'existing',
            message: 'Your data will be refreshed.',
            userProfile,
            needsSeeding: true
          }
        }
      } else {
        // New user - needs data seeding
        console.log('🆕 New user detected, initiating data seeding...')
        return {
          status: 'new',
          message: 'Setting up your account with financial data...',
          needsSeeding: true
        }
      }

    } catch (error) {
      console.error('❌ Error handling user data:', error)
      throw error
    }
  }

  /**
   * Check if user data is consistent and up-to-date
   */
  isDataConsistent(userProfile) {
    // Check if user has the latest data version
    if (userProfile.metadata?.dataVersion !== '2.0') {
      return false
    }

    // Check if data source is properly set
    if (!userProfile.dataSource || userProfile.dataSource === 'Pending') {
      return false
    }

    // Check if sync status is consistent
    if (!userProfile.syncStatus?.isConsistent) {
      return false
    }

    // Check if user has been seeded recently (within last 5 minutes)
    if (userProfile.syncStatus?.lastSync) {
      const lastSync = userProfile.syncStatus.lastSync.toDate ? 
        userProfile.syncStatus.lastSync.toDate() : 
        new Date(userProfile.syncStatus.lastSync)
      
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      if (lastSync > fiveMinutesAgo) {
        return true // Recently seeded, don't re-seed
      }
    }

    return true
  }

  /**
   * Sign out user
   */
  async signOut() {
    try {
      this.isLoading = true
      await firebaseSignOut(auth)
      console.log('👋 User signed out successfully')
      return { success: true }
    } catch (error) {
      console.error('❌ Sign out error:', error)
      this.error = error.message
      throw error
    } finally {
      this.isLoading = false
    }
  }

  /**
   * Get current loading state
   */
  getLoadingState() {
    return {
      isLoading: this.isLoading,
      error: this.error
    }
  }
}

// Export singleton instance
export const authService = new AuthService()

// Export individual methods for backward compatibility
export const authenticate = (method, credentials) => authService.authenticate(method, credentials)
export const signOut = () => authService.signOut()
export const getLoadingState = () => authService.getLoadingState()
