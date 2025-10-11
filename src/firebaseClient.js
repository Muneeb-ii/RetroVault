// Firebase Client SDK Configuration
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore'

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

// Google Auth Provider
const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
  prompt: 'select_account'
})

/**
 * Sign in with Google
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user
    
    console.log('User signed in:', user.displayName)
    return {
      success: true,
      user: {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL
      }
    }
  } catch (error) {
    console.error('Error signing in with Google:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Sign out
 */
export const signOutUser = async () => {
  try {
    await signOut(auth)
    console.log('User signed out')
    return { success: true }
  } catch (error) {
    console.error('Error signing out:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get current user
 */
export const getCurrentUser = () => {
  return auth.currentUser
}

/**
 * Listen to auth state changes
 */
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback)
}

/**
 * Get user data from Firestore
 */
export const getUserData = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() }
    }
    return null
  } catch (error) {
    console.error('Error getting user data:', error)
    throw error
  }
}

/**
 * Get user accounts from Firestore
 */
export const getUserAccounts = async (userId) => {
  try {
    const accountsSnapshot = await getDocs(collection(db, 'users', userId, 'accounts'))
    return accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error getting user accounts:', error)
    throw error
  }
}

/**
 * Get user transactions from Firestore
 */
export const getUserTransactions = async (userId, limitCount = 50) => {
  try {
    const transactionsRef = collection(db, 'users', userId, 'transactions')
    const q = query(transactionsRef, orderBy('date', 'desc'), limit(limitCount))
    const transactionsSnapshot = await getDocs(q)
    return transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error getting user transactions:', error)
    throw error
  }
}

/**
 * Sync Nessie data to Firestore via backend API
 */
export const syncNessieData = async (userId, userInfo) => {
  try {
    const response = await fetch('/api/syncNessieToFirestore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        userInfo
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('Nessie sync result:', result)
    return result
  } catch (error) {
    console.error('Error syncing Nessie data:', error)
    throw error
  }
}

/**
 * Update user document
 */
export const updateUserDocument = async (userId, data) => {
  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      ...data,
      lastSync: new Date()
    })
    console.log('User document updated')
  } catch (error) {
    console.error('Error updating user document:', error)
    throw error
  }
}

/**
 * Create user document
 */
export const createUserDocument = async (userId, userData) => {
  try {
    const userRef = doc(db, 'users', userId)
    await setDoc(userRef, {
      ...userData,
      createdAt: new Date(),
      lastSync: new Date()
    })
    console.log('User document created')
  } catch (error) {
    console.error('Error creating user document:', error)
    throw error
  }
}

/**
 * Get sample profiles
 */
export const getSampleProfiles = async () => {
  try {
    const sampleProfilesSnapshot = await getDocs(collection(db, 'sampleProfiles'))
    return sampleProfilesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error getting sample profiles:', error)
    throw error
  }
}

export default app
