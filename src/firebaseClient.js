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

// Debug Firebase configuration
console.log('🔧 [FIREBASE] Configuration check:', {
  hasApiKey: !!firebaseConfig.apiKey,
  hasAuthDomain: !!firebaseConfig.authDomain,
  hasProjectId: !!firebaseConfig.projectId,
  hasStorageBucket: !!firebaseConfig.storageBucket,
  hasMessagingSenderId: !!firebaseConfig.messagingSenderId,
  hasAppId: !!firebaseConfig.appId,
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
})

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

// Add Firestore connection debugging
console.log('🔧 [FIRESTORE] Database initialized:', db.app.name)
console.log('🔧 [FIRESTORE] Database settings:', db.settings)

// Test Firestore connection
const testFirestoreConnection = async () => {
  try {
    console.log('🔧 [FIRESTORE] Testing connection...')
    const testDoc = doc(db, 'test', 'connection')
    await getDoc(testDoc)
    console.log('✅ [FIRESTORE] Connection test successful')
  } catch (error) {
    console.error('❌ [FIRESTORE] Connection test failed:', error)
    console.error('❌ [FIRESTORE] Error code:', error.code)
    console.error('❌ [FIRESTORE] Error message:', error.message)
  }
}

// Run connection test
testFirestoreConnection()

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
    console.log('🔍 [FIRESTORE] Getting user data for:', userId)
    console.log('🔧 [FIRESTORE] Database instance:', db)
    console.log('🔧 [FIRESTORE] Database app:', db.app.name)
    
    const userDocRef = doc(db, 'users', userId)
    console.log('📄 [FIRESTORE] Document reference created:', userDocRef.path)
    
    const userDoc = await getDoc(userDocRef)
    console.log('📄 [FIRESTORE] Document exists:', userDoc.exists())
    console.log('📄 [FIRESTORE] Document metadata:', userDoc.metadata)
    
    if (userDoc.exists()) {
      const data = { id: userDoc.id, ...userDoc.data() }
      console.log('📊 [FIRESTORE] User data retrieved:', data)
      return data
    }
    console.log('📄 [FIRESTORE] No user document found')
    return null
  } catch (error) {
    console.error('❌ [FIRESTORE] Error getting user data:', error)
    console.error('❌ [FIRESTORE] Error code:', error.code)
    console.error('❌ [FIRESTORE] Error message:', error.message)
    console.error('❌ [FIRESTORE] Error stack:', error.stack)
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
    console.log('🔍 [FIRESTORE] Getting transactions for user:', userId)
    console.log('🔧 [FIRESTORE] Limit count:', limitCount)
    
    const transactionsRef = collection(db, 'users', userId, 'transactions')
    console.log('📄 [FIRESTORE] Collection reference:', transactionsRef.path)
    
    const q = query(transactionsRef, orderBy('date', 'desc'), limit(limitCount))
    console.log('🔍 [FIRESTORE] Query created:', q)
    
    const transactionsSnapshot = await getDocs(q)
    console.log('📊 [FIRESTORE] Transactions snapshot size:', transactionsSnapshot.size)
    console.log('📊 [FIRESTORE] Transactions snapshot empty:', transactionsSnapshot.empty)
    
    const transactions = transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    console.log('📊 [FIRESTORE] Transactions retrieved:', transactions.length)
    
    return transactions
  } catch (error) {
    console.error('❌ [FIRESTORE] Error getting user transactions:', error)
    console.error('❌ [FIRESTORE] Error code:', error.code)
    console.error('❌ [FIRESTORE] Error message:', error.message)
    console.error('❌ [FIRESTORE] Error stack:', error.stack)
    throw error
  }
}

/**
 * Sync Nessie data to Firestore via backend API
 */
export const syncNessieData = async (userId, userInfo, forceRefresh = false) => {
  try {
    const response = await fetch('/api/syncNessieToFirestore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        userInfo,
        forceRefresh
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
